import React from 'react';
import { Loader2 } from 'lucide-react';

export default function SearchingView({ mode, onCancel }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
      {/* Clean spinner */}
      <Loader2 className="w-6 h-6 animate-spin text-[#888888] mb-4" />

      <h3 className="text-base font-semibold text-white mb-1 font-mono uppercase">
        Looking for a stranger...
      </h3>
      <p className="text-xs text-[#777777] mb-6 font-sans">
        Matching you with someone in <span className="text-[#cccccc] uppercase font-mono font-semibold">{mode}</span> mode.
      </p>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="px-4 py-2 rounded border border-[#333333] hover:border-[#555555] bg-[#141414] hover:bg-[#202020] text-xs font-mono text-[#cccccc] transition-colors"
      >
        Cancel (Esc)
      </button>
    </div>
  );
}
