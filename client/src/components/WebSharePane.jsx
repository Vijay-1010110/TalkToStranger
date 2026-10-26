import React, { useState } from 'react';
import { Globe, X, ExternalLink, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WebSharePane({
  activeUrl,
  isSharing,
  onShareUrl,
  onStopShare,
  onClose,
  onOpenPriority
}) {
  const { isPriority } = useAuth();
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState('');

  const handleStartShare = (e) => {
    e.preventDefault();
    setError('');

    let clean = inputUrl.trim();
    if (!clean) return;

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    try {
      new URL(clean);
      onShareUrl(clean);
    } catch {
      setError('Please enter a valid URL.');
    }
  };

  // If user is not Priority, show locked prompt
  if (!isPriority) {
    return (
      <div className="h-full w-full bg-[#0d0d0d] border-l border-[#1f1f1f] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#181818] border border-[#2a2a2a] flex items-center justify-center text-white mb-3">
          <Globe className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">
          External Web Interface
        </h4>
        <p className="text-xs text-[#888888] max-w-xs mb-4">
          Co-view live external web links, tools, and shared resources in real-time with your stranger.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPriority}
            className="px-4 py-2 rounded bg-white text-black text-xs font-mono font-semibold hover:bg-[#e0e0e0] transition-colors"
          >
            Unlock with Priority Pass
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded border border-[#2a2a2a] bg-[#141414] text-[#888888] hover:text-white text-xs font-mono"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Priority user co-browse interface
  return (
    <div className="h-full w-full bg-[#0d0d0d] border-l border-[#1f1f1f] flex flex-col">
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-between text-xs font-mono shrink-0">
        <div className="flex items-center gap-1.5 text-white">
          <Globe className="w-3.5 h-3.5" />
          <span className="font-semibold">WEB CO-BROWSE</span>
          <span className="text-[10px] text-emerald-400 border border-emerald-500/30 px-1 rounded">
            PRIORITY
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#888888] hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* URL Input Bar */}
      <form
        onSubmit={handleStartShare}
        className="p-2 border-b border-[#1f1f1f] bg-[#121212] flex items-center gap-1.5 shrink-0"
      >
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter website URL (e.g. wikipedia.org)..."
          className="flex-1 bg-[#181818] border border-[#262626] focus:border-[#444444] rounded px-2.5 py-1 text-xs text-white placeholder-[#555555] outline-none font-mono"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-white text-black font-semibold text-xs font-mono hover:bg-[#e0e0e0] transition-colors shrink-0"
        >
          Share
        </button>
        {isSharing && (
          <button
            type="button"
            onClick={onStopShare}
            className="px-2 py-1 rounded bg-red-950/80 border border-red-800 text-red-300 font-mono text-xs hover:bg-red-900 transition-colors"
          >
            Stop
          </button>
        )}
      </form>

      {error && (
        <div className="p-2 bg-red-950/60 border-b border-red-900 text-red-300 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Shared Web View Frame */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {activeUrl ? (
          <iframe
            src={activeUrl}
            title="Shared Web View"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="text-center p-6 text-[#555555] font-mono text-xs max-w-xs">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active web link shared.</p>
            <p className="mt-1 text-[11px] text-[#444444]">
              Enter a URL above to co-browse with your stranger simultaneously.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
