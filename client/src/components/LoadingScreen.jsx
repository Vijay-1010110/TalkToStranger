import React, { useState, useEffect } from 'react';

export default function LoadingScreen({ status = 'Initializing P2P network...', onSkip }) {
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkip(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0f172a] z-50 flex flex-col items-center justify-center p-6 text-center select-none font-mono">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
        <h1 className="text-sm font-bold tracking-widest text-white uppercase">
          Talk To Stranger
        </h1>
        <span className="text-[10px] text-slate-400 border border-[#334155] px-1 rounded">
          P2P
        </span>
      </div>

      <div className="w-36 h-0.5 bg-[#1e293b] overflow-hidden rounded relative mb-3">
        <div className="w-1/2 h-full bg-sky-400 animate-[slide_1.2s_ease-in-out_infinite]"></div>
      </div>

      <p className="text-[11px] text-slate-400 mb-4">
        {status}
      </p>

      {showSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-1.5 rounded-full bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-sky-400 border border-sky-500/30 shadow-lg cursor-pointer transition-all"
        >
          Enter Site Now →
        </button>
      )}

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
