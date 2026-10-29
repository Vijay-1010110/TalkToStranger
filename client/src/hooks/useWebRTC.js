import { useState, useRef, useEffect, useCallback } from 'react';

// Verified, ultra-fast global STUN configuration
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

// Fallback virtual stream generator (when Windows camera is locked by another browser tab or hardware is busy)
function createVirtualFallbackStream(mode) {
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let t = 0;
    const draw = () => {
      t += 0.05;
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#09111e');
      grad.addColorStop(1, '#1b2a47');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Pulsing avatar indicator
      ctx.beginPath();
      ctx.arc(320, 220, 50 + Math.sin(t) * 6, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();

      // Avatar emoji
      ctx.font = '42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🧑', 320, 235);

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Camera Active (Device Sharing Mode)', 320, 310);
    };

    draw();
    const timer = setInterval(draw, 100);

    const videoStream = canvas.captureStream(15);
    const videoTrack = videoStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => clearInterval(timer);
    }

    // Silent audio track via Web Audio destination
    let audioTrack = null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        const dest = audioCtx.createMediaStreamDestination();
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        audioTrack = dest.stream.getAudioTracks()[0];
      } catch (e) {}
    }

    const fallbackTracks = [
      ...(mode === 'video' ? [videoTrack] : []),
      ...(audioTrack ? [audioTrack] : [])
    ].filter(Boolean);

    return new MediaStream(fallbackTracks);
  } catch (err) {
    console.warn('[WebRTC] Fallback virtual stream error:', err);
    return null;
  }
}

export function useWebRTC({ socket, onDataMessage, onDataTyping, onConnectionStateChange }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isDataChannelReady, setIsDataChannelReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [connectionState, setConnectionState] = useState('new');

  // Device lists & selection
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [isHardwareRevoked, setIsHardwareRevoked] = useState(false);

  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const pendingSignalsRef = useRef([]);
  const partnerIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteMediaStreamRef = useRef(null);
  const localAudioAnalyserRef = useRef(null);
  const remoteAudioAnalyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Sync state to ref
  localStreamRef.current = localStream;

  // Refresh available devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
    } catch (err) {
      console.warn('[WebRTC] Error enumerating devices:', err);
    }
  }, []);

  // Initialize or get local media stream based on mode
  const initLocalMedia = useCallback(async (mode, customAudioId = null, customVideoId = null, customFacing = null) => {
    if (mode === 'chat') {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        setLocalStream(null);
      }
      return null;
    }

    try {
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(customAudioId ? { deviceId: { exact: customAudioId } } : {})
      };

      let videoConstraints = false;
      if (mode === 'video') {
        const targetFacing = customFacing || facingMode;
        videoConstraints = {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
          ...(customVideoId ? { deviceId: { exact: customVideoId } } : { facingMode: targetFacing })
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints
      });

      setLocalStream(stream);
      setIsMuted(false);
      setIsVideoOff(false);
      setIsHardwareRevoked(false);

      // Populate devices with user-granted labels
      updateDeviceList();

      // Setup audio analysis for speech detection
      setupAudioAnalyser(stream, true);

      return stream;
    } catch (err) {
      console.warn('[WebRTC] Media device error (falling back to device sharing stream):', err);
      // Try audio only first
      if (mode === 'video') {
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          const virtualVideo = createVirtualFallbackStream('video');
          const combinedTracks = [
            ...(virtualVideo ? virtualVideo.getVideoTracks() : []),
            ...audioOnlyStream.getAudioTracks()
          ];
          const combined = new MediaStream(combinedTracks);
          setLocalStream(combined);
          setupAudioAnalyser(combined, true);
          return combined;
        } catch (audioErr) {
          console.warn('[WebRTC] Audio fallback failed, using virtual stream:', audioErr);
        }
      }

      // Generate complete virtual fallback stream (e.g. when testing 2 tabs on same machine with exclusive camera lock)
      const fallbackStream = createVirtualFallbackStream(mode);
      if (fallbackStream) {
        setLocalStream(fallbackStream);
        setupAudioAnalyser(fallbackStream, true);
        return fallbackStream;
      }
      return null;
    }
  }, [facingMode, updateDeviceList]);

  // Setup Web Audio Analyser
  const setupAudioAnalyser = (stream, isLocal) => {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const speaking = average > 18;

        if (isLocal) {
          setIsLocalSpeaking(speaking);
        } else {
          setIsRemoteSpeaking(speaking);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      if (isLocal) {
        if (localAudioAnalyserRef.current?.audioCtx) {
          localAudioAnalyserRef.current.audioCtx.close().catch(() => {});
        }
        localAudioAnalyserRef.current = { audioCtx, analyser };
      } else {
        if (remoteAudioAnalyserRef.current?.audioCtx) {
          remoteAudioAnalyserRef.current.audioCtx.close().catch(() => {});
        }
        remoteAudioAnalyserRef.current = { audioCtx, analyser };
      }

      checkVolume();
    } catch (e) {}
  };

  // Setup DataChannel handlers
  const setupDataChannelEvents = useCallback((channel) => {
    dataChannelRef.current = channel;

    channel.onopen = () => {
      setIsDataChannelReady(true);
    };

    channel.onclose = () => {
      setIsDataChannelReady(false);
    };

    channel.onerror = (err) => {
      console.warn('[WebRTC] DataChannel error:', err);
      setIsDataChannelReady(false);
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat' && onDataMessage) {
          onDataMessage({
            sender: 'stranger',
            text: data.text,
            id: data.id,
            timestamp: data.timestamp,
            p2p: true
          });
        } else if (data.type === 'typing' && onDataTyping) {
          onDataTyping(data.isTyping);
        }
      } catch (err) {
        console.error('[WebRTC] Parse error:', err);
      }
    };
  }, [onDataMessage, onDataTyping]);

  // Clean peer connection
  const cleanupPeerConnection = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (dataChannelRef.current) {
      try { dataChannelRef.current.close(); } catch {}
      dataChannelRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    partnerIdRef.current = null;
    iceCandidateQueueRef.current = [];
    pendingSignalsRef.current = [];
    remoteMediaStreamRef.current = null;
    setRemoteStream(null);
    setIsDataChannelReady(false);
    setIsRemoteSpeaking(false);
    setConnectionState('closed');
  }, []);

  // Stop everything including local hardware stream
  const stopAll = useCallback(() => {
    cleanupPeerConnection();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    if (localAudioAnalyserRef.current?.audioCtx) {
      localAudioAnalyserRef.current.audioCtx.close().catch(() => {});
      localAudioAnalyserRef.current = null;
    }
    setIsLocalSpeaking(false);
  }, [cleanupPeerConnection]);

  // HARD REVOKE: Stop all hardware tracks & release OS camera/mic lock completely
  const revokePermissions = useCallback(() => {
    stopAll();
    setIsHardwareRevoked(true);
    setIsMuted(true);
    setIsVideoOff(true);
  }, [stopAll]);

  // Switch Camera (Flip front/back on mobile OR switch specific camera device)
  const switchCamera = useCallback(async (targetDeviceId = null) => {
    try {
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(nextFacing);

      let videoConstraints;
      if (targetDeviceId) {
        videoConstraints = { deviceId: { exact: targetDeviceId } };
        setSelectedVideoId(targetDeviceId);
      } else {
        videoConstraints = { facingMode: nextFacing };
      }

      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      const newVideoTrack = tempStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      // Stop old video track
      if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }

      // Live PeerConnection Track Replacement (Zero disconnect!)
      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
          console.log('[WebRTC] Camera track replaced seamlessly on active P2P call');
        }
      }

      setIsVideoOff(false);
    } catch (err) {
      console.warn('[WebRTC] Failed to switch camera:', err);
    }
  }, [facingMode]);

  // Switch Microphone
  const switchMic = useCallback(async (targetDeviceId) => {
    try {
      if (!targetDeviceId) return;
      setSelectedAudioId(targetDeviceId);

      const tempStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: targetDeviceId },
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const newAudioTrack = tempStream.getAudioTracks()[0];
      if (!newAudioTrack) return;

      // Stop old audio track
      if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getAudioTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newAudioTrack);
        const updated = new MediaStream(localStreamRef.current.getTracks());
        setLocalStream(updated);
        setupAudioAnalyser(updated, true);
      }

      // Live PeerConnection Audio Track Replacement
      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
          console.log('[WebRTC] Microphone track replaced seamlessly on active P2P call');
        }
      }

      setIsMuted(false);
    } catch (err) {
      console.warn('[WebRTC] Failed to switch mic:', err);
    }
  }, []);

  // Process an individual WebRTC signal safely
  const processSignal = useCallback(async (pc, senderId, signal) => {
    if (!pc) return;

    try {
      if (signal.type === 'offer') {
        console.log('[WebRTC] Handling offer signal from partner');
        const sdpStr = typeof signal.sdp === 'string' ? signal.sdp : (signal.sdp?.sdp || '');

        if (pc.signalingState !== 'stable') {
          console.warn('[WebRTC] Offer in state:', pc.signalingState);
          await Promise.all([
            pc.setLocalDescription({ type: 'rollback' }).catch(() => {}),
            pc.setRemoteDescription({ type: 'offer', sdp: sdpStr })
          ]);
        } else {
          await pc.setRemoteDescription({ type: 'offer', sdp: sdpStr });
        }

        // Drain queued ICE candidates
        while (iceCandidateQueueRef.current.length > 0) {
          const candidate = iceCandidateQueueRef.current.shift();
          try {
            await pc.addIceCandidate(candidate);
          } catch (e) {
            console.warn('[WebRTC] Queued ICE candidate error:', e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('signal', {
          targetId: senderId,
          signal: {
            type: 'answer',
            sdp: answer.sdp
          }
        });
        console.log('[WebRTC] Answer generated and emitted to', senderId);
      } else if (signal.type === 'answer') {
        console.log('[WebRTC] Handling answer signal from partner, state:', pc.signalingState);
        const sdpStr = typeof signal.sdp === 'string' ? signal.sdp : (signal.sdp?.sdp || '');

        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription({ type: 'answer', sdp: sdpStr });

          while (iceCandidateQueueRef.current.length > 0) {
            const candidate = iceCandidateQueueRef.current.shift();
            try {
              await pc.addIceCandidate(candidate);
            } catch (e) {
              console.warn('[WebRTC] Queued ICE candidate error on answer:', e);
            }
          }
        } else {
          console.warn('[WebRTC] Answer ignored because signalingState is:', pc.signalingState);
        }
      } else if (signal.type === 'ice-candidate') {
        const candidateData = signal.candidate;
        if (candidateData && (candidateData.candidate || typeof candidateData === 'string')) {
          try {
            const candidateObj = typeof candidateData === 'string'
              ? { candidate: candidateData, sdpMid: '0', sdpMLineIndex: 0 }
              : candidateData;

            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(candidateObj);
            } else {
              iceCandidateQueueRef.current.push(candidateObj);
            }
          } catch (e) {
            console.warn('[WebRTC] addIceCandidate error:', e);
          }
        }
      }
    } catch (err) {
      console.error('[WebRTC] Signal handling error:', err);
    }
  }, [socket]);

  // Handle incoming WebRTC signals with race-condition queue
  const handleSignal = useCallback(async ({ senderId, signal }) => {
    const pc = pcRef.current;
    if (!pc) {
      console.log('[WebRTC] Queueing signal because PeerConnection is initializing:', signal.type);
      pendingSignalsRef.current.push({ senderId, signal });
      return;
    }

    await processSignal(pc, senderId, signal);
  }, [processSignal]);

  // Create Peer Connection
  const createPeerConnection = useCallback((partnerId, iceServers, mode, stream) => {
    // Gracefully close previous active connection without destroying queued signals
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (dataChannelRef.current) {
      try { dataChannelRef.current.close(); } catch {}
      dataChannelRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }

    partnerIdRef.current = partnerId;
    remoteMediaStreamRef.current = new MediaStream();

    const pc = new RTCPeerConnection({
      iceServers: iceServers && iceServers.length > 0 ? iceServers : DEFAULT_ICE_SERVERS,
      iceCandidatePoolSize: 10
    });

    pcRef.current = pc;

    // Immediately handle incoming data channel on receiver side without race
    pc.ondatachannel = (event) => {
      console.log('[WebRTC] Receiver datachannel arrived via ondatachannel');
      setupDataChannelEvents(event.channel);
    };

    // Attach local stream tracks if available
    const activeStream = stream || localStreamRef.current;
    if (activeStream && mode !== 'chat') {
      const liveTracks = activeStream.getTracks().filter(t => t.readyState === 'live');
      liveTracks.forEach((track) => {
        try {
          pc.addTrack(track, activeStream);
        } catch (e) {
          console.warn('[WebRTC] addTrack fallback:', e);
        }
      });
    }

    // Ensure transceivers exist for expected media lines if local track is not present
    if (mode === 'video') {
      const hasVideo = pc.getSenders().some(s => s.track && s.track.kind === 'video');
      const hasAudio = pc.getSenders().some(s => s.track && s.track.kind === 'audio');
      if (!hasVideo) {
        try { pc.addTransceiver('video', { direction: 'recvonly' }); } catch (e) {}
      }
      if (!hasAudio) {
        try { pc.addTransceiver('audio', { direction: 'recvonly' }); } catch (e) {}
      }
    } else if (mode === 'audio') {
      const hasAudio = pc.getSenders().some(s => s.track && s.track.kind === 'audio');
      if (!hasAudio) {
        try { pc.addTransceiver('audio', { direction: 'recvonly' }); } catch (e) {}
      }
    }

    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack received:', event.track.kind, event.track.id);
      let persistentStream = remoteMediaStreamRef.current;
      if (!persistentStream) {
        persistentStream = new MediaStream();
        remoteMediaStreamRef.current = persistentStream;
      }

      // Deduplicate tracks of the same kind
      persistentStream.getTracks().forEach((track) => {
        if (track.kind === event.track.kind && track.id !== event.track.id) {
          try {
            persistentStream.removeTrack(track);
          } catch (e) {}
        }
      });

      try {
        persistentStream.addTrack(event.track);
      } catch (e) {
        console.warn('[WebRTC] Error adding track to persistent remote stream:', e);
      }

      // Create new MediaStream instance so React state change fires render reliably
      const updatedStream = new MediaStream(persistentStream.getTracks());
      setRemoteStream(updatedStream);
      setupAudioAnalyser(updatedStream, false);

      event.track.onended = () => {
        try {
          persistentStream.removeTrack(event.track);
          setRemoteStream(new MediaStream(persistentStream.getTracks()));
        } catch (e) {}
      };

      event.track.onunmute = () => {
        setRemoteStream(new MediaStream(persistentStream.getTracks()));
      };
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && partnerIdRef.current) {
        const candidatePayload = event.candidate.toJSON
          ? event.candidate.toJSON()
          : {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              usernameFragment: event.candidate.usernameFragment
            };

        socket.emit('signal', {
          targetId: partnerIdRef.current,
          signal: {
            type: 'ice-candidate',
            candidate: candidatePayload
          }
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.warn('[WebRTC] ICE connection degraded/failed. Checking restart...');
        if (typeof pc.restartIce === 'function') {
          try { pc.restartIce(); } catch (e) {}
        }
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (onConnectionStateChange) {
        onConnectionStateChange(pc.connectionState);
      }
    };

    return pc;
  }, [cleanupPeerConnection, socket, onConnectionStateChange, setupDataChannelEvents]);

  // Start Call after Match Found
  const startConnection = useCallback(async ({ partnerId, isInitiator, iceServers, mode, existingStream }) => {
    let stream = existingStream || localStreamRef.current;

    if (mode !== 'chat' && (!stream || stream.getTracks().length === 0)) {
      stream = await initLocalMedia(mode);
    }

    const pc = createPeerConnection(partnerId, iceServers, mode, stream);

    if (isInitiator) {
      const channel = pc.createDataChannel('stranger-chat', { ordered: true });
      setupDataChannelEvents(channel);

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: mode !== 'chat',
          offerToReceiveVideo: mode === 'video'
        });
        await pc.setLocalDescription(offer);

        socket.emit('signal', {
          targetId: partnerId,
          signal: {
            type: 'offer',
            sdp: offer.sdp
          }
        });
        console.log('[WebRTC] Initiator created & emitted offer to', partnerId);
      } catch (err) {
        console.error('[WebRTC] Offer creation error:', err);
      }
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannelEvents(event.channel);
      };
    }

    // Flush any pending signals that arrived while PC was being created
    while (pendingSignalsRef.current.length > 0) {
      const pending = pendingSignalsRef.current.shift();
      console.log('[WebRTC] Flushing pending signal after PC creation:', pending.signal.type);
      await processSignal(pc, pending.senderId, pending.signal);
    }
  }, [initLocalMedia, createPeerConnection, setupDataChannelEvents, socket, processSignal]);

  // Send message via DataChannel
  const sendP2PMessage = useCallback((text, id, timestamp) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({
          type: 'chat',
          text,
          id,
          timestamp
        }));
        return true;
      } catch (err) {
        console.warn('[WebRTC] P2P send failed:', err);
      }
    }
    return false;
  }, []);

  const sendP2PTyping = useCallback((isTyping) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({
          type: 'typing',
          isTyping
        }));
        return true;
      } catch {}
    }
    return false;
  }, []);

  // Media track toggles
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMuted = !isMuted;
        audioTracks.forEach(t => { t.enabled = !newMuted; });
        setIsMuted(newMuted);
      }
    }
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newOff = !isVideoOff;
        videoTracks.forEach(t => { t.enabled = !newOff; });
        setIsVideoOff(newOff);
      }
    }
  }, [isVideoOff]);

  useEffect(() => {
    updateDeviceList();
    navigator.mediaDevices?.addEventListener?.('devicechange', updateDeviceList);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', updateDeviceList);
      stopAll();
    };
  }, [updateDeviceList, stopAll]);

  return {
    localStream,
    remoteStream,
    isDataChannelReady,
    isMuted,
    isVideoOff,
    isLocalSpeaking,
    isRemoteSpeaking,
    connectionState,
    audioDevices,
    videoDevices,
    selectedAudioId,
    selectedVideoId,
    facingMode,
    isHardwareRevoked,
    initLocalMedia,
    startConnection,
    handleSignal,
    sendP2PMessage,
    sendP2PTyping,
    cleanupPeerConnection,
    stopAll,
    toggleMute,
    toggleVideo,
    switchCamera,
    switchMic,
    revokePermissions
  };
}
