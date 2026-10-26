import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SPONSORS = [
  {
    title: 'DuckDuckGo Private Search',
    tagline: 'Search the web without being tracked.',
    url: 'https://duckduckgo.com',
    sponsorLabel: 'SPONSORED'
  },
  {
    title: 'Proton - Privacy by Default',
    tagline: 'End-to-end encrypted email and VPN services.',
    url: 'https://proton.me',
    sponsorLabel: 'PARTNER'
  },
  {
    title: 'Mozilla Firefox',
    tagline: 'Fast, private, and independent browser for everyone.',
    url: 'https://firefox.com',
    sponsorLabel: 'SPONSORED'
  }
];

export default function SponsorCard({ variant = 'card' }) {
  const { isPriority } = useAuth();

  // If user has Priority Pass, all advertising slots are removed!
  if (isPriority) {
    return null;
  }

  // Pick deterministic sponsor based on hour/day
  const sponsorIndex = Math.floor(Date.now() / (1000 * 60 * 15)) % SPONSORS.length;
  const item = SPONSORS[sponsorIndex];

  // Inline subtle chat sponsor
  if (variant === 'inline') {
    return (
      <div className="px-3 py-1.5 my-1.5 rounded bg-[#111111] border border-[#1f1f1f] flex items-center justify-between text-[11px] font-sans">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[9px] font-mono text-[#666666] border border-[#262626] px-1 rounded shrink-0">
            {item.sponsorLabel}
          </span>
          <span className="text-[#999999] truncate">{item.title}</span>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#cccccc] hover:text-white flex items-center gap-1 font-mono text-[10px] ml-2 shrink-0"
        >
          <span>Visit</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    );
  }

  // Micro-banner for mobile/foldable bottom
  if (variant === 'banner') {
    return (
      <div className="w-full px-3 py-1.5 bg-[#0f0f0f] border-t border-[#1a1a1a] flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[9px] font-mono text-[#666666] border border-[#262626] px-1 py-0.2 rounded shrink-0">
            {item.sponsorLabel}
          </span>
          <div className="truncate text-[#888888]">
            <span className="text-white font-medium mr-1">{item.title}:</span>
            <span className="hidden sm:inline">{item.tagline}</span>
          </div>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-[#cccccc] hover:text-white flex items-center gap-0.5 ml-2 shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  // Default card for HomeView / Sidebar
  return (
    <div className="w-full p-2.5 rounded bg-[#111111] border border-[#202020] flex items-center justify-between text-xs mt-3">
      <div className="overflow-hidden pr-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-mono text-[#666666] border border-[#2a2a2a] px-1 rounded">
            {item.sponsorLabel}
          </span>
          <span className="font-semibold text-white truncate">{item.title}</span>
        </div>
        <p className="text-[11px] text-[#777777] truncate">{item.tagline}</p>
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2 py-1 rounded border border-[#2a2a2a] bg-[#161616] hover:bg-[#202020] text-white text-[11px] font-mono flex items-center gap-1 shrink-0 transition-colors"
      >
        <span>Open</span>
        <ExternalLink className="w-3 h-3 text-[#888888]" />
      </a>
    </div>
  );
}
