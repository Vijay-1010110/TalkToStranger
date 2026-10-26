import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, VideoOff, Wifi, Maximize2, Minimize2 } from 'lucide-react';

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
  partnerTier
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [objectFit, setObjectFit] = useState('contain'); // 'contain' for zero crop or 'cover' for full bleed

  // Sync local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Sync remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
      
      {/* Remote Video (Stranger) */}
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
        {partnerTier === 'priority' && (
          <span className="text-[8px] bg-white text-black px-1 rounded font-bold ml-0.5">VERIFIED</span>
        )}
      </div>

      {/* Fit/Fill Toggle & P2P State */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button
          onClick={() => setObjectFit(prev => prev === 'cover' ? 'contain' : 'cover')}
          title={objectFit === 'cover' ? 'Fit video to frame' : 'Fill entire frame'}
          className="px-1.5 py-0.5 rounded bg-black/80 border border-[#333333] text-[10px] font-mono text-[#aaaaaa] hover:text-white"
        >
          {objectFit === 'cover' ? 'FIT' : 'FILL'}
        </button>

        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 border border-[#333333] text-[10px] font-mono text-[#888888]">
          <Wifi className="w-2.5 h-2.5 text-emerald-500" />
          <span className="hidden xs:inline">P2P</span>
        </div>
      </div>

      {/* Local Video Picture-in-Picture (Responsive across all screens) */}
      <div className="absolute bottom-2 right-2 w-24 xs:w-28 sm:w-36 md:w-44 aspect-video rounded overflow-hidden bg-[#121212] border border-[#333333] z-10 shadow-lg">
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
  );
}
