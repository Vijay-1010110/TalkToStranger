import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Server,
  Wifi,
  Video,
  Mic,
  Volume2,
  RefreshCw,
  ArrowLeft,
  Lock,
  Key,
  CheckCircle,
  XCircle,
  Radio,
  Users,
  Layers,
  Terminal,
  Cpu
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { ANALYTICS_CONFIG } from '../config/analytics';

const DEV_PASSCODE = 'dev2026';

export default function TesterPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Diagnostics State
  const [serverStats, setServerStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [iceTestStatus, setIceTestStatus] = useState('idle'); // 'idle' | 'running' | 'success' | 'failed'
  const [iceCandidates, setIceCandidates] = useState([]);
  const [iceLatency, setIceLatency] = useState(null);

  // Hardware State
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(null);
  const [micVolume, setMicVolume] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  const videoPreviewRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);

  // Check auth on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const keyFromUrl = urlParams.get('key');
    const savedAuth = sessionStorage.getItem('stranger_dev_auth');

    if (keyFromUrl === DEV_PASSCODE || savedAuth === 'true') {
      setIsAuthenticated(true);
      sessionStorage.setItem('stranger_dev_auth', 'true');
      if (keyFromUrl) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Poll server health when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchHealth();
    const timer = setInterval(fetchHealth, 3500);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const fetchHealth = async () => {
    try {
      setIsStatsLoading(true);
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServerStats(data);
      setStatsError('');
    } catch (err) {
      setStatsError(err.message || 'Failed to reach server');
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passcode.trim() === DEV_PASSCODE) {
      setIsAuthenticated(true);
      sessionStorage.setItem('stranger_dev_auth', 'true');
      setAuthError('');
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setAuthError(`Invalid security passcode (${nextAttempts}/3 attempts)`);
      if (nextAttempts >= 3) {
        // Redirect unauthorized users to main website
        window.location.replace('/');
      }
    }
  };

  const handleExitToMain = () => {
    sessionStorage.removeItem('stranger_dev_auth');
    window.location.replace('/');
  };

  // Run WebRTC STUN & TURN Connectivity Test
  const runIceDiagnostic = async () => {
    setIceTestStatus('running');
    setIceCandidates([]);
    setIceLatency(null);

    const startTime = performance.now();
    const candidatesList = [];

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:openrelay.metered.ca:80' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      });

      // Data channel forces candidate gathering
      pc.createDataChannel('ice-test');

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          const type = e.candidate.type; // 'host' | 'srflx' | 'relay'
          const protocol = e.candidate.protocol;
          const address = e.candidate.address || 'hidden';
          const port = e.candidate.port;
          candidatesList.push({ type, protocol, address, port, raw: e.candidate.candidate });
          setIceCandidates([...candidatesList]);
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          const elapsed = Math.round(performance.now() - startTime);
          setIceLatency(elapsed);
          const hasRelay = candidatesList.some((c) => c.type === 'relay');
          const hasSrflx = candidatesList.some((c) => c.type === 'srflx');
          if (hasSrflx || hasRelay) {
            setIceTestStatus('success');
          } else {
            setIceTestStatus('failed');
          }
          pc.close();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Fallback timeout after 7 seconds
      setTimeout(() => {
        if (pc.signalingState !== 'closed') {
          const elapsed = Math.round(performance.now() - startTime);
          setIceLatency(elapsed);
          setIceTestStatus(candidatesList.length > 0 ? 'success' : 'failed');
          try { pc.close(); } catch {}
        }
      }, 7000);
    } catch (err) {
      console.error('[WebRTC Test] Error:', err);
      setIceTestStatus('failed');
    }
  };

  // Test Camera Hardware
  const toggleCameraTest = async () => {
    if (isCameraActive) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      setCameraStream(null);
      setCameraInfo(null);
      setIsCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      });
      setCameraStream(stream);
      setIsCameraActive(true);

      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        setCameraInfo({
          label: track.label || 'Default Camera',
          width: settings.width,
          height: settings.height,
          frameRate: Math.round(settings.frameRate || 30)
        });
      }

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
    } catch (err) {
      alert('Camera test failed: ' + err.message);
    }
  };

  // Test Mic Hardware with Audio Analyser
  const toggleMicTest = async () => {
    if (isMicActive) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setMicVolume(0);
      setIsMicActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsMicActive(true);

      const updateVol = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = Math.round(sum / dataArray.length);
        setMicVolume(avg);
        animFrameRef.current = requestAnimationFrame(updateVol);
      };
      updateVol();
    } catch (err) {
      alert('Microphone test failed: ' + err.message);
    }
  };

  // Clean hardware on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraStream]);

  // --- PASSCODE GATE FOR UNAUTHORIZED VISITORS ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#090d16] text-white flex items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-sm bg-[#162032] border border-[#334155] rounded-xl p-6 shadow-2xl flex flex-col items-center text-center">
          
          <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="text-base font-bold font-mono tracking-wide text-white">
            Developer Diagnostics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Restricted developer console. Passcode required. Unauthorized visits redirect to the main app.
          </p>

          <form onSubmit={handleUnlock} className="w-full mt-5 space-y-3">
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Dev Passcode..."
                autoFocus
                className="w-full bg-[#0f172a] border border-[#334155] focus:border-sky-400 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none transition-colors text-center"
              />
            </div>

            {authError && (
              <div className="text-[11px] font-mono text-red-400 bg-red-950/40 border border-red-800/50 py-1 px-2 rounded">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-mono text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Unlock Console</span>
            </button>

            <button
              type="button"
              onClick={handleExitToMain}
              className="w-full py-1.5 rounded-lg border border-[#334155] hover:bg-[#1e293b] text-slate-400 hover:text-white font-mono text-xs transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Return to Public App</span>
            </button>
          </form>

          <div className="mt-4 text-[10px] font-mono text-slate-500">
            Passcode: <code className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded">dev2026</code>
          </div>
        </div>
      </div>
    );
  }

  // --- FULL DEVELOPER DIAGNOSTICS DASHBOARD ---
  return (
    <div className="min-h-screen w-full bg-[#090d16] text-[#f1f5f9] p-3 sm:p-6 font-sans">
      
      {/* Top Header */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#334155] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold font-mono tracking-wide text-white">
                TalkToStranger Dev Console
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                AUTH OK
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Live Production &amp; WebRTC Telemetry • Build UVrql0uJ • v2.2.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = '/'}
            className="px-3 py-1.5 rounded-lg border border-[#334155] hover:border-slate-400 text-xs font-mono text-white flex items-center gap-1.5 bg-[#162032] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open Main App</span>
          </button>
          <button
            onClick={handleExitToMain}
            className="px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/20 text-xs font-mono text-red-400 transition-colors"
          >
            Lock &amp; Exit
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* PANEL 1: Realtime Server Health & Matchmaker Stats */}
        <div className="bg-[#162032] border border-[#334155] rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#334155]/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Signaling &amp; Matchmaker Health</span>
            </div>
            <button
              onClick={fetchHealth}
              disabled={isStatsLoading}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#334155] text-slate-300 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isStatsLoading ? 'animate-spin' : ''}`} />
              <span>Poll</span>
            </button>
          </div>

          {statsError ? (
            <div className="text-xs font-mono text-red-400 bg-red-950/30 p-2 rounded border border-red-800">
              Error: {statsError}
            </div>
          ) : serverStats ? (
            <div className="space-y-2 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#0f172a] p-2.5 rounded border border-[#334155]/60">
                  <div className="text-[10px] text-slate-400 uppercase">Server Status</div>
                  <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{serverStats.status?.toUpperCase() || 'ONLINE'}</span>
                  </div>
                </div>

                <div className="bg-[#0f172a] p-2.5 rounded border border-[#334155]/60">
                  <div className="text-[10px] text-slate-400 uppercase">Unique Online Clients</div>
                  <div className="text-sm font-bold text-sky-400 flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{serverStats.online ?? 0}</span>
                  </div>
                </div>
              </div>

              {serverStats.stats && (
                <div className="bg-[#0f172a] p-2.5 rounded border border-[#334155]/60 space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Queue Queued Peers</div>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    <div className="bg-[#162032] px-2 py-1 rounded text-center">
                      <span className="text-slate-400">Video: </span>
                      <span className="font-bold text-white">{serverStats.stats.video ?? 0}</span>
                    </div>
                    <div className="bg-[#162032] px-2 py-1 rounded text-center">
                      <span className="text-slate-400">Audio: </span>
                      <span className="font-bold text-white">{serverStats.stats.audio ?? 0}</span>
                    </div>
                    <div className="bg-[#162032] px-2 py-1 rounded text-center">
                      <span className="text-slate-400">Chat: </span>
                      <span className="font-bold text-white">{serverStats.stats.chat ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-[#334155]/40">
                    <span>Active Matched Rooms:</span>
                    <span className="font-bold text-white">{serverStats.stats.activeChats ?? 0}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-400 animate-pulse">Loading health telemetry...</div>
          )}
        </div>

        {/* PANEL 2: WebRTC STUN & TURN Connectivity Test */}
        <div className="bg-[#162032] border border-[#334155] rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#334155]/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>WebRTC STUN &amp; TURN Diagnostic</span>
            </div>
            <button
              onClick={runIceDiagnostic}
              disabled={iceTestStatus === 'running'}
              className="text-[10px] font-mono px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold flex items-center gap-1 transition-all disabled:opacity-40"
            >
              <Radio className="w-3 h-3" />
              <span>{iceTestStatus === 'running' ? 'Probing...' : 'Test ICE Relays'}</span>
            </button>
          </div>

          <div className="text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">ICE Test Status:</span>
              <span className={`font-bold uppercase ${
                iceTestStatus === 'success' ? 'text-emerald-400' :
                iceTestStatus === 'running' ? 'text-amber-400 animate-pulse' :
                iceTestStatus === 'failed' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {iceTestStatus === 'success' ? '✓ Relay & STUN Operational' :
                 iceTestStatus === 'running' ? 'Gathering Candidates...' :
                 iceTestStatus === 'failed' ? '✗ Connection Failed' : 'Idle (Click Test)'}
              </span>
            </div>

            {iceLatency && (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Gathering Time:</span>
                <span className="font-bold text-white">{iceLatency} ms</span>
              </div>
            )}

            <div className="bg-[#0f172a] p-2.5 rounded border border-[#334155]/60 max-h-36 overflow-y-auto space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Discovered Candidates</div>
              {iceCandidates.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic">No candidates gathered yet. Click "Test ICE Relays".</div>
              ) : (
                iceCandidates.map((c, i) => (
                  <div key={i} className="text-[10px] font-mono flex items-center justify-between py-0.5 border-b border-[#334155]/30">
                    <span className={`font-bold uppercase ${
                      c.type === 'relay' ? 'text-purple-400' :
                      c.type === 'srflx' ? 'text-sky-400' : 'text-slate-400'
                    }`}>
                      [{c.type}]
                    </span>
                    <span className="text-slate-300">{c.protocol.toUpperCase()}</span>
                    <span className="text-slate-400 truncate max-w-[150px]">{c.address}:{c.port}</span>
                  </div>
                ))
              )}
            </div>

            <div className="text-[10px] text-slate-400 leading-relaxed bg-[#162032] p-1.5 rounded border border-[#334155]/40">
              <span className="text-purple-300 font-bold">[RELAY]</span> candidate confirms OpenRelay TURN is online and punching through VPNs &amp; symmetric NATs.
            </div>
          </div>
        </div>

        {/* PANEL 3: Local Hardware (Camera & Mic) Inspector */}
        <div className="bg-[#162032] border border-[#334155] rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#334155]/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Video className="w-4 h-4 text-blue-400" />
              <span>Camera &amp; Mic Hardware Verification</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={toggleCameraTest}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  isCameraActive ? 'bg-red-500/20 border-red-400 text-red-300' : 'border-[#334155] text-slate-300 hover:text-white'
                }`}
              >
                {isCameraActive ? 'Stop Cam' : 'Test Cam'}
              </button>
              <button
                onClick={toggleMicTest}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  isMicActive ? 'bg-red-500/20 border-red-400 text-red-300' : 'border-[#334155] text-slate-300 hover:text-white'
                }`}
              >
                {isMicActive ? 'Stop Mic' : 'Test Mic'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Video Preview Box */}
            <div className="w-full h-32 bg-[#070b14] rounded-lg border border-[#334155] overflow-hidden relative flex items-center justify-center">
              {isCameraActive ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover video-mirror"
                />
              ) : (
                <div className="text-xs font-mono text-slate-500 flex flex-col items-center gap-1">
                  <Video className="w-5 h-5 text-slate-600" />
                  <span>Camera stream idle</span>
                </div>
              )}

              {cameraInfo && (
                <div className="absolute bottom-1 left-1 bg-[#0f172a]/90 text-[9px] font-mono text-white px-1.5 py-0.5 rounded border border-[#334155]">
                  {cameraInfo.width}x{cameraInfo.height} @ {cameraInfo.frameRate}fps
                </div>
              )}
            </div>

            {/* Mic VU Meter */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Mic className="w-3 h-3 text-sky-400" />
                  <span>Microphone VU Meter</span>
                </span>
                <span className="font-bold text-white">{micVolume} / 255</span>
              </div>
              <div className="w-full h-2.5 bg-[#0f172a] border border-[#334155] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.round((micVolume / 180) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 4: Audio Synth & System Configuration */}
        <div className="bg-[#162032] border border-[#334155] rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#334155]/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Audio Synthesizer &amp; App Config</span>
            </div>
          </div>

          {/* Sound buttons */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-slate-400">Zero-Asset Sound Cues</div>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <button
                onClick={() => sounds.playConnect()}
                className="py-1.5 px-2 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] rounded text-slate-200 text-left flex items-center justify-between"
              >
                <span>Match Chord</span>
                <span className="text-[10px] text-slate-500">▶</span>
              </button>
              <button
                onClick={() => sounds.playMessage()}
                className="py-1.5 px-2 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] rounded text-slate-200 text-left flex items-center justify-between"
              >
                <span>Message Pop</span>
                <span className="text-[10px] text-slate-500">▶</span>
              </button>
              <button
                onClick={() => sounds.playSent()}
                className="py-1.5 px-2 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] rounded text-slate-200 text-left flex items-center justify-between"
              >
                <span>Sent Blip</span>
                <span className="text-[10px] text-slate-500">▶</span>
              </button>
              <button
                onClick={() => sounds.playDisconnect()}
                className="py-1.5 px-2 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] rounded text-slate-200 text-left flex items-center justify-between"
              >
                <span>Disconnect Tone</span>
                <span className="text-[10px] text-slate-500">▶</span>
              </button>
            </div>
          </div>

          {/* System metadata */}
          <div className="pt-2 border-t border-[#334155]/60 text-[11px] font-mono space-y-1 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">GA4 Analytics:</span>
              <span className="text-white font-bold">{ANALYTICS_CONFIG.gaMeasurementId || 'Inactive'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ad Provider:</span>
              <span className="text-white">Adsterra Anti-AdBlock (bicea.org)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active TURN Relays:</span>
              <span className="text-emerald-400">openrelay.metered.ca:443 (TCP/UDP)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full py-1.5 rounded bg-[#0f172a] hover:bg-slate-800 border border-[#334155] text-slate-300 hover:text-white text-xs font-mono transition-colors"
            >
              Clear Local Storage &amp; Hard Reload
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
