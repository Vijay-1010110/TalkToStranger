import React from 'react';
import { X } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Esc', desc: 'Skip to next stranger (or cancel search)' },
    { key: 'Enter', desc: 'Send chat message' },
    { key: 'Space', desc: 'Start search from home screen' },
    { key: 'M', desc: 'Toggle microphone mute / unmute' },
    { key: 'V', desc: 'Toggle camera on / off' },
    { key: 'L', desc: 'Leave chat and return to home' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg max-w-xs w-full p-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222] mb-3">
          <span className="font-mono text-xs font-bold text-white uppercase">
            Shortcuts
          </span>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="flex items-center justify-between text-xs">
              <span className="text-[#888888]">{sc.desc}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] border border-[#333333] text-white font-mono text-[11px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#334155] text-[10px] font-mono text-slate-400 text-center">
          <span>Tester mode: 5-click logo or open with ?test=1</span>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-1.5 rounded bg-white hover:bg-[#e0e0e0] text-black font-semibold text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
