import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AD_CONFIG } from '../config/ads';
import { checkIsAdBlockActive } from '../utils/adBlockDetector';

const AdContext = createContext({
  adConfig: AD_CONFIG,
  isAdFree: false
});

export function AdProvider({ children, inCall = false }) {
  const { isPriority } = useAuth();
  const isAdFree = Boolean(isPriority || !AD_CONFIG.enabled || inCall);

  // During call, ensure in-call-active class is added to body and actively sweep any floating ad overlays
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (inCall) {
      document.body.classList.add('in-call-active');

      const purgeFloatingAds = () => {
        try {
          // 1. Purge all direct non-#root children of document.body
          const children = Array.from(document.body.children);
          children.forEach((el) => {
            if (el.id !== 'root' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.pointerEvents = 'none';
              try { el.remove(); } catch (e) {}
            }
          });

          // 2. Query any fixed/absolute floating overlays injected by ad networks
          const floatingOverlays = document.querySelectorAll(
            '[class*="bicea"], [id*="bicea"], [class*="adsterra"], [id*="adsterra"], [class*="inpage"], [id*="inpage"], [class*="socialbar"], [id*="socialbar"], [class*="notification-bar"], div[style*="z-index: 2147483647"], div[style*="z-index: 999999"]'
          );
          floatingOverlays.forEach((el) => {
            if (!el.hasAttribute('data-app-modal') && !el.hasAttribute('data-app-overlay')) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.pointerEvents = 'none';
              try { el.remove(); } catch (e) {}
            }
          });
        } catch (e) {}
      };

      purgeFloatingAds();
      const interval = setInterval(purgeFloatingAds, 250);

      // Instant MutationObserver to kill floating ads the exact millisecond they inject
      let observer = null;
      try {
        observer = new MutationObserver(() => {
          purgeFloatingAds();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}

      return () => {
        clearInterval(interval);
        if (observer) {
          try { observer.disconnect(); } catch (e) {}
        }
        document.body.classList.remove('in-call-active');
      };
    } else {
      document.body.classList.remove('in-call-active');
    }
  }, [inCall]);

  // Inject global network scripts (Adsterra Social Bar) ONLY when outside of calls and if user is not Priority
  useEffect(() => {
    if (isAdFree || inCall) {
      // Remove any injected social bar script if active
      const socialScriptUrl = AD_CONFIG.adsterra?.socialBarScriptUrl;
      if (socialScriptUrl) {
        const existing = document.querySelector(`script[src="${socialScriptUrl}"]`);
        if (existing && document.body.contains(existing)) {
          try {
            document.body.removeChild(existing);
          } catch {}
        }
      }
      return;
    }

    // Adsterra Social Bar Script injection (skip if browser has active ad blocker)
    const socialScriptUrl = AD_CONFIG.adsterra?.socialBarScriptUrl;
    if (socialScriptUrl && !checkIsAdBlockActive()) {
      const existing = document.querySelector(`script[src="${socialScriptUrl}"]`);
      if (existing) return;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = socialScriptUrl;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      document.body.appendChild(script);

      return () => {
        try {
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        } catch {}
      };
    }
  }, [isAdFree, inCall]);

  return (
    <AdContext.Provider value={{ adConfig: AD_CONFIG, isAdFree }}>
      {children}
    </AdContext.Provider>
  );
}

export const useAds = () => useContext(AdContext);
