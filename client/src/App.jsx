import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import SearchingView from './components/SearchingView';
import MediaView from './components/MediaView';
import ChatPane from './components/ChatPane';
import ControlsBar from './components/ControlsBar';
import ShortcutsModal from './components/ShortcutsModal';
import AuthModal from './components/AuthModal';
import PriorityModal from './components/PriorityModal';
import DeviceSettingsModal from './components/DeviceSettingsModal';
import WebSharePane from './components/WebSharePane';
import SponsorCard from './components/SponsorCard';
import LoadingScreen from './components/LoadingScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebRTC } from './hooks/useWebRTC';
import { sounds } from './utils/sound';

// Persistent Unique Device/Browser Client ID
let uniqueClientId = '';
if (typeof window !== 'undefined') {
  uniqueClientId = localStorage.getItem('stranger_unique_client_id');
  if (!uniqueClientId) {
    uniqueClientId = 'cid_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem('stranger_unique_client_id', uniqueClientId);
  }
}

const socket = io(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000', {
  transports: ['websocket', 'polling'],
  auth: { clientId: uniqueClientId },
  query: { clientId: uniqueClientId }
});

function MainApp() {
  const { user, isPriority, loading: authLoading } = useAuth();
  const [appState, setAppState] = useState('idle'); // 'idle' | 'searching' | 'matched'
  const [selectedMode, setSelectedMode] = useState('video'); // 'chat' | 'audio' | 'video'
  const [activeMode, setActiveMode] = useState('video');
  const [onlineCount, setOnlineCount] = useState(1);
  const [messages, setMessages] = useState([]);
  const [strangerTyping, setStrangerTyping] = useState(false);
  const [partnerTier, setPartnerTier] = useState('guest');
  const [gender, setGender] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stranger_user_gender') || 'male';
    }
    return 'male';
  });
  const [partnerGender, setPartnerGender] = useState('other');
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [appReady, setAppReady] = useState(false);

  const handleSetGender = (val) => {
    setGender(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stranger_user_gender', val);
    }
  };

  // Modals
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isDeviceSettingsOpen, setIsDeviceSettingsOpen] = useState(false);

  // External Web Co-Browse State
  const [isWebShareOpen, setIsWebShareOpen] = useState(false);
  const [sharedWebUrl, setSharedWebUrl] = useState('');
  const [isSharingWeb, setIsSharingWeb] = useState(false);

  // Smooth Loading Screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Incoming P2P data messages handler
  const handleP2PDataMessage = useCallback((msg) => {
    sounds.playMessage();
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleP2PTyping = useCallback((isTyping) => {
    setStrangerTyping(isTyping);
  }, []);

  // WebRTC hook
  const {
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
  } = useWebRTC({
    socket,
    onDataMessage: handleP2PDataMessage,
    onDataTyping: handleP2PTyping
  });

  // Re-acquire permissions after revoke
  const handleReacquirePermissions = async () => {
    await initLocalMedia(selectedMode);
  };

  // Keep local stream active in home view for preview if video mode is selected
  useEffect(() => {
    if (appState === 'idle' && !isHardwareRevoked) {
      if (selectedMode === 'video') {
        initLocalMedia('video');
      } else {
        stopAll();
      }
    }
  }, [selectedMode, appState, isHardwareRevoked, initLocalMedia, stopAll]);

  // Socket event listeners
  useEffect(() => {
    socket.on('connect', () => {
      console.log('[Socket] Connected with id:', socket.id);
    });

    socket.on('stats-update', (stats) => {
      if (stats && stats.onlineUsers !== undefined) {
        setOnlineCount(stats.onlineUsers);
      }
    });

    socket.on('waiting-for-stranger', (data) => {
      setAppState('searching');
    });

    socket.on('match-found', async (data) => {
      sounds.playConnect();
      setActiveMode(data.mode);
      setPartnerTier(data.partnerTier || 'guest');
      setPartnerGender(data.partnerGender || 'other');
      setAppState('matched');
      setMessages([
        {
          id: 'sys-start-' + Date.now(),
          sender: 'system',
          text: 'Connected with stranger. Say hi!'
        }
      ]);

      await startConnection({
        partnerId: data.partnerId,
        isInitiator: data.isInitiator,
        iceServers: data.iceServers,
        mode: data.mode,
        existingStream: localStream
      });
    });

    socket.on('signal', (data) => {
      handleSignal(data);
    });

    socket.on('chat-message', (msg) => {
      sounds.playMessage();
      setMessages((prev) => [...prev, { ...msg, p2p: false }]);
    });

    socket.on('stranger-typing', ({ isTyping }) => {
      setStrangerTyping(isTyping);
    });

    socket.on('web-share', (data) => {
      if (data.active && data.url) {
        setSharedWebUrl(data.url);
        setIsWebShareOpen(true);
        setIsSharingWeb(false);
      } else {
        setSharedWebUrl('');
        setIsWebShareOpen(false);
        setIsSharingWeb(false);
      }
    });

    socket.on('stranger-left', (data) => {
      sounds.playDisconnect();
      cleanupPeerConnection();
      setStrangerTyping(false);
      setIsWebShareOpen(false);
      setSharedWebUrl('');
      setMessages((prev) => [
        ...prev,
        {
          id: 'sys-leave-' + Date.now(),
          sender: 'system',
          text: data.reason || 'Stranger disconnected. Press [Next] or Esc to find someone new.'
        }
      ]);
    });

    return () => {
      socket.off('connect');
      socket.off('stats-update');
      socket.off('waiting-for-stranger');
      socket.off('match-found');
      socket.off('signal');
      socket.off('chat-message');
      socket.off('stranger-typing');
      socket.off('web-share');
      socket.off('stranger-left');
    };
  }, [handleSignal, startConnection, localStream, cleanupPeerConnection]);

  // Actions
  const handleStartSearch = async () => {
    if (selectedMode !== 'chat' && !localStream && !isHardwareRevoked) {
      await initLocalMedia(selectedMode);
    }
    setActiveMode(selectedMode);
    setAppState('searching');
    setMessages([]);
    setIsWebShareOpen(false);
    setSharedWebUrl('');

    socket.emit('find-stranger', {
      mode: selectedMode,
      tier: user?.tier || 'guest',
      gender: gender || 'other'
    });
  };

  const handleNext = () => {
    sounds.playDisconnect();
    cleanupPeerConnection();
    setStrangerTyping(false);
    setIsWebShareOpen(false);
    setSharedWebUrl('');
    setAppState('searching');
    setMessages([]);

    socket.emit('skip-stranger', {
      requeue: true,
      mode: activeMode,
      tier: user?.tier || 'guest',
      gender: gender || 'other'
    });
  };

  const handleLeave = () => {
    cleanupPeerConnection();
    stopAll();
    setStrangerTyping(false);
    setIsWebShareOpen(false);
    setSharedWebUrl('');
    setAppState('idle');
    setMessages([]);
    socket.emit('leave-all');
  };

  const handleCancelSearch = () => {
    socket.emit('leave-all');
    setAppState('idle');
  };

  const handleSendMessage = (text) => {
    const messageId = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const timestamp = Date.now();

    const sentViaP2P = sendP2PMessage(text, messageId, timestamp);

    if (!sentViaP2P) {
      socket.emit('chat-message', {
        text,
        id: messageId,
        timestamp
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        sender: 'you',
        text,
        timestamp,
        p2p: sentViaP2P
      }
    ]);
  };

  const handleTyping = (isTyping) => {
    const sentP2P = sendP2PTyping(isTyping);
    if (!sentP2P) {
      socket.emit('typing', { isTyping });
    }
  };

  const toggleSound = () => {
    const nextMuted = !isSoundMuted;
    setIsSoundMuted(nextMuted);
    sounds.setMuted(nextMuted);
  };

  const handleShareUrl = (url) => {
    setSharedWebUrl(url);
    setIsSharingWeb(true);
    socket.emit('web-share', { url, active: true });
  };

  const handleStopShare = () => {
    setSharedWebUrl('');
    setIsSharingWeb(false);
    socket.emit('web-share', { url: '', active: false });
  };

  const toggleWebShare = () => {
    setIsWebShareOpen((prev) => !prev);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isWebShareOpen) {
          setIsWebShareOpen(false);
        } else if (isDeviceSettingsOpen) {
          setIsDeviceSettingsOpen(false);
        } else if (appState === 'matched') {
          handleNext();
        } else if (appState === 'searching') {
          handleCancelSearch();
        }
        return;
      }

      if (isInput) return;

      if (e.code === 'Space' && appState === 'idle') {
        e.preventDefault();
        handleStartSearch();
      } else if (e.code === 'KeyM' && appState === 'matched') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyV' && appState === 'matched' && activeMode === 'video') {
        e.preventDefault();
        toggleVideo();
      } else if (e.code === 'KeyL' && (appState === 'matched' || appState === 'searching')) {
        e.preventDefault();
        handleLeave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, activeMode, isWebShareOpen, isDeviceSettingsOpen, handleNext, handleStartSearch, handleLeave, toggleMute, toggleVideo]);

  // Loading Screen
  if (authLoading || !appReady) {
    return <LoadingScreen status="Connecting to decentralized P2P network..." />;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full max-h-[100dvh] bg-[#0a0a0a] text-[#e5e5e5] select-none font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <Navbar
        onlineCount={onlineCount}
        isSoundMuted={isSoundMuted}
        toggleSound={toggleSound}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPriority={() => setIsPriorityOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative min-h-0">
        
        {/* 1. IDLE SCREEN */}
        {appState === 'idle' && (
          <HomeView
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            gender={gender}
            setGender={handleSetGender}
            onStartSearch={handleStartSearch}
            localStream={localStream}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
            onSwitchCamera={switchCamera}
            onOpenDeviceSettings={() => setIsDeviceSettingsOpen(true)}
            isHardwareRevoked={isHardwareRevoked}
            onReacquirePermissions={handleReacquirePermissions}
          />
        )}

        {/* 2. SEARCHING SCREEN */}
        {appState === 'searching' && (
          <SearchingView
            mode={activeMode}
            onCancel={handleCancelSearch}
          />
        )}

        {/* 3. MATCHED SCREEN */}
        {appState === 'matched' && (
          <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden min-h-0">
            
            {/* Left Media Area: In video/voice mode */}
            {activeMode !== 'chat' && (
              <div
                className={`
                  flex flex-col border-[#1f1f1f] min-h-0
                  ${/* Mobile portrait: stacked top 38% */ 'h-[38%] md:h-full w-full border-b md:border-b-0'}
                  ${/* Tablet & Desktop: side-by-side */ isWebShareOpen ? 'md:w-2/5' : 'md:w-3/5 lg:w-2/3 md:border-r'}
                  ${/* Passport/Square Foldables */ '[aspect-ratio:1/1]:w-1/2 [aspect-ratio:1/1]:h-full [aspect-ratio:1/1]:border-r [aspect-ratio:1/1]:border-b-0'}
                  ${/* Landscape Phone */ 'landscape:max-md:w-1/2 landscape:max-md:h-full landscape:max-md:border-r landscape:max-md:border-b-0'}
                `}
              >
                <MediaView
                  mode={activeMode}
                  localStream={localStream}
                  remoteStream={remoteStream}
                  isMuted={isMuted}
                  isVideoOff={isVideoOff}
                  isLocalSpeaking={isLocalSpeaking}
                  isRemoteSpeaking={isRemoteSpeaking}
                  connectionState={connectionState}
                  isDataChannelReady={isDataChannelReady}
                  partnerTier={partnerTier}
                  partnerGender={partnerGender}
                />
              </div>
            )}

            {/* Middle Optional Web Share Pane */}
            {isWebShareOpen && (
              <div className="w-full md:w-2/5 h-1/2 md:h-full flex flex-col border-b md:border-b-0 md:border-r border-[#1f1f1f] min-h-0">
                <WebSharePane
                  activeUrl={sharedWebUrl}
                  isSharing={isSharingWeb}
                  onShareUrl={handleShareUrl}
                  onStopShare={handleStopShare}
                  onClose={() => setIsWebShareOpen(false)}
                  onOpenPriority={() => setIsPriorityOpen(true)}
                />
              </div>
            )}

            {/* Right Chat Area */}
            <div
              className={`
                flex flex-col min-h-0
                ${activeMode === 'chat' ? 'w-full h-full' : 'flex-1 h-[62%] md:h-full'}
                ${/* Passport/Square Foldables */ '[aspect-ratio:1/1]:w-1/2 [aspect-ratio:1/1]:h-full'}
                ${/* Landscape Phone */ 'landscape:max-md:w-1/2 landscape:max-md:h-full'}
              `}
            >
              <ChatPane
                messages={messages}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                strangerTyping={strangerTyping}
                isMatched={appState === 'matched'}
                isDataChannelReady={isDataChannelReady}
                partnerTier={partnerTier}
                partnerGender={partnerGender}
              />
            </div>

          </div>
        )}

      </main>

      {/* Bottom Controls Bar (Visible during call/chat) */}
      {appState === 'matched' && (
        <ControlsBar
          mode={activeMode}
          onNext={handleNext}
          onLeave={handleLeave}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
          onSwitchCamera={switchCamera}
          onOpenDeviceSettings={() => setIsDeviceSettingsOpen(true)}
          isWebShareOpen={isWebShareOpen}
          toggleWebShare={toggleWebShare}
        />
      )}

      {/* Native Micro-Banner on Mobile Portrait when idle (Hidden for Priority users) */}
      {appState === 'idle' && (
        <div className="block sm:hidden shrink-0">
          <SponsorCard variant="banner" />
        </div>
      )}

      {/* Dialog Modals */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <PriorityModal
        isOpen={isPriorityOpen}
        onClose={() => setIsPriorityOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <DeviceSettingsModal
        isOpen={isDeviceSettingsOpen}
        onClose={() => setIsDeviceSettingsOpen(false)}
        audioDevices={audioDevices}
        videoDevices={videoDevices}
        selectedAudioId={selectedAudioId}
        selectedVideoId={selectedVideoId}
        facingMode={facingMode}
        isHardwareRevoked={isHardwareRevoked}
        onSwitchCamera={switchCamera}
        onSwitchMic={switchMic}
        onRevokePermissions={revokePermissions}
        onReacquirePermissions={handleReacquirePermissions}
        mode={appState === 'matched' ? activeMode : selectedMode}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
