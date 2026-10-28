import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AD_CONFIG } from '../config/ads';

const AdContext = createContext({
  adConfig: AD_CONFIG,
  isAdFree: false
});

export function AdProvider({ children }) {
  const { isPriority } = useAuth();
  const isAdFree = Boolean(isPriority || !AD_CONFIG.enabled);

  // Inject global network scripts (Adsterra Social Bar) if user is not Priority
  useEffect(() => {
    if (isAdFree) return;

    // Adsterra Social Bar Script injection
    const socialScriptUrl = AD_CONFIG.adsterra?.socialBarScriptUrl;
    if (socialScriptUrl) {
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
  }, [isAdFree]);

  return (
    <AdContext.Provider value={{ adConfig: AD_CONFIG, isAdFree }}>
      {children}
    </AdContext.Provider>
  );
}

export const useAds = () => useContext(AdContext);
