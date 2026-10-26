import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ status = 'Initializing P2P network...' }) {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col items-center justify-center p-6 text-center select-none font-mono">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
        <h1 className="text-sm font-bold tracking-widest text-white uppercase">
          Talk To Stranger
        </h1>
        <span className="text-[10px] text-[#666666] border border-[#222222] px-1 rounded">
          P2P
        </span>
      </div>

      <div className="w-36 h-0.5 bg-[#181818] overflow-hidden rounded relative mb-3">
        <div className="w-1/2 h-full bg-white animate-[slide_1.2s_ease-in-out_infinite]"></div>
      </div>

      <p className="text-[11px] text-[#777777]">
        {status}
      </p>

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
