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

  // During call, ensure in-call-active class is added to body to suppress all floating ad overlays
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (inCall) {
        document.body.classList.add('in-call-active');
      } else {
        document.body.classList.remove('in-call-active');
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('in-call-active');
      }
    };
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
