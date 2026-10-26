import React from 'react';
import { FastForward, Mic, MicOff, Video, VideoOff, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ControlsBar({
  mode,
  onNext,
  onLeave,
  isMuted,
  isVideoOff,
  toggleMute,
  toggleVideo,
  isWebShareOpen,
  toggleWebShare
}) {
  const { isPriority } = useAuth();

  return (
    <div className="h-14 sm:h-16 border-t border-[#1f1f1f] bg-[#0a0a0a] px-3 sm:px-4 flex items-center justify-between shrink-0 z-20 pb-[env(safe-area-inset-bottom,0px)]">
      
      {/* Left Action: Next Stranger */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNext}
          className="h-9 sm:h-10 px-3 sm:px-4 rounded bg-white hover:bg-[#e0e0e0] text-black font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors active:scale-95 font-mono"
        >
          <FastForward className="w-3.5 h-3.5 fill-current" />
          <span>Next</span>
          <span className="text-[10px] text-[#666666] hidden sm:inline">[Esc]</span>
        </button>
      </div>

      {/* Center Media & Co-browse Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {mode !== 'chat' && (
          <button
            onClick={toggleMute}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded border flex items-center justify-center text-xs font-mono transition-colors ${
              isMuted
                ? 'border-red-900 bg-red-950/70 text-red-400'
                : 'border-[#2a2a2a] bg-[#141414] text-[#cccccc] hover:bg-[#202020] hover:text-white'
            }`}
            title="Toggle Mute (M)"
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        {mode === 'video' && (
          <button
            onClick={toggleVideo}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded border flex items-center justify-center text-xs font-mono transition-colors ${
              isVideoOff
                ? 'border-red-900 bg-red-950/70 text-red-400'
                : 'border-[#2a2a2a] bg-[#141414] text-[#cccccc] hover:bg-[#202020] hover:text-white'
            }`}
            title="Toggle Camera (V)"
          >
            {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
        )}

        {/* External Web Co-Browse Button */}
        <button
          onClick={toggleWebShare}
          className={`h-9 px-2.5 sm:h-10 sm:px-3 rounded border flex items-center gap-1.5 text-xs font-mono transition-colors ${
            isWebShareOpen
              ? 'border-white bg-[#222222] text-white'
              : 'border-[#2a2a2a] bg-[#141414] text-[#888888] hover:text-white hover:border-[#444444]'
          }`}
          title="External Web Co-browsing Interface"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Web</span>
          {isPriority && (
            <span className="text-[9px] text-emerald-400 font-bold hidden sm:inline">P</span>
          )}
        </button>
      </div>

      {/* Right Action: Leave */}
      <div>
        <button
          onClick={onLeave}
          className="h-9 sm:h-10 px-2.5 sm:px-3 rounded border border-[#2a2a2a] bg-[#121212] hover:bg-[#1a1a1a] text-[#888888] hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

    </div>
  );
}
