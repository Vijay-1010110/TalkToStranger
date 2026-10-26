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
      <div className="h-full w-full bg-[#0f172a] border-l border-[#334155] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-sky-400 mb-3 shadow">
          <Globe className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">
          External Web Interface
        </h4>
        <p className="text-xs text-slate-400 max-w-xs mb-4">
          Co-view live external web links, tools, and shared resources in real-time with your stranger.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPriority}
            className="px-4 py-2 rounded bg-white text-slate-900 text-xs font-mono font-bold hover:bg-slate-200 transition-colors shadow"
          >
            Unlock with Priority Pass
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded border border-[#334155] bg-[#1e293b] text-slate-400 hover:text-white text-xs font-mono"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Priority user co-browse interface
  return (
    <div className="h-full w-full bg-[#0f172a] border-l border-[#334155] flex flex-col">
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#334155] bg-[#1e293b] flex items-center justify-between text-xs font-mono shrink-0 shadow-sm">
        <div className="flex items-center gap-1.5 text-white">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold">WEB CO-BROWSE</span>
          <span className="text-[10px] text-emerald-400 border border-emerald-500/30 px-1 rounded">
            PRIORITY
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* URL Input Bar */}
      <form
        onSubmit={handleStartShare}
        className="p-2 border-b border-[#334155] bg-[#1e293b] flex items-center gap-1.5 shrink-0"
      >
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter website URL (e.g. wikipedia.org)..."
          className="flex-1 bg-[#0f172a] border border-[#334155] focus:border-sky-400 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none font-mono"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-white text-slate-900 font-bold text-xs font-mono hover:bg-slate-200 transition-colors shrink-0 shadow-sm"
        >
          Share
        </button>
        {isSharing && (
          <button
            type="button"
            onClick={onStopShare}
            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold transition-colors shadow-sm"
          >
            Stop
          </button>
        )}
      </form>

      {error && (
        <div className="p-2 bg-red-950/60 border-b border-red-800 text-red-300 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Shared Web View Frame */}
      <div className="flex-1 relative bg-[#070b14] flex items-center justify-center overflow-hidden">
        {activeUrl ? (
          <iframe
            src={activeUrl}
            title="Shared Web View"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="text-center p-6 text-slate-500 font-mono text-xs max-w-xs">
            <Globe className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-slate-300 font-semibold">No active web link shared.</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Enter a URL above to co-browse with your stranger simultaneously.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
