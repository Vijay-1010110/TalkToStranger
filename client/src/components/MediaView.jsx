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
      <div className="w-full h-full min-h-[180px] flex items-center justify-center p-3 sm:p-6 bg-[#0a0a0a]">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-sm">
          
          {/* Stranger Card */}
          <div className={`p-3 sm:p-4 rounded border flex flex-col items-center justify-center transition-colors ${
            isRemoteSpeaking ? 'border-white bg-[#1a1a1a]' : 'border-[#222222] bg-[#121212]'
          }`}>
            <div className="text-[10px] sm:text-xs font-mono uppercase text-[#888888] mb-1 flex items-center gap-1">
              <span>Stranger</span>
              {renderGenderIcon(partnerGender)}
              {partnerTier === 'priority' && (
                <span className="text-[8px] bg-white text-black px-1 rounded font-bold">VERIFIED</span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white">
              {isRemoteSpeaking ? 'Speaking' : 'Listening'}
            </div>
            {/* Hidden audio element for remote stream */}
            <audio ref={remoteVideoRef} autoPlay playsInline />
          </div>

          {/* You Card */}
          <div className={`p-3 sm:p-4 rounded border flex flex-col items-center justify-center transition-colors ${
            isLocalSpeaking && !isMuted ? 'border-white bg-[#1a1a1a]' : 'border-[#222222] bg-[#121212]'
          }`}>
            <div className="text-[10px] sm:text-xs font-mono uppercase text-[#888888] mb-1">
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
    <div className="relative w-full h-full min-h-[200px] flex-1 bg-black flex items-center justify-center overflow-hidden select-none">
      
      {/* Top Floating Control Toolbar */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 pointer-events-auto">
        {/* Layout Switcher (Equal 50/50 vs Normal PiP) */}
        <button
          type="button"
          onClick={toggleLayout}
          title={canvasLayout === 'pip' ? 'Switch to Equal 50/50 Split Canvas' : 'Switch to Normal PiP Canvas'}
          className="px-2 py-0.5 rounded bg-black/85 border border-[#333333] hover:border-[#666666] text-[10px] font-mono text-white flex items-center gap-1 transition-colors shadow-sm"
        >
          {canvasLayout === 'pip' ? (
            <>
              <Columns className="w-3 h-3 text-white" />
              <span>EQUAL 50:50</span>
            </>
          ) : (
            <>
              <Square className="w-3 h-3 text-white" />
              <span>NORMAL PIP</span>
            </>
          )}
        </button>

        {/* Fit / Fill Toggle */}
        <button
          onClick={() => setObjectFit(prev => prev === 'cover' ? 'contain' : 'cover')}
          title={objectFit === 'cover' ? 'Fit video to frame' : 'Fill entire frame'}
          className="px-1.5 py-0.5 rounded bg-black/85 border border-[#333333] text-[10px] font-mono text-[#aaaaaa] hover:text-white"
        >
          {objectFit === 'cover' ? 'FIT' : 'FILL'}
        </button>

        {/* P2P Indicator */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/85 border border-[#333333] text-[10px] font-mono text-[#888888]">
          <Wifi className="w-2.5 h-2.5 text-emerald-500" />
          <span className="hidden xs:inline">P2P</span>
        </div>
      </div>

      {/* --- EQUAL SIZE (50/50 SPLIT) CANVAS --- */}
      {canvasLayout === 'split' ? (
        <div className="w-full h-full p-1.5 sm:p-2 grid grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1 gap-1.5 sm:gap-2">
          
          {/* Target (Stranger) Pane - 50% */}
          <div className="relative w-full h-full rounded border border-[#2b2b2b] bg-[#0c0c0c] overflow-hidden flex items-center justify-center">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              />
            ) : (
              <div className="text-xs font-mono text-[#555555]">
                Connecting video stream...
              </div>
            )}

            {/* Stranger Label Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-[#333333] text-[10px] font-mono text-white">
              <span className={`w-1.5 h-1.5 rounded-full ${isRemoteSpeaking ? 'bg-white animate-pulse' : 'bg-[#666666]'}`}></span>
              <span>STRANGER</span>
              {renderGenderIcon(partnerGender)}
              {partnerTier === 'priority' && (
                <span className="text-[8px] bg-white text-black px-1 rounded font-bold ml-0.5">VERIFIED</span>
              )}
            </div>
          </div>

          {/* Self (You) Pane - 50% */}
          <div className="relative w-full h-full rounded border border-[#2b2b2b] bg-[#0c0c0c] overflow-hidden flex items-center justify-center">
            {localStream && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full video-mirror ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              />
            ) : (
              <div className="text-xs font-mono text-[#555555] flex flex-col items-center gap-1">
                <VideoOff className="w-5 h-5 text-[#444444]" />
                <span>Camera Off</span>
              </div>
            )}

            {/* You Label Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-[#333333] text-[10px] font-mono text-white">
              <span className={`w-1.5 h-1.5 rounded-full ${isLocalSpeaking && !isMuted ? 'bg-white animate-pulse' : 'bg-[#666666]'}`}></span>
              <span>YOU</span>
              {isMuted && <span className="text-red-400 text-[9px]">(MUTED)</span>}
            </div>
          </div>

        </div>
      ) : (
        /* --- NORMAL CANVAS (Target Large, Self Small Corner) --- */
        <div className="relative w-full h-full flex items-center justify-center">
          
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
            <div className="text-xs font-mono text-[#555555]">
              Connecting video stream...
            </div>
          )}

          {/* Stranger Status Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-[#333333] text-[10px] sm:text-[11px] font-mono text-white">
            <span className={`w-1.5 h-1.5 rounded-full ${isRemoteSpeaking ? 'bg-white animate-pulse' : 'bg-[#666666]'}`}></span>
            <span>STRANGER</span>
            {renderGenderIcon(partnerGender)}
            {partnerTier === 'priority' && (
              <span className="text-[8px] bg-white text-black px-1 rounded font-bold ml-0.5">VERIFIED</span>
            )}
          </div>

          {/* Floating Self Video (Picture-in-Picture) */}
          <div
            onClick={toggleLayout}
            title="Click to switch between Equal 50/50 and PiP"
            className="absolute bottom-2 right-2 w-24 xs:w-28 sm:w-36 md:w-44 aspect-video rounded overflow-hidden bg-[#121212] border border-[#333333] hover:border-[#666666] z-10 shadow-lg cursor-pointer transition-all"
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
              <div className="w-full h-full flex items-center justify-center text-[9px] sm:text-[10px] text-[#666666] font-mono">
                Cam Off
              </div>
            )}

            <div className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/80 text-[8px] sm:text-[9px] font-mono text-[#aaaaaa]">
              YOU {isMuted ? '(MUTED)' : ''}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
