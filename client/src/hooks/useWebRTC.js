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
  const partnerIdRef = useRef(null);
  const localStreamRef = useRef(null);
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
      console.warn('[WebRTC] Media device error:', err);
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

    const activeStream = stream || localStreamRef.current;
    if (activeStream && mode !== 'chat') {
      activeStream.getTracks().forEach((track) => {
        pc.addTrack(track, activeStream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setupAudioAnalyser(event.streams[0], false);
      }
    };

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

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (onConnectionStateChange) {
        onConnectionStateChange(pc.connectionState);
      }
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

  // Start Call after Match Found
  const startConnection = useCallback(async ({ partnerId, isInitiator, iceServers, mode, existingStream }) => {
    let stream = existingStream || localStreamRef.current;

    if (mode !== 'chat' && !stream) {
      stream = await initLocalMedia(mode);
    }

    const pc = createPeerConnection(partnerId, iceServers, mode, stream);

    if (isInitiator) {
      const channel = pc.createDataChannel('stranger-chat', { ordered: true });
      setupDataChannelEvents(channel);

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
      pc.ondatachannel = (event) => {
        setupDataChannelEvents(event.channel);
      };
    }
  }, [initLocalMedia, createPeerConnection, setupDataChannelEvents, socket]);

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
