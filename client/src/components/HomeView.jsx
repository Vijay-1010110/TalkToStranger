import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Phone, ShieldCheck, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import SponsorCard from './SponsorCard';
import { useAuth } from '../context/AuthContext';

export default function HomeView({
  selectedMode,
  setSelectedMode,
  onStartSearch,
  localStream,
  isMuted,
  isVideoOff,
  toggleMute,
  toggleVideo
}) {
  const { isPriority } = useAuth();
  const previewVideoRef = useRef(null);
  const [showFaq, setShowFaq] = useState(false);

  useEffect(() => {
    if (previewVideoRef.current && localStream) {
      previewVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const faqs = [
    {
      q: "Is Talk to Stranger completely free?",
      a: "Yes. Talk to Stranger is 100% free with no paywalls or mandatory subscriptions. Video chat, voice calling, and text messaging use direct peer-to-peer WebRTC technology."
    },
    {
      q: "Do I need to sign up or create an account?",
      a: "No. You can start chatting instantly with zero registration. A random anonymous guest profile is generated automatically. Optional accounts are available if you wish to reserve a custom username."
    },
    {
      q: "How does the random matchmaking work?",
      a: "When you select Chat, Voice, or Video mode and press Start, our matchmaking engine pairs you with another available user in the same mode in less than a second."
    },
    {
      q: "Is Talk to Stranger a good Omegle alternative?",
      a: "Yes. Following Omegle's shutdown, Talk to Stranger was engineered as a high-speed, minimal, and secure alternative featuring modern encrypted WebRTC streams, ultra-fast P2P chat, and instant skipping (Esc key)."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-start bg-[#0a0a0a] min-h-0">
      <div className="w-full max-w-md mx-auto flex flex-col justify-center my-auto">
        
        {/* Header / H1 for SEO */}
        <div className="mb-5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
              Talk to Stranger
            </h1>
            {isPriority && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold">
                PRIORITY PASS
              </span>
            )}
          </div>
          <p className="text-xs text-[#888888] mt-1 font-sans">
            Free anonymous random video chat, voice call &amp; text chat. Direct WebRTC peer-to-peer.
          </p>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#141414] border border-[#222222] rounded mb-5">
          <button
            onClick={() => setSelectedMode('chat')}
            className={`py-3 px-2 flex flex-col items-center justify-center gap-1.5 rounded transition-colors ${
              selectedMode === 'chat'
                ? 'bg-[#262626] text-white font-semibold'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-mono">Chat</span>
            <span className="text-[10px] text-[#666666] hidden sm:block">Text only</span>
          </button>

          <button
            onClick={() => setSelectedMode('audio')}
            className={`py-3 px-2 flex flex-col items-center justify-center gap-1.5 rounded transition-colors ${
              selectedMode === 'audio'
                ? 'bg-[#262626] text-white font-semibold'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="text-xs font-mono">Voice</span>
            <span className="text-[10px] text-[#666666] hidden sm:block">Mic audio</span>
          </button>

          <button
            onClick={() => setSelectedMode('video')}
            className={`py-3 px-2 flex flex-col items-center justify-center gap-1.5 rounded transition-colors ${
              selectedMode === 'video'
                ? 'bg-[#262626] text-white font-semibold'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="text-xs font-mono">Video</span>
            <span className="text-[10px] text-[#666666] hidden sm:block">Cam &amp; mic</span>
          </button>
        </div>

        {/* Preview / Mode Highlights */}
        {selectedMode === 'video' ? (
          <div className="mb-5">
            <div className="relative w-full aspect-video max-h-[35vh] sm:max-h-[220px] bg-black border border-[#222222] rounded overflow-hidden flex items-center justify-center">
              {localStream && !isVideoOff ? (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover video-mirror"
                />
              ) : (
                <div className="text-xs font-mono text-[#555555]">
                  Camera inactive
                </div>
              )}

              {/* Hardware test toggles */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-1.5 rounded text-xs border ${
                    isMuted
                      ? 'border-red-800 bg-red-950/80 text-red-300'
                      : 'border-[#333333] bg-[#141414]/90 text-[#cccccc] hover:bg-black'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-1.5 rounded text-xs border ${
                    isVideoOff
                      ? 'border-red-800 bg-red-950/80 text-red-300'
                      : 'border-[#333333] bg-[#141414]/90 text-[#cccccc] hover:bg-black'
                  }`}
                  title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] font-mono text-[#666666] text-center mt-1.5">
              Live camera preview • Broadcast begins only when paired
            </p>
          </div>
        ) : selectedMode === 'audio' ? (
          <div className="mb-5 p-4 rounded bg-[#121212] border border-[#222222] text-center">
            <div className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#2c2c2c] mx-auto flex items-center justify-center text-white mb-2">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-mono font-semibold text-white">Random Voice Call</h2>
            <p className="text-[11px] text-[#777777] mt-0.5 max-w-xs mx-auto">
              Real-time anonymous audio conversation. Low bandwidth with speaking wave indicator.
            </p>
          </div>
        ) : (
          <div className="mb-5 p-4 rounded bg-[#121212] border border-[#222222] text-center">
            <div className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#2c2c2c] mx-auto flex items-center justify-center text-white mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-mono font-semibold text-white">Anonymous Text Chat</h2>
            <p className="text-[11px] text-[#777777] mt-0.5 max-w-xs mx-auto">
              Instant messaging via direct WebRTC DataChannel with quick icebreakers.
            </p>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={onStartSearch}
          className="w-full py-3.5 px-4 rounded bg-white hover:bg-[#e0e0e0] text-black font-bold text-sm font-mono transition-colors active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm"
        >
          <span>START CHATTING NOW</span>
          <span className="text-xs text-[#666666] font-normal hidden sm:inline">[Space]</span>
        </button>

        {/* Privacy & Safety Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-[#666666]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#888888]" />
          <span>Encrypted WebRTC P2P • Zero conversation logs • 100% Free</span>
        </div>

        {/* Native Sponsor Placement */}
        <SponsorCard variant="card" />

        {/* SEO Knowledge & FAQ Toggle (Google Indexable Rich Content) */}
        <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="w-full flex items-center justify-between text-xs font-mono text-[#777777] hover:text-white transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>About Talk to Stranger &amp; FAQ</span>
            </span>
            {showFaq ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showFaq && (
            <div className="mt-3 space-y-3 text-xs text-[#999999] bg-[#111111] border border-[#202020] rounded p-3 font-sans">
              <p className="leading-relaxed">
                <strong className="text-white">Talk to Stranger</strong> is a modern, privacy-first Omegle alternative. It connects you with random strangers across the globe for live video chat, voice calls, or text messaging using direct browser-to-browser WebRTC connections without requiring accounts or downloads.
              </p>

              <div className="space-y-2 pt-2 border-t border-[#1f1f1f]">
                {faqs.map((f, i) => (
                  <div key={i}>
                    <h3 className="font-semibold text-white text-[11px] font-mono">{f.q}</h3>
                    <p className="text-[11px] text-[#777777] leading-relaxed mt-0.5">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
