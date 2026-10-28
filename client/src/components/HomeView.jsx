import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Phone, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, RefreshCw, Sliders, PowerOff, Globe } from 'lucide-react';
import SponsorCard from './SponsorCard';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

const REGION_OPTIONS = [
  { code: 'global', name: 'Worldwide / Any (Fastest)', flag: '🌍' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'SA', name: 'Middle East', flag: '🇸🇦' },
];

export default function HomeView({
  selectedMode,
  setSelectedMode,
  gender = 'male',
  setGender,
  region = 'global',
  setRegion,
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
  const { t } = useTranslation();
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
              {t('title')}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
              {t('badgeAlt')}
            </span>
            {isPriority && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-900 font-bold">
                PRIORITY PASS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            {t('heroSubtitle')}
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
            <span className="text-xs font-mono">{t('chatMode')}</span>
            <span className="text-[10px] opacity-80 hidden sm:block">{t('chatSub')}</span>
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
            <span className="text-xs font-mono">{t('audioMode')}</span>
            <span className="text-[10px] opacity-80 hidden sm:block">{t('audioSub')}</span>
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
            <span className="text-xs font-mono">{t('videoMode')}</span>
            <span className="text-[10px] opacity-80 hidden sm:block">{t('videoSub')}</span>
          </button>
        </div>

        {/* Mode Preview / Camera Setup Area */}
        {selectedMode === 'video' ? (
          <div className="mb-5 relative rounded overflow-hidden bg-[#000000] border border-[#334155] aspect-video flex items-center justify-center shadow-inner">
            {isHardwareRevoked ? (
              <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <PowerOff className="w-8 h-8 text-amber-400" />
                <p className="text-xs font-mono text-slate-300">Camera &amp; Mic Hardware Revoked</p>
                <button
                  onClick={onReacquirePermissions}
                  className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold shadow transition-colors"
                >
                  Enable Camera &amp; Mic
                </button>
              </div>
            ) : localStream && !isVideoOff ? (
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                <VideoOff className="w-8 h-8" />
                <span className="text-xs font-mono">Camera preview paused</span>
              </div>
            )}

            {/* Quick in-preview camera controls */}
            {!isHardwareRevoked && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-1.5 bg-[#0f172a]/80 backdrop-blur-md px-2 py-1 rounded border border-[#334155]">
                  <button
                    onClick={toggleMute}
                    className="p-1 rounded hover:bg-[#334155] text-slate-300 transition-colors"
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className="p-1 rounded hover:bg-[#334155] text-slate-300 transition-colors"
                    title={isVideoOff ? 'Enable camera' : 'Disable camera'}
                  >
                    {isVideoOff ? <VideoOff className="w-3.5 h-3.5 text-red-400" /> : <Video className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onSwitchCamera && onSwitchCamera()}
                    className="p-1 rounded hover:bg-[#334155] text-slate-300 transition-colors"
                    title="Flip camera front/back"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={onOpenDeviceSettings}
                  className="p-1.5 rounded bg-[#0f172a]/80 backdrop-blur-md border border-[#334155] hover:bg-[#334155] text-slate-300 transition-colors"
                  title="Audio / Video Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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
        <div className="mb-3 p-3 bg-[#1e293b] border border-[#334155] rounded shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
              {t('yourGender')}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {t('shownToPartner')}
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
              <span>{t('male')}</span>
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
              <span>{t('female')}</span>
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
              <span>{t('other')}</span>
            </button>
          </div>
        </div>

        {/* Region / Country Matching (Optional Feature) */}
        <div className="mb-4 p-3 bg-[#1e293b] border border-[#334155] rounded shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('matchRegion')}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {region === 'global' ? t('worldwide') : REGION_OPTIONS.find(r => r.code === region)?.flag}
            </span>
          </div>
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion && setRegion(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] hover:border-slate-500 rounded px-2.5 py-2 text-xs font-mono text-slate-200 outline-none cursor-pointer transition-colors"
            >
              {REGION_OPTIONS.map((reg) => (
                <option key={reg.code} value={reg.code} className="bg-[#0f172a] text-slate-200 py-1">
                  {reg.flag} {reg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartSearch}
          className="w-full py-3.5 px-4 rounded bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm font-mono transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <span>{t('startChatting')}</span>
          <span className="text-xs text-slate-500 font-normal hidden sm:inline">[Space]</span>
        </button>

        {/* Privacy & Safety Note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{t('privacyNote')}</span>
        </div>

        {/* Native Sponsor / Ad Placement */}
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
              <span>{t('aboutFaq')}</span>
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
