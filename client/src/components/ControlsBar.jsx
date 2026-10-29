import React, { useState, useRef, useEffect } from 'react';
import {
  FastForward,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Square,
  Globe,
  RefreshCw,
  Sliders,
  MessageSquare,
  MoreVertical,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ControlsBar({
  mode,
  onNext,
  onLeave,
  isMuted,
  isVideoOff,
  toggleMute,
  toggleVideo,
  onSwitchCamera,
  onOpenDeviceSettings,
  isWebShareOpen,
  toggleWebShare,
  isChatOpen = false,
  onToggleChat,
  unreadChatCount = 0
}) {
  const { isPriority } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="h-12 sm:h-14 border-t border-[#334155] bg-[#1e293b] px-2.5 sm:px-4 flex items-center justify-between shrink-0 z-20 pb-[env(safe-area-inset-bottom,0px)] shadow-lg relative">
      
      {/* Left Action: Next Stranger */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onNext}
          className="h-8 sm:h-9 px-3 sm:px-4 rounded bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 font-mono shadow-sm cursor-pointer"
          title="Skip to next stranger [Esc]"
        >
          <FastForward className="w-3.5 h-3.5 fill-current" />
          <span>Next</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">[Esc]</span>
        </button>
      </div>

      {/* --- MOBILE / VERTICAL COMPACT CONTROLS (< 768px) --- */}
      <div className="flex md:hidden items-center gap-1.5">
        {/* Chat Toggle Button (with unread badge) */}
        {mode !== 'chat' && onToggleChat && (
          <button
            onClick={onToggleChat}
            className={`relative h-8 px-2.5 rounded border flex items-center gap-1 text-xs font-mono transition-colors cursor-pointer ${
              isChatOpen
                ? 'border-sky-400 bg-sky-950/70 text-sky-200'
                : 'border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white'
            }`}
            title={isChatOpen ? 'Hide Chat' : 'Show Chat'}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">{isChatOpen ? 'Chat' : 'Chat'}</span>
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-bold rounded-full animate-bounce shadow">
                {unreadChatCount}
              </span>
            )}
          </button>
        )}

        {/* Collapsed Media Controls Menu Button */}
        {mode !== 'chat' && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`h-8 px-2.5 rounded border flex items-center gap-1 text-xs font-mono transition-colors cursor-pointer ${
                isMenuOpen
                  ? 'border-sky-400 bg-[#334155] text-white'
                  : isMuted || isVideoOff
                  ? 'border-amber-500/70 bg-amber-500/20 text-amber-300'
                  : 'border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white'
              }`}
              title="Media, Camera & Device Controls"
            >
              {isMuted ? (
                <MicOff className="w-3.5 h-3.5 text-red-400" />
              ) : isVideoOff ? (
                <VideoOff className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Sliders className="w-3.5 h-3.5 text-slate-300" />
              )}
              <span className="text-[11px]">Controls</span>
              <ChevronUp className={`w-3 h-3 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isMenuOpen && (
              <div className="absolute bottom-full mb-2 -left-10 w-52 bg-[#0f172a] border border-[#334155] rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] font-mono text-slate-400 px-2 py-0.5 border-b border-[#334155]/60 mb-0.5 flex justify-between items-center">
                  <span>CALL SETTINGS</span>
                  <span className="text-emerald-400">P2P</span>
                </div>

                {/* Mic Toggle */}
                <button
                  onClick={() => toggleMute()}
                  className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    isMuted
                      ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                      : 'bg-[#1e293b] text-slate-200 hover:bg-[#334155]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isMuted ? 'Muted' : 'Mic Active'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{isMuted ? 'UNMUTE' : 'MUTE'}</span>
                </button>

                {/* Video Toggle */}
                {mode === 'video' && (
                  <>
                    <button
                      onClick={() => toggleVideo()}
                      className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        isVideoOff
                          ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                          : 'bg-[#1e293b] text-slate-200 hover:bg-[#334155]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isVideoOff ? <VideoOff className="w-3.5 h-3.5 text-red-400" /> : <Video className="w-3.5 h-3.5 text-sky-400" />}
                        <span>{isVideoOff ? 'Camera Off' : 'Camera On'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{isVideoOff ? 'START' : 'STOP'}</span>
                    </button>

                    {/* Quick Flip / Switch Camera */}
                    <button
                      onClick={() => { onSwitchCamera(); setIsMenuOpen(false); }}
                      className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-mono bg-[#1e293b] text-slate-200 hover:bg-[#334155] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Flip Camera</span>
                      </span>
                      <span className="text-[10px] text-slate-400">FLIP</span>
                    </button>
                  </>
                )}

                {/* Device Settings Modal */}
                <button
                  onClick={() => { onOpenDeviceSettings(); setIsMenuOpen(false); }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-mono bg-[#1e293b] text-slate-200 hover:bg-[#334155] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Select Devices</span>
                  </span>
                  <span className="text-[10px] text-slate-400">SETUP</span>
                </button>

                {/* Web Co-Browse */}
                <button
                  onClick={() => { toggleWebShare(); setIsMenuOpen(false); }}
                  className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    isWebShareOpen
                      ? 'bg-sky-950/70 text-sky-200 border border-sky-800'
                      : 'bg-[#1e293b] text-slate-200 hover:bg-[#334155]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Web Co-browse</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{isWebShareOpen ? 'CLOSE' : 'OPEN'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- DESKTOP STANDARD CONTROLS (>= 768px) --- */}
      <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
        {mode !== 'chat' && (
          <button
            onClick={toggleMute}
            className={`h-8 w-8 sm:h-9 sm:w-9 rounded border flex items-center justify-center text-xs font-mono transition-colors cursor-pointer ${
              isMuted
                ? 'border-red-600 bg-red-600/20 text-red-400'
                : 'border-[#334155] bg-[#0f172a] text-slate-200 hover:bg-[#334155] hover:text-white'
            }`}
            title="Toggle Mute (M)"
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        {mode === 'video' && (
          <>
            <button
              onClick={toggleVideo}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded border flex items-center justify-center text-xs font-mono transition-colors cursor-pointer ${
                isVideoOff
                  ? 'border-red-600 bg-red-600/20 text-red-400'
                  : 'border-[#334155] bg-[#0f172a] text-slate-200 hover:bg-[#334155] hover:text-white'
              }`}
              title="Toggle Camera (V)"
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>

            {/* Quick Switch / Flip Camera Button */}
            <button
              onClick={() => onSwitchCamera()}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded border border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:bg-[#334155] flex items-center justify-center text-xs font-mono transition-colors cursor-pointer"
              title="Flip / Switch Camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Audio / Video Device Settings & Revoke Modal */}
        {mode !== 'chat' && (
          <button
            onClick={onOpenDeviceSettings}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded border border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:bg-[#334155] flex items-center justify-center text-xs font-mono transition-colors cursor-pointer"
            title="Switch Microphone/Camera or Revoke Access"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}

        {/* External Web Co-Browse Button */}
        <button
          onClick={toggleWebShare}
          className={`h-8 px-2.5 sm:h-9 sm:px-3 rounded border flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
            isWebShareOpen
              ? 'border-sky-400 bg-sky-950/60 text-sky-200'
              : 'border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:border-[#475569]'
          }`}
          title="External Web Co-browsing Interface"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Web</span>
          {isPriority && (
            <span className="text-[9px] text-emerald-400 font-bold hidden sm:inline">P</span>
          )}
        </button>

        {/* Desktop Chat Toggle (Allows hiding chat on desktop too if desired) */}
        {mode !== 'chat' && onToggleChat && (
          <button
            onClick={onToggleChat}
            className={`h-8 px-2.5 sm:h-9 sm:px-3 rounded border flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
              isChatOpen
                ? 'border-sky-400 bg-sky-950/60 text-sky-200'
                : 'border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white'
            }`}
            title={isChatOpen ? 'Hide Chat Pane' : 'Show Chat Pane'}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{isChatOpen ? 'Chat' : 'Chat'}</span>
          </button>
        )}
      </div>

      {/* Right Action: STOP Button */}
      <div>
        <button
          onClick={onLeave}
          className="h-8 sm:h-9 px-3 sm:px-4 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm font-mono flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-red-950/40 cursor-pointer"
          title="Stop call and return directly to Home"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>STOP</span>
        </button>
      </div>

    </div>
  );
}
