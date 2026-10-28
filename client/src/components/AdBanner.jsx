import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AD_CONFIG } from '../config/ads';

export default function AdBanner({ variant = 'card', className = '' }) {
  const { isPriority } = useAuth();
  const [adBlocked, setAdBlocked] = useState(false);
  const containerRef = useRef(null);

  // If user has Priority Pass or ads are disabled globally, remove all advertisements!
  if (isPriority || !AD_CONFIG.enabled) {
    return null;
  }

  const isAdsterra = AD_CONFIG.provider === 'adsterra';
  const nativeConfig = AD_CONFIG.adsterra?.nativeBanner;

  // Mount Adsterra Native Banner script safely
  useEffect(() => {
    if (!isAdsterra || !nativeConfig?.scriptUrl || variant !== 'card') return;

    try {
      const existingScript = document.querySelector(`script[src="${nativeConfig.scriptUrl}"]`);
      if (!existingScript) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = nativeConfig.scriptUrl;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');

        script.onerror = () => {
          setAdBlocked(true);
        };

        document.body.appendChild(script);
      }
    } catch (err) {
      console.warn('[AdBanner] Failed to load ad script:', err);
      setAdBlocked(true);
    }
  }, [isAdsterra, nativeConfig, variant]);

  // 1. RENDER ADSTERRA NATIVE BANNER (For HomeView / Card slot)
  if (isAdsterra && nativeConfig?.containerId && variant === 'card' && !adBlocked) {
    return (
      <div className={`w-full flex flex-col items-center justify-center my-3 overflow-hidden rounded-lg border border-[#334155] bg-[#1e293b] p-2 shadow-sm ${className}`}>
        <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 px-1 pb-1 border-b border-[#334155]/60 mb-1.5">
          <span>SPONSORED</span>
          <span className="text-slate-500">Adsterra</span>
        </div>
        <div
          id={nativeConfig.containerId}
          className="w-full min-h-[90px] flex items-center justify-center overflow-hidden"
        />
      </div>
    );
  }

  // 2. FALLBACK / CURATED PRIVACY SPONSOR CARDS (For ChatPane or when AdBlock is active)
  const sponsors = AD_CONFIG.fallbackSponsors || [];
  const sponsorIndex = Math.floor(Date.now() / (1000 * 60 * 10)) % (sponsors.length || 1);
  const item = sponsors[sponsorIndex] || {
    title: 'NordVPN - Stay 100% Anonymous',
    tagline: 'Protect your IP address and location while video calling strangers.',
    badge: 'SPONSORED',
    url: 'https://nordvpn.com',
    cta: 'Visit'
  };

  // Inline format for ChatPane
  if (variant === 'inline') {
    return (
      <div className={`px-3 py-1.5 my-1.5 rounded-lg bg-[#1e293b] border border-[#334155] flex items-center justify-between text-[11px] font-sans shadow-sm ${className}`}>
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[9px] font-mono text-sky-400 border border-sky-500/30 px-1 rounded shrink-0">
            {item.badge}
          </span>
          <span className="text-slate-300 truncate">{item.title}</span>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-sky-300 flex items-center gap-1 font-mono text-[10px] ml-2 shrink-0 font-semibold"
        >
          <span>{item.cta || 'Visit'}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    );
  }

  // Bottom micro-banner
  if (variant === 'banner') {
    return (
      <div className={`w-full px-3 py-1.5 bg-[#1e293b] border-t border-[#334155] flex items-center justify-between text-[11px] shrink-0 ${className}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[9px] font-mono text-sky-400 border border-sky-500/30 px-1 py-0.2 rounded shrink-0">
            {item.badge}
          </span>
          <div className="truncate text-slate-300">
            <span className="text-white font-medium mr-1">{item.title}:</span>
            <span className="hidden sm:inline">{item.tagline}</span>
          </div>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-white hover:text-sky-300 flex items-center gap-1 ml-2 shrink-0 font-semibold"
        >
          <span>{item.cta || 'Visit'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  // Fallback card format
  return (
    <div className={`w-full p-3 rounded-lg bg-[#1e293b] border border-[#334155] flex items-center justify-between text-xs mt-3 shadow-sm hover:border-[#475569] transition-colors ${className}`}>
      <div className="overflow-hidden pr-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-mono text-sky-400 border border-sky-500/30 px-1 rounded">
            {item.badge}
          </span>
          <span className="font-semibold text-white truncate">{item.title}</span>
        </div>
        <p className="text-[11px] text-slate-400 truncate">{item.tagline}</p>
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2.5 py-1 rounded bg-[#0f172a] hover:bg-[#334155] text-white font-mono text-[10px] font-semibold flex items-center gap-1 shrink-0 border border-[#334155] transition-colors"
      >
        <span>{item.cta || 'Visit'}</span>
        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
      </a>
    </div>
  );
}
