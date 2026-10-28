const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const Matchmaker = require('./matchmaker');
const { router: authRouter } = require('./auth');

const app = express();
const server = http.createServer(app);

// Verified, ultra-fast global STUN & dynamic TURN configuration for peer discovery
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

function getIceServers() {
  const servers = [...DEFAULT_ICE_SERVERS];

  // Support custom TURN relay servers (e.g. from Render or local .env)
  if (process.env.TURN_URLS) {
    const urls = process.env.TURN_URLS.split(',').map((u) => u.trim());
    const turnEntry = { urls };
    if (process.env.TURN_USERNAME) turnEntry.username = process.env.TURN_USERNAME;
    if (process.env.TURN_CREDENTIAL) turnEntry.credential = process.env.TURN_CREDENTIAL;
    servers.unshift(turnEntry);
  }

  return servers;
}

app.use(cors());
app.use(express.json());

// Mount authentication API
app.use('/api/auth', authRouter);

// Serve static frontend in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 10000,
  pingInterval: 5000
});

const matchmaker = new Matchmaker();

// Track UNIQUE online clients across tabs/devices: Map<clientId, Set<socketId>>
const connectedClients = new Map();

function getUniqueOnlineCount() {
  return connectedClients.size;
}

// Broadcast active stats
function broadcastStats() {
  const stats = {
    onlineUsers: getUniqueOnlineCount(),
    ...matchmaker.getQueueStats()
  };
  io.emit('stats-update', stats);
}

io.on('connection', (socket) => {
  // Extract unique client identity
  const clientId =
    socket.handshake.auth?.clientId ||
    socket.handshake.query?.clientId ||
    socket.handshake.address ||
    socket.id;

  if (!connectedClients.has(clientId)) {
    connectedClients.set(clientId, new Set());
  }
  connectedClients.get(clientId).add(socket.id);

  broadcastStats();

  // 1. Join queue / Find stranger
  socket.on('find-stranger', ({ mode = 'video', tier = 'guest', gender = 'other', region = 'global' }) => {
    cleanupCurrentMatch(socket);

    const result = matchmaker.addUser(socket.id, mode, tier, gender, region);

    if (result && result.matched) {
      const { user1, user2, user1Tier, user2Tier, user1Gender, user2Gender, user1Region, user2Region, roomId } = result;

      const s1 = io.sockets.sockets.get(user1);
      const s2 = io.sockets.sockets.get(user2);

      if (s1) s1.join(roomId);
      if (s2) s2.join(roomId);

      // Notify initiator
      io.to(user1).emit('match-found', {
        roomId,
        partnerId: user2,
        partnerTier: user2Tier,
        partnerGender: user2Gender || 'other',
        partnerRegion: user2Region || 'global',
        isInitiator: true,
        mode,
        iceServers: getIceServers()
      });

      // Notify receiver
      io.to(user2).emit('match-found', {
        roomId,
        partnerId: user1,
        partnerTier: user1Tier,
        partnerGender: user1Gender || 'other',
        partnerRegion: user1Region || 'global',
        isInitiator: false,
        mode,
        iceServers: getIceServers()
      });

      broadcastStats();
    } else {
      socket.emit('waiting-for-stranger', {
        mode,
        message: tier === 'priority' ? 'Priority queue active. Looking for a stranger...' : 'Looking for a stranger...'
      });
      broadcastStats();
    }
  });

  // 2. WebRTC Signaling relay (Offer, Answer, ICE Candidates)
  socket.on('signal', ({ targetId, signal }) => {
    const match = matchmaker.getMatch(socket.id);
    if (!match || match.partnerId !== targetId) {
      return;
    }
    io.to(targetId).emit('signal', {
      senderId: socket.id,
      signal
    });
  });

  // 3. Chat message relay
  socket.on('chat-message', ({ text, id, timestamp }) => {
    const match = matchmaker.getMatch(socket.id);
    if (!match) return;

    socket.to(match.partnerId).emit('chat-message', {
      sender: 'stranger',
      text,
      id: id || Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: timestamp || Date.now()
    });
  });

  // 4. Typing indicator
  socket.on('typing', ({ isTyping }) => {
    const match = matchmaker.getMatch(socket.id);
    if (match) {
      socket.to(match.partnerId).emit('stranger-typing', { isTyping: !!isTyping });
    }
  });

  // 5. External Web Co-Browse
  socket.on('web-share', ({ url, active }) => {
    const match = matchmaker.getMatch(socket.id);
    if (match) {
      socket.to(match.partnerId).emit('web-share', {
        url,
        active: !!active,
        senderId: socket.id
      });
    }
  });

  // 6. Skip stranger / Next
  socket.on('skip-stranger', ({ requeue = false, mode, tier = 'guest', gender = 'other', region = 'global' }) => {
    const prevMatch = matchmaker.endMatch(socket.id);
    if (prevMatch) {
      io.to(prevMatch.partnerId).emit('stranger-left', {
        reason: 'Stranger skipped to someone new.'
      });
      const s1 = io.sockets.sockets.get(socket.id);
      const s2 = io.sockets.sockets.get(prevMatch.partnerId);
      if (s1) s1.leave(prevMatch.roomId);
      if (s2) s2.leave(prevMatch.roomId);
    } else {
      matchmaker.removeFromQueue(socket.id);
    }

    broadcastStats();

    if (requeue) {
      const targetMode = mode || (prevMatch ? prevMatch.mode : 'video');
      const result = matchmaker.addUser(socket.id, targetMode, tier, gender, region);

      if (result && result.matched) {
        const { user1, user2, user1Tier, user2Tier, user1Gender, user2Gender, user1Region, user2Region, roomId } = result;
        const s1 = io.sockets.sockets.get(user1);
        const s2 = io.sockets.sockets.get(user2);

        if (s1) s1.join(roomId);
        if (s2) s2.join(roomId);

        io.to(user1).emit('match-found', {
          roomId,
          partnerId: user2,
          partnerTier: user2Tier,
          partnerGender: user2Gender || 'other',
          partnerRegion: user2Region || 'global',
          isInitiator: true,
          mode: targetMode,
          iceServers: FREE_ICE_SERVERS
        });

        io.to(user2).emit('match-found', {
          roomId,
          partnerId: user1,
          partnerTier: user1Tier,
          partnerGender: user1Gender || 'other',
          partnerRegion: user1Region || 'global',
          isInitiator: false,
          mode: targetMode,
          iceServers: FREE_ICE_SERVERS
        });
      } else {
        socket.emit('waiting-for-stranger', {
          mode: targetMode,
          message: tier === 'priority' ? 'Priority queue active. Looking for a stranger...' : 'Looking for a stranger...'
        });
      }
      broadcastStats();
    }
  });

  // 7. Stop / Leave to Home
  socket.on('leave-all', () => {
    cleanupCurrentMatch(socket);
    matchmaker.removeFromQueue(socket.id);
    broadcastStats();
  });

  // 8. Disconnect
  socket.on('disconnect', () => {
    // Remove from unique client tracker
    const userSockets = connectedClients.get(clientId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        connectedClients.delete(clientId);
      }
    }

    cleanupCurrentMatch(socket);
    matchmaker.removeFromQueue(socket.id);
    broadcastStats();
  });

  function cleanupCurrentMatch(sock) {
    const match = matchmaker.endMatch(sock.id);
    if (match) {
      io.to(match.partnerId).emit('stranger-left', {
        reason: 'Stranger has disconnected.'
      });
      const partnerSocket = io.sockets.sockets.get(match.partnerId);
      if (partnerSocket) partnerSocket.leave(match.roomId);
      sock.leave(match.roomId);
    }
  }
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    online: getUniqueOnlineCount(),
    stats: matchmaker.getQueueStats()
  });
});

// ICE configuration diagnostic endpoint
app.get('/api/ice-servers', (req, res) => {
  res.json({
    status: 'ok',
    iceServers: getIceServers(),
    hasCustomTurn: !!process.env.TURN_URLS
  });
});

// Catch-all for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TalkToStranger] Server active on port ${PORT}`);
  console.log(`[Unique Tracking] Online user count tracks unique devices/browsers.`);
});
