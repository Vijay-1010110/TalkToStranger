import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, VideoOff, Wifi, Columns, Rows, Square } from 'lucide-react';

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
  partnerGender,
  partnerRegion = 'global'
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [objectFit, setObjectFit] = useState('contain'); // 'contain' for zero crop or 'cover' for full bleed
  const [canvasLayout, setCanvasLayout] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stranger_video_layout');
      if (saved === 'split') return 'vertical';
      return saved || 'vertical';
    }
    return 'vertical';
  }); // 'vertical' (stacked top/bottom) | 'horizontal' (side-by-side) | 'pip' (normal: stranger large, self small)

  // Switch layout mode
  const handleLayoutChange = (nextLayout) => {
    setCanvasLayout(nextLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stranger_video_layout', nextLayout);
    }
  };

  // Sync local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, canvasLayout]);

  // Sync remote stream & ensure play() is called to overcome browser autoplay blocks
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      const playPromise = remoteVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[MediaView] Remote media autoplay paused by browser policy:', err);
        });
      }
    }
  }, [remoteStream, canvasLayout]);

  // Gender indicator helper
  const renderGenderIcon = (gender) => {
    if (gender === 'male') return <span className="text-blue-400 font-mono">♂ Male</span>;
    if (gender === 'female') return <span className="text-pink-400 font-mono">♀ Female</span>;
    if (gender === 'other') return <span className="text-emerald-400 font-mono">🧑 Other</span>;
    return null;
  };

  const renderRegionBadge = (reg) => {
    if (!reg || reg === 'global') return <span className="text-slate-400 font-mono text-[9px]">🌍 Global</span>;
    return <span className="text-sky-300 font-mono font-semibold text-[9px]">📍 {reg.toUpperCase()}</span>;
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

  // Helper for rendering Stranger Video Box
  const renderStrangerPane = () => (
    <div className="relative w-full h-full rounded-lg border border-[#334155] bg-[#070b14] overflow-hidden flex items-center justify-center shadow-md">
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
          onDoubleClick={() => setObjectFit((prev) => (prev === 'cover' ? 'contain' : 'cover'))}
        />
      ) : (
        <div className="text-xs font-mono text-slate-500">
          Connecting video stream...
        </div>
      )}

      {/* Stranger Label Badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f172a]/90 border border-[#334155] text-[10px] font-mono text-white backdrop-blur-sm shadow z-10">
        <span className={`w-1.5 h-1.5 rounded-full ${isRemoteSpeaking ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`}></span>
        <span>STRANGER</span>
        {renderGenderIcon(partnerGender)}
        {renderRegionBadge(partnerRegion)}
        {partnerTier === 'priority' && (
          <span className="text-[8px] bg-white text-slate-900 px-1 rounded font-bold ml-0.5">VERIFIED</span>
        )}
      </div>
    </div>
  );

  // Helper for rendering You (Local) Video Box
  const renderLocalPane = () => (
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
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f172a]/90 border border-[#334155] text-[10px] font-mono text-white backdrop-blur-sm shadow z-10">
        <span className={`w-1.5 h-1.5 rounded-full ${isLocalSpeaking && !isMuted ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
        <span>YOU</span>
        {isMuted && <span className="text-red-400 text-[9px]">(MUTED)</span>}
      </div>
    </div>
  );

  // --- VIDEO CHAT MODE ---
  return (
    <div className="relative w-full h-full min-h-[200px] flex-1 bg-[#0b101c] flex items-center justify-center overflow-hidden select-none isolate z-10">
      
      {/* Top Floating Control Toolbar */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 pointer-events-auto">
        {/* Layout Switcher (Vertical / Side-by-Side / PiP) */}
        <div className="flex items-center rounded-lg bg-[#0f172a]/95 border border-[#334155] p-0.5 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleLayoutChange('vertical')}
            title="Vertical Alignment: Stacked Top & Bottom"
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
              canvasLayout === 'vertical'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Rows className="w-3 h-3" />
            <span className="hidden xs:inline">VERTICAL</span>
          </button>

          <button
            type="button"
            onClick={() => handleLayoutChange('horizontal')}
            title="Side-by-Side Horizontal Alignment"
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
              canvasLayout === 'horizontal'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span className="hidden xs:inline">SIDE-BY-SIDE</span>
          </button>

          <button
            type="button"
            onClick={() => handleLayoutChange('pip')}
            title="Picture-in-Picture: Full stranger with floating local preview"
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
              canvasLayout === 'pip'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Square className="w-3 h-3" />
            <span className="hidden xs:inline">PIP</span>
          </button>
        </div>

        {/* Fit / Fill Toggle */}
        <button
          type="button"
          onClick={() => setObjectFit((prev) => (prev === 'cover' ? 'contain' : 'cover'))}
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

      {/* --- 1. VERTICAL CALL ALIGNMENT (Top: Stranger, Bottom: You) --- */}
      {canvasLayout === 'vertical' && (
        <div className="w-full h-full p-2 grid grid-rows-2 grid-cols-1 gap-2 bg-[#0b101c]">
          {renderStrangerPane()}
          {renderLocalPane()}
        </div>
      )}

      {/* --- 2. HORIZONTAL CALL ALIGNMENT (Left: Stranger, Right: You) --- */}
      {canvasLayout === 'horizontal' && (
        <div className="w-full h-full p-2 grid grid-cols-2 grid-rows-1 gap-2 bg-[#0b101c]">
          {renderStrangerPane()}
          {renderLocalPane()}
        </div>
      )}

      {/* --- 3. PIP CALL ALIGNMENT (Full Stranger, Small Self in Corner) --- */}
      {canvasLayout === 'pip' && (
        <div className="relative w-full h-full flex items-center justify-center bg-[#0b101c]">
          {/* Large Target Video (Stranger) */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              onDoubleClick={() => setObjectFit((prev) => (prev === 'cover' ? 'contain' : 'cover'))}
            />
          ) : (
            <div className="text-xs font-mono text-slate-500">
              Connecting video stream...
            </div>
          )}

          {/* Stranger Status Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f172a]/90 border border-[#334155] text-[10px] sm:text-[11px] font-mono text-white backdrop-blur-sm shadow z-10">
            <span className={`w-1.5 h-1.5 rounded-full ${isRemoteSpeaking ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span>STRANGER</span>
            {renderGenderIcon(partnerGender)}
            {renderRegionBadge(partnerRegion)}
            {partnerTier === 'priority' && (
              <span className="text-[8px] bg-white text-slate-900 px-1 rounded font-bold ml-0.5">VERIFIED</span>
            )}
          </div>

          {/* Floating Self Video (Picture-in-Picture) */}
          <div
            onClick={() => handleLayoutChange('vertical')}
            title="Click to switch to Vertical Alignment"
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
