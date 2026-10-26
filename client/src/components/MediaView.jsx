import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, VideoOff, Wifi, Columns, Square, Maximize2 } from 'lucide-react';

export default function MediaView({
  mode,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  isLocalSpeaking,
  isRemoteSpeaking,
  connectionState,
  isDataChannelReady,
  partnerTier,
  partnerGender
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [objectFit, setObjectFit] = useState('contain'); // 'contain' for zero crop or 'cover' for full bleed
  const [canvasLayout, setCanvasLayout] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stranger_video_layout') || 'pip';
    }
    return 'pip';
  }); // 'pip' (normal: stranger large, self small) | 'split' (equal 50/50 size)

  // Toggle layout mode
  const toggleLayout = () => {
    setCanvasLayout((prev) => {
      const next = prev === 'pip' ? 'split' : 'pip';
      if (typeof window !== 'undefined') {
        localStorage.setItem('stranger_video_layout', next);
      }
      return next;
    });
  };

  // Sync local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, canvasLayout]);

  // Sync remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, canvasLayout]);

  // Gender indicator helper
  const renderGenderIcon = (gender) => {
    if (gender === 'male') return <span className="text-blue-400 font-mono">♂ Male</span>;
    if (gender === 'female') return <span className="text-pink-400 font-mono">♀ Female</span>;
    if (gender === 'other') return <span className="text-emerald-400 font-mono">🧑 Other</span>;
    return null;
  };

  if (mode === 'chat') {
    return null;
  }

  // --- AUDIO CALL MODE ---
  if (mode === 'audio') {
    return (
      <div className="w-full h-full min-h-[180px] flex items-center justify-center p-3 sm:p-6 bg-[#0f172a]">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-sm">
          
          {/* Stranger Card */}
          <div className={`p-3 sm:p-4 rounded-lg border flex flex-col items-center justify-center transition-colors shadow-sm ${
            isRemoteSpeaking ? 'border-sky-400 bg-[#1e293b]' : 'border-[#334155] bg-[#162032]'
          }`}>
            <div className="text-[10px] sm:text-xs font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
              <span>Stranger</span>
              {renderGenderIcon(partnerGender)}
              {partnerTier === 'priority' && (
                <span className="text-[8px] bg-white text-slate-900 px-1 rounded font-bold">VERIFIED</span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white">
              {isRemoteSpeaking ? 'Speaking' : 'Listening'}
            </div>
            {/* Hidden audio element for remote stream */}
            <audio ref={remoteVideoRef} autoPlay playsInline />
          </div>

          {/* You Card */}
          <div className={`p-3 sm:p-4 rounded-lg border flex flex-col items-center justify-center transition-colors shadow-sm ${
            isLocalSpeaking && !isMuted ? 'border-sky-400 bg-[#1e293b]' : 'border-[#334155] bg-[#162032]'
          }`}>
            <div className="text-[10px] sm:text-xs font-mono uppercase text-slate-400 mb-1">
              You
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1">
              {isMuted ? (
                <span className="text-red-400 flex items-center gap-1 text-xs">
                  <MicOff className="w-3 h-3" /> Muted
                </span>
              ) : isLocalSpeaking ? (
                'Speaking'
              ) : (
                'Mic Active'
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- VIDEO CHAT MODE ---
  return (
    <div className="relative w-full h-full min-h-[200px] flex-1 bg-[#0b101c] flex items-center justify-center overflow-hidden select-none">
      
      {/* Top Floating Control Toolbar */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 pointer-events-auto">
        {/* Layout Switcher (Equal 50/50 vs Normal PiP) */}
        <button
          type="button"
          onClick={toggleLayout}
          title={canvasLayout === 'pip' ? 'Switch to Equal 50/50 Split Canvas' : 'Switch to Normal PiP Canvas'}
          className="px-2.5 py-1 rounded bg-[#1e293b]/90 border border-[#334155] hover:border-[#64748b] text-[10px] font-mono text-white flex items-center gap-1.5 transition-all shadow-md backdrop-blur-sm"
        >
          {canvasLayout === 'pip' ? (
            <>
              <Columns className="w-3 h-3 text-sky-400" />
              <span>EQUAL 50:50</span>
            </>
          ) : (
            <>
              <Square className="w-3 h-3 text-sky-400" />
              <span>NORMAL PIP</span>
            </>
          )}
        </button>

        {/* Fit / Fill Toggle */}
        <button
          onClick={() => setObjectFit(prev => prev === 'cover' ? 'contain' : 'cover')}
          title={objectFit === 'cover' ? 'Fit video to frame' : 'Fill entire frame'}
          className="px-2 py-1 rounded bg-[#1e293b]/90 border border-[#334155] text-[10px] font-mono text-slate-300 hover:text-white backdrop-blur-sm"
        >
          {objectFit === 'cover' ? 'FIT' : 'FILL'}
        </button>

        {/* P2P Indicator */}
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e293b]/90 border border-[#334155] text-[10px] font-mono text-slate-300 backdrop-blur-sm">
          <Wifi className="w-2.5 h-2.5 text-emerald-400" />
          <span className="hidden xs:inline">P2P</span>
        </div>
      </div>

      {/* --- EQUAL SIZE (50/50 SPLIT) CANVAS --- */}
      {canvasLayout === 'split' ? (
        <div className="w-full h-full p-2 grid grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1 gap-2 bg-[#0b101c]">
          
          {/* Target (Stranger) Pane - 50% */}
          <div className="relative w-full h-full rounded-lg border border-[#334155] bg-[#070b14] overflow-hidden flex items-center justify-center shadow-md">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              />
            ) : (
              <div className="text-xs font-mono text-slate-500">
                Connecting video stream...
              </div>
            )}

            {/* Stranger Label Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f172a]/90 border border-[#334155] text-[10px] font-mono text-white backdrop-blur-sm shadow">
              <span className={`w-1.5 h-1.5 rounded-full ${isRemoteSpeaking ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>STRANGER</span>
              {renderGenderIcon(partnerGender)}
              {partnerTier === 'priority' && (
                <span className="text-[8px] bg-white text-slate-900 px-1 rounded font-bold ml-0.5">VERIFIED</span>
              )}
            </div>
          </div>

          {/* Self (You) Pane - 50% */}
          <div className="relative w-full h-full rounded-lg border border-[#334155] bg-[#070b14] overflow-hidden flex items-center justify-center shadow-md">
            {localStream && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full video-mirror ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              />
            ) : (
              <div className="text-xs font-mono text-slate-500 flex flex-col items-center gap-1">
                <VideoOff className="w-5 h-5 text-slate-600" />
                <span>Camera Off</span>
              </div>
            )}

            {/* You Label Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f172a]/90 border border-[#334155] text-[10px] font-mono text-white backdrop-blur-sm shadow">
              <span className={`w-1.5 h-1.5 rounded-full ${isLocalSpeaking && !isMuted ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>YOU</span>
              {isMuted && <span className="text-red-400 text-[9px]">(MUTED)</span>}
            </div>
          </div>

        </div>
      ) : (
        /* --- NORMAL CANVAS (Target Large, Self Small Corner) --- */
        <div className="relative w-full h-full flex items-center justify-center bg-[#0b101c]">
          
          {/* Large Target Video (Stranger) */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              onDoubleClick={() => setObjectFit(prev => prev === 'cover' ? 'contain' : 'cover')}
            />
          ) : (
            <div className="text-xs font-mono text-slate-500">
              Connecting video stream...
            </div>
          )}

          {/* Stranger Status Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f172a]/90 border border-[#334155] text-[10px] sm:text-[11px] font-mono text-white backdrop-blur-sm shadow">
            <span className={`w-1.5 h-1.5 rounded-full ${isRemoteSpeaking ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span>STRANGER</span>
            {renderGenderIcon(partnerGender)}
            {partnerTier === 'priority' && (
              <span className="text-[8px] bg-white text-slate-900 px-1 rounded font-bold ml-0.5">VERIFIED</span>
            )}
          </div>

          {/* Floating Self Video (Picture-in-Picture) */}
          <div
            onClick={toggleLayout}
            title="Click to switch between Equal 50/50 and PiP"
            className="absolute bottom-2 right-2 w-24 xs:w-28 sm:w-36 md:w-44 aspect-video rounded-lg overflow-hidden bg-[#070b14] border border-[#334155] hover:border-sky-400 z-10 shadow-2xl cursor-pointer transition-all"
          >
            {localStream && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover video-mirror"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] sm:text-[10px] text-slate-500 font-mono">
                Cam Off
              </div>
            )}

            <div className="absolute bottom-0.5 left-0.5 px-1 rounded bg-[#0f172a]/90 text-[8px] sm:text-[9px] font-mono text-slate-300">
              YOU {isMuted ? '(MUTED)' : ''}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
