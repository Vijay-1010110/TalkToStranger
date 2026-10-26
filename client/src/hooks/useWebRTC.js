import { useState, useRef, useEffect, useCallback } from 'react';

export function useWebRTC({ socket, onDataMessage, onDataTyping, onConnectionStateChange }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isDataChannelReady, setIsDataChannelReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [connectionState, setConnectionState] = useState('new');

  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const partnerIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const localAudioAnalyserRef = useRef(null);
  const remoteAudioAnalyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Sync state to ref
  localStreamRef.current = localStream;

  // Initialize or get local media stream based on mode
  const initLocalMedia = useCallback(async (mode) => {
    // If text mode, no media needed
    if (mode === 'chat') {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        setLocalStream(null);
      }
      return null;
    }

    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: mode === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user'
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsMuted(false);
      setIsVideoOff(false);

      // Setup audio analysis for speech detection
      setupAudioAnalyser(stream, true);

      return stream;
    } catch (err) {
      console.warn('[WebRTC] Media device error:', err);
      // Fallback: If video failed, try audio only
      if (mode === 'video') {
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          setLocalStream(audioOnlyStream);
          setupAudioAnalyser(audioOnlyStream, true);
          return audioOnlyStream;
        } catch (audioErr) {
          console.warn('[WebRTC] Audio fallback failed:', audioErr);
        }
      }
      return null;
    }
  }, []);

  // Setup Web Audio Analyser to visually detect speaking
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
        const speaking = average > 18; // Threshold

        if (isLocal) {
          setIsLocalSpeaking(speaking);
        } else {
          setIsRemoteSpeaking(speaking);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      if (isLocal) {
        localAudioAnalyserRef.current = { audioCtx, analyser };
      } else {
        remoteAudioAnalyserRef.current = { audioCtx, analyser };
      }

      checkVolume();
    } catch (e) {
      // Audio context might fail on restricted browser permissions
    }
  };

  // Setup DataChannel handlers
  const setupDataChannelEvents = useCallback((channel) => {
    dataChannelRef.current = channel;

    channel.onopen = () => {
      console.log('[WebRTC] DataChannel Open (P2P Low-Latency Active)');
      setIsDataChannelReady(true);
    };

    channel.onclose = () => {
      console.log('[WebRTC] DataChannel Closed');
      setIsDataChannelReady(false);
    };

    channel.onerror = (err) => {
      console.warn('[WebRTC] DataChannel Error:', err);
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
        console.error('[WebRTC] DataChannel parse error:', err);
      }
    };
  }, [onDataMessage, onDataTyping]);

  // Clean current peer connection
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
    setIsLocalSpeaking(false);
  }, [cleanupPeerConnection]);

  // Create Peer Connection
  const createPeerConnection = useCallback((partnerId, iceServers, mode, stream) => {
    cleanupPeerConnection();
    partnerIdRef.current = partnerId;

    const pc = new RTCPeerConnection({
      iceServers: iceServers && iceServers.length > 0 ? iceServers : [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    pcRef.current = pc;

    // Attach local stream tracks if available
    const activeStream = stream || localStreamRef.current;
    if (activeStream && mode !== 'chat') {
      activeStream.getTracks().forEach((track) => {
        pc.addTrack(track, activeStream);
      });
    }

    // Remote track listener
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote stream track received:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setupAudioAnalyser(event.streams[0], false);
      }
    };

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && partnerIdRef.current) {
        socket.emit('signal', {
          targetId: partnerIdRef.current,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      if (onConnectionStateChange) {
        onConnectionStateChange(pc.connectionState);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
    };

    return pc;
  }, [cleanupPeerConnection, socket, onConnectionStateChange]);

  // Handle incoming WebRTC signals
  const handleSignal = useCallback(async ({ senderId, signal }) => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        // Process any queued candidates
        while (iceCandidateQueueRef.current.length > 0) {
          const candidate = iceCandidateQueueRef.current.shift();
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn(e));
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('signal', {
          targetId: senderId,
          signal: {
            type: 'answer',
            sdp: answer
          }
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        while (iceCandidateQueueRef.current.length > 0) {
          const candidate = iceCandidateQueueRef.current.shift();
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn(e));
        }
      } else if (signal.type === 'ice-candidate') {
        const candidate = signal.candidate;
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidateQueueRef.current.push(candidate);
        }
      }
    } catch (err) {
      console.error('[WebRTC] Signal handling error:', err);
    }
  }, [socket]);

  // Start Call / Connection after Match Found
  const startConnection = useCallback(async ({ partnerId, isInitiator, iceServers, mode, existingStream }) => {
    let stream = existingStream || localStreamRef.current;

    // If stream not ready for audio/video, request it now
    if (mode !== 'chat' && !stream) {
      stream = await initLocalMedia(mode);
    }

    const pc = createPeerConnection(partnerId, iceServers, mode, stream);

    if (isInitiator) {
      // Create DataChannel on initiator
      const channel = pc.createDataChannel('stranger-chat', {
        ordered: true
      });
      setupDataChannelEvents(channel);

      // Create and send SDP Offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('signal', {
          targetId: partnerId,
          signal: {
            type: 'offer',
            sdp: offer
          }
        });
      } catch (err) {
        console.error('[WebRTC] Offer creation error:', err);
      }
    } else {
      // Receiver listens for DataChannel
      pc.ondatachannel = (event) => {
        setupDataChannelEvents(event.channel);
      };
    }
  }, [initLocalMedia, createPeerConnection, setupDataChannelEvents, socket]);

  // Send message via DataChannel (fallback returns false if channel not ready)
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
        console.warn('[WebRTC] P2P send failed, fallback to socket:', err);
      }
    }
    return false;
  }, []);

  // Send typing status via DataChannel
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  return {
    localStream,
    remoteStream,
    isDataChannelReady,
    isMuted,
    isVideoOff,
    isLocalSpeaking,
    isRemoteSpeaking,
    connectionState,
    initLocalMedia,
    startConnection,
    handleSignal,
    sendP2PMessage,
    sendP2PTyping,
    cleanupPeerConnection,
    stopAll,
    toggleMute,
    toggleVideo
  };
}
