import React from 'react';
import { Loader2, Square } from 'lucide-react';

export default function SearchingView({ mode, onCancel }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0f172a]">
      {/* Clean animated spinner */}
      <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-4" />

      <h3 className="text-base sm:text-lg font-bold text-white mb-1 font-mono uppercase tracking-wide">
        Looking for a stranger...
      </h3>
      <p className="text-xs text-slate-400 mb-6 font-sans">
        Searching active queue in <span className="text-white uppercase font-mono font-semibold">{mode}</span> mode.
      </p>

      {/* Stop / Cancel button */}
      <button
        onClick={onCancel}
        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold transition-all active:scale-95 shadow flex items-center gap-1.5"
        title="Stop searching and return directly to Home"
      >
        <Square className="w-3 h-3 fill-current" />
        <span>STOP &amp; RETURN HOME [Esc]</span>
      </button>
    </div>
  );
}
