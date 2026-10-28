import { ANALYTICS_CONFIG } from '../config/analytics';

/**
 * Lightweight Analytics Tracker
 * Injects Google Analytics 4 (GA4) dynamically if configured and logs custom app events.
 */

class AnalyticsManager {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined' || !ANALYTICS_CONFIG.enabled) return;

    const measurementId = ANALYTICS_CONFIG.gaMeasurementId;
    if (measurementId && measurementId.startsWith('G-')) {
      try {
        if (!window.gtag && !document.querySelector(`script[src*="${measurementId}"]`)) {
          // Inject Google gtag.js script
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
          document.head.appendChild(script);

          window.dataLayer = window.dataLayer || [];
          function gtag() {
            window.dataLayer.push(arguments);
          }
          gtag('js', new Date());
          gtag('config', measurementId, {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });

          window.gtag = gtag;
        } else if (window.gtag) {
          window.gtag('config', measurementId, {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        }
        this.initialized = true;
        console.log(`[Analytics] Google Analytics 4 active with ID: ${measurementId}`);
      } catch (err) {
        console.warn('[Analytics] Failed to initialize GA4:', err);
      }
    }
  }

  trackEvent(eventName, eventParams = {}) {
    if (!ANALYTICS_CONFIG.enabled || !ANALYTICS_CONFIG.trackEvents) return;

    try {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventParams);
      } else {
        // Local debug tracking
        console.debug(`[Analytics Event] ${eventName}`, eventParams);
      }
    } catch {}
  }

  trackPageView(path = window.location.pathname) {
    this.trackEvent('page_view', { page_path: path });
  }
}

export const analytics = new AnalyticsManager();
