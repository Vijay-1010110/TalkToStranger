import React from 'react';
import { FastForward, Mic, MicOff, Video, VideoOff, Square, Globe, RefreshCw, Sliders, Home } from 'lucide-react';
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
  toggleWebShare
}) {
  const { isPriority } = useAuth();

  return (
    <div className="h-14 sm:h-16 border-t border-[#334155] bg-[#1e293b] px-3 sm:px-4 flex items-center justify-between shrink-0 z-20 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      
      {/* Left Action: Next Stranger */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNext}
          className="h-9 sm:h-10 px-3.5 sm:px-4 rounded bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 font-mono shadow-sm"
          title="Skip to next stranger [Esc]"
        >
          <FastForward className="w-3.5 h-3.5 fill-current" />
          <span>Next</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">[Esc]</span>
        </button>
      </div>

      {/* Center Media & Co-browse Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {mode !== 'chat' && (
          <button
            onClick={toggleMute}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded border flex items-center justify-center text-xs font-mono transition-colors ${
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
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded border flex items-center justify-center text-xs font-mono transition-colors ${
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
              className="h-9 w-9 sm:h-10 sm:w-10 rounded border border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:bg-[#334155] flex items-center justify-center text-xs font-mono transition-colors"
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
            className="h-9 w-9 sm:h-10 sm:w-10 rounded border border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:bg-[#334155] flex items-center justify-center text-xs font-mono transition-colors"
            title="Switch Microphone/Camera or Revoke Access"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}

        {/* External Web Co-Browse Button */}
        <button
          onClick={toggleWebShare}
          className={`h-9 px-2.5 sm:h-10 sm:px-3 rounded border flex items-center gap-1.5 text-xs font-mono transition-colors ${
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
      </div>

      {/* Right Action: STOP Button (Direct redirect to Home) */}
      <div>
        <button
          onClick={onLeave}
          className="h-9 sm:h-10 px-3 sm:px-4 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm font-mono flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-red-950/40"
          title="Stop call and return directly to Home"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>STOP</span>
        </button>
      </div>

    </div>
  );
}
