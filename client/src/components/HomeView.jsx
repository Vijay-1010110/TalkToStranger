import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Phone, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, RefreshCw, Sliders, PowerOff } from 'lucide-react';
import SponsorCard from './SponsorCard';
import { useAuth } from '../context/AuthContext';

export default function HomeView({
  selectedMode,
  setSelectedMode,
  gender = 'male',
  setGender,
  onStartSearch,
  localStream,
  isMuted,
  isVideoOff,
  toggleMute,
  toggleVideo,
  onSwitchCamera,
  onOpenDeviceSettings,
  isHardwareRevoked,
  onReacquirePermissions
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
      q: "What makes Talk to Stranger the best alternative for Omegle?",
      a: "Following Omegle's shutdown, Talk to Stranger was engineered as a high-speed, secure, and 100% free Omegle alternative. It pairs you with random strangers across the globe for live video chat, voice calls, and text messaging with no bots, no registration, and end-to-end WebRTC encryption."
    },
    {
      q: "Is Talk to Stranger completely free with no coins or subscriptions?",
      a: "Yes. Unlike apps like OmeTV or Monkey that require coins, phone numbers, or credit cards, Talk to Stranger is 100% free with no paywalls or mandatory accounts."
    },
    {
      q: "Do I need to sign up or create an account to talk to strangers?",
      a: "No. You can start chatting instantly with zero registration. A random anonymous guest profile is generated automatically. Optional accounts are available if you wish to reserve a custom username."
    },
    {
      q: "Does this Omegle alternative work on iPhone and Android mobile phones?",
      a: "Yes! Talk to Stranger runs smoothly on iOS Safari, Android Chrome, and all desktop browsers. It supports switching between front and back cameras and microphone selection."
    },
    {
      q: "How does Talk to Stranger protect user privacy and security?",
      a: "All video, audio, and text streams use direct peer-to-peer WebRTC encryption. Conversations never route through or get stored on media servers, ensuring maximum privacy."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-start bg-[#0f172a] min-h-0">
      <div className="w-full max-w-md mx-auto flex flex-col justify-center my-auto">
        
        {/* Header / H1 for SEO */}
        <div className="mb-5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
              Talk to Stranger
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
              OMEGLE ALTERNATIVE
            </span>
            {isPriority && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-900 font-bold">
                PRIORITY PASS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            The #1 free alternative for Omegle. Random video chat, anonymous voice call &amp; text chat. Direct WebRTC P2P.
          </p>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#1e293b] border border-[#334155] rounded mb-5 shadow-sm">
          <button
            onClick={() => setSelectedMode('chat')}
            className={`py-3 px-2 flex flex-col items-center justify-center gap-1.5 rounded transition-all ${
              selectedMode === 'chat'
                ? 'bg-sky-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-[#334155]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-mono">Chat</span>
            <span className="text-[10px] opacity-80 hidden sm:block">Text only</span>
          </button>

          <button
            onClick={() => setSelectedMode('audio')}
            className={`py-3 px-2 flex flex-col items-center justify-center gap-1.5 rounded transition-all ${
              selectedMode === 'audio'
                ? 'bg-sky-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-[#334155]'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="text-xs font-mono">Voice</span>
            <span className="text-[10px] opacity-80 hidden sm:block">Mic audio</span>
          </button>

          <button
            onClick={() => setSelectedMode('video')}
            className={`py-3 px-2 flex flex-col items-center justify-center gap-1.5 rounded transition-all ${
              selectedMode === 'video'
                ? 'bg-sky-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-[#334155]'
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="text-xs font-mono">Video</span>
            <span className="text-[10px] opacity-80 hidden sm:block">Cam &amp; mic</span>
          </button>
        </div>

        {/* Preview / Mode Highlights */}
        {selectedMode === 'video' ? (
          <div className="mb-5">
            <div className="relative w-full aspect-video max-h-[35vh] sm:max-h-[220px] bg-[#0b101c] border border-[#334155] rounded overflow-hidden flex items-center justify-center shadow-inner">
              {isHardwareRevoked ? (
                <div className="flex flex-col items-center justify-center text-center p-3">
                  <PowerOff className="w-6 h-6 text-red-400 mb-1" />
                  <span className="text-xs font-mono text-slate-400">Hardware Access Released</span>
                  <button
                    onClick={onReacquirePermissions}
                    className="mt-2 px-3 py-1 bg-white text-slate-900 text-[11px] font-mono font-semibold rounded"
                  >
                    Enable Camera
                  </button>
                </div>
              ) : localStream && !isVideoOff ? (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover video-mirror"
                />
              ) : (
                <div className="text-xs font-mono text-slate-500">
                  Camera inactive
                </div>
              )}

              {/* Hardware test toggles */}
              {!isHardwareRevoked && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`p-1.5 rounded text-xs border ${
                      isMuted
                        ? 'border-red-600 bg-red-600/30 text-red-300'
                        : 'border-[#334155] bg-[#1e293b]/90 text-slate-200 hover:bg-[#334155]'
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
                        ? 'border-red-600 bg-red-600/30 text-red-300'
                        : 'border-[#334155] bg-[#1e293b]/90 text-slate-200 hover:bg-[#334155]'
                    }`}
                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                  >
                    {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchCamera()}
                    className="p-1.5 rounded text-xs border border-[#334155] bg-[#1e293b]/90 text-slate-200 hover:bg-[#334155]"
                    title="Switch / Flip Camera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDeviceSettings}
                    className="p-1.5 rounded text-xs border border-[#334155] bg-[#1e293b]/90 text-slate-200 hover:bg-[#334155]"
                    title="Device Settings (Switch Mic/Cam or Revoke)"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-400 text-center mt-1.5">
              Live camera preview • Broadcast begins only when paired
            </p>
          </div>
        ) : selectedMode === 'audio' ? (
          <div className="mb-5 p-4 rounded bg-[#1e293b] border border-[#334155] text-center shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#0f172a] border border-[#334155] mx-auto flex items-center justify-center text-sky-400 mb-2">
              <Phone className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-mono font-semibold text-white">Random Voice Call</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
              Real-time anonymous audio conversation. Low bandwidth with speaking wave indicator.
            </p>
            <button
              onClick={onOpenDeviceSettings}
              className="mt-2 text-[10px] font-mono text-sky-400 hover:text-sky-300 underline"
            >
              Configure Mic &amp; Device
            </button>
          </div>
        ) : (
          <div className="mb-5 p-4 rounded bg-[#1e293b] border border-[#334155] text-center shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#0f172a] border border-[#334155] mx-auto flex items-center justify-center text-sky-400 mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-mono font-semibold text-white">Anonymous Text Chat</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
              Instant messaging via direct WebRTC DataChannel with quick icebreakers.
            </p>
          </div>
        )}

        {/* Gender Selection */}
        <div className="mb-4 p-3 bg-[#1e293b] border border-[#334155] rounded shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
              Your Gender
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Shown to your partner
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setGender && setGender('male')}
              className={`py-2 px-1 rounded flex items-center justify-center gap-1.5 text-xs font-mono transition-all border ${
                gender === 'male'
                  ? 'bg-blue-600/30 border-blue-400 text-blue-300 font-bold shadow-sm'
                  : 'bg-[#0f172a] border-[#334155] text-slate-400 hover:text-white hover:border-[#475569]'
              }`}
            >
              <span>♂</span>
              <span>Male</span>
            </button>
            <button
              type="button"
              onClick={() => setGender && setGender('female')}
              className={`py-2 px-1 rounded flex items-center justify-center gap-1.5 text-xs font-mono transition-all border ${
                gender === 'female'
                  ? 'bg-pink-600/30 border-pink-400 text-pink-300 font-bold shadow-sm'
                  : 'bg-[#0f172a] border-[#334155] text-slate-400 hover:text-white hover:border-[#475569]'
              }`}
            >
              <span>♀</span>
              <span>Female</span>
            </button>
            <button
              type="button"
              onClick={() => setGender && setGender('other')}
              className={`py-2 px-1 rounded flex items-center justify-center gap-1.5 text-xs font-mono transition-all border ${
                gender === 'other'
                  ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                  : 'bg-[#0f172a] border-[#334155] text-slate-400 hover:text-white hover:border-[#475569]'
              }`}
            >
              <span>🧑</span>
              <span>Other</span>
            </button>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartSearch}
          className="w-full py-3.5 px-4 rounded bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm font-mono transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <span>START CHATTING NOW</span>
          <span className="text-xs text-slate-500 font-normal hidden sm:inline">[Space]</span>
        </button>

        {/* Privacy & Safety Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Encrypted WebRTC P2P • Zero conversation logs • 100% Free</span>
        </div>

        {/* Native Sponsor Placement */}
        <SponsorCard variant="card" />

        {/* SEO Knowledge & FAQ Toggle (Google Indexable Rich Content) */}
        <div className="mt-6 pt-4 border-t border-[#334155]">
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-white transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>About Talk to Stranger &amp; FAQ</span>
            </span>
            {showFaq ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showFaq && (
            <div className="mt-3 space-y-3 text-xs text-slate-300 bg-[#1e293b] border border-[#334155] rounded p-3 font-sans shadow-sm">
              <p className="leading-relaxed">
                <strong className="text-white">Talk to Stranger</strong> is a modern, privacy-first Omegle alternative. It connects you with random strangers across the globe for live video chat, voice calls, or text messaging using direct browser-to-browser WebRTC connections without requiring accounts or downloads.
              </p>

              <div className="space-y-2 pt-2 border-t border-[#334155]">
                {faqs.map((f, i) => (
                  <div key={i}>
                    <h3 className="font-semibold text-white text-[11px] font-mono">{f.q}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{f.a}</p>
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
