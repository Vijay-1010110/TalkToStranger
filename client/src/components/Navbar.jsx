import React from 'react';
import { Volume2, VolumeX, HelpCircle, Shield, User, Crown, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  onlineCount,
  isSoundMuted,
  toggleSound,
  onOpenShortcuts,
  onOpenAuth,
  onOpenPriority,
  appState = 'idle',
  onGoHome
}) {
  const { user, isPriority, isGuest } = useAuth();

  return (
    <header className="h-11 sm:h-12 border-b border-[#334155] bg-[#1e293b] px-3 sm:px-4 flex items-center justify-between z-20 shrink-0 shadow-sm">
      
      {/* Left: Brand & Tier Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onGoHome}
          className="font-mono font-bold text-xs sm:text-sm tracking-wider text-white uppercase hover:text-sky-400 transition-colors flex items-center gap-1.5"
          title="Return to Home"
        >
          <span>Stranger</span>
        </button>

        {appState !== 'idle' && (
          <button
            onClick={onGoHome}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-mono transition-all font-semibold"
            title="Stop and return to Home"
          >
            <Home className="w-3 h-3" />
            <span className="hidden xs:inline">Home</span>
          </button>
        )}
        
        {isPriority ? (
          <span
            onClick={onOpenPriority}
            className="cursor-pointer text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-900 font-bold flex items-center gap-1 hover:bg-[#e5e5e5] transition-colors"
            title="Priority Pass Active"
          >
            <Crown className="w-2.5 h-2.5 fill-current" />
            <span>PRIORITY</span>
          </span>
        ) : (
          <button
            onClick={onOpenPriority}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:border-[#475569] transition-colors"
          >
            Priority
          </button>
        )}
      </div>

      {/* Center: Online count */}
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="hidden xs:inline">{onlineCount.toLocaleString()} online</span>
        <span className="xs:hidden">{onlineCount.toLocaleString()}</span>
      </div>

      {/* Right: User identity & Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* User Account / Guest Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1 px-2 py-1 rounded border border-[#334155] bg-[#0f172a] hover:bg-[#27354a] text-slate-200 hover:text-white text-[11px] font-mono transition-colors"
        >
          <User className="w-3 h-3 text-slate-400" />
          <span className="max-w-[70px] sm:max-w-[110px] truncate">
            {user ? user.username : 'Account'}
          </span>
          {isGuest && (
            <span className="hidden md:inline text-[9px] text-slate-400">(guest)</span>
          )}
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          title={isSoundMuted ? 'Unmute sounds' : 'Mute sounds'}
          className="p-1.5 rounded hover:bg-[#27354a] text-slate-400 hover:text-white transition-colors"
        >
          {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts"
          className="hidden sm:flex p-1.5 rounded hover:bg-[#27354a] text-slate-400 hover:text-white transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

    </header>
  );
}
