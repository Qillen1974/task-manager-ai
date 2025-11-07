/**
 * Google Ads Conversion Tracking Utility
 *
 * This utility provides functions to track conversions in Google Ads campaigns.
 * Requires gtag to be loaded via Google Tag Manager script in layout.tsx
 */

/**
 * Track a subscription conversion event
 * This is called when a user successfully subscribes to a paid plan
 *
 * Conversion ID: AW-1024096280
 * Conversion Label: b6aVCKjTxb4ZEJjwqegD
 */
export function trackSubscriptionConversion() {
  // Check if gtag is available (loaded by Google Tag Manager script)
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-1024096280/b6aVCKjTxb4ZEJjwqegD',
        'value': 1.0,
        'currency': 'SGD'
      });
      console.log('[Analytics] Subscription conversion event tracked');
    } catch (error) {
      console.error('[Analytics] Failed to track conversion event:', error);
    }
  } else {
    console.warn('[Analytics] gtag not available. Conversion event not tracked.');
  }
}

// Extend window type to include gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
