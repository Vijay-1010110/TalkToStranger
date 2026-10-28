/**
 * Ad & Monetization Configuration for TalkToStranger
 * 
 * Active Network: Adsterra
 * - Social Bar (interactive notification-style ad)
 * - Native Banner 3:1 (in-page sponsored widget)
 * - Anti-AdBlock fallback to in-house privacy sponsors
 */

export const AD_CONFIG = {
  // Master toggle: set to false to disable all ads globally
  enabled: true,

  // Selected Ad Provider: 'adsterra' | 'a-ads' | 'sponsors'
  provider: 'adsterra',

  // 1. ADSTERRA CREDENTIALS
  adsterra: {
    // Social Bar Script (floating non-intrusive interactive ad)
    socialBarScriptUrl: 'https://bicea.org/14/2095eef6c6547f8b4c69102150c4aa4d',

    // Native Banner 3:1
    nativeBanner: {
      containerId: 'container-3d7bf507891aa663927ad695241840fa',
      scriptUrl: 'https://bicea.org/21/3d7bf507891aa663927ad695241840fa'
    }
  },

  // 2. A-ADS (ANONYMOUS BITCOIN ADS)
  aAds: {
    unitId: ''
  },

  // 3. In-House Curated Sponsors (Default fallback when ad-blocked or loading)
  fallbackSponsors: [
    {
      id: 'nordvpn',
      title: 'NordVPN - Stay 100% Anonymous',
      tagline: 'Hide your real IP address and location while video calling strangers.',
      badge: 'RECOMMENDED',
      url: 'https://nordvpn.com',
      cta: 'Protect IP'
    },
    {
      id: 'duckduckgo',
      title: 'DuckDuckGo Private Search',
      tagline: 'Search the web without being tracked or targeted by ad trackers.',
      badge: 'SPONSORED',
      url: 'https://duckduckgo.com',
      cta: 'Visit'
    },
    {
      id: 'proton',
      title: 'Proton - Privacy by Default',
      tagline: 'End-to-end encrypted mail, VPN, and cloud storage.',
      badge: 'PARTNER',
      url: 'https://proton.me',
      cta: 'Explore'
    },
    {
      id: 'brave',
      title: 'Brave Private Browser',
      tagline: 'Browse 3x faster by automatically blocking annoying ads and trackers.',
      badge: 'SPONSORED',
      url: 'https://brave.com',
      cta: 'Download'
    }
  ]
};
