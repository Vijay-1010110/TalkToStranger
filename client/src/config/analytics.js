/**
 * Analytics Configuration for TalkToStranger
 * 
 * Supports:
 * - Google Analytics 4 (GA4): Free, tracks active users, countries, retention.
 * - In-App Event Metrics: Logs key interaction events.
 */

export const ANALYTICS_CONFIG = {
  // Master toggle: set to false to disable analytics
  enabled: true,

  // Google Analytics 4 (GA4) Measurement ID
  gaMeasurementId: 'G-NMHNVGHHEC',

  // Track detailed interaction events (start search, match made, message sent)
  trackEvents: true,
};
