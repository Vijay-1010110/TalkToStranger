require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const Matchmaker = require('./matchmaker');
const { router: authRouter } = require('./auth');

const app = express();
const server = http.createServer(app);

// 1. Security: Disable framework fingerprinting
app.disable('x-powered-by');

// 2. Security: Standard OWASP protection headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  next();
});

// 3. Security: Domain Whitelist / CORS Lockdown
const ALLOWED_ORIGINS = [
  'https://talktostranger-9my8.onrender.com',
  'https://vijay-1010110.github.io',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173'
];
if (process.env.ALLOWED_ORIGINS) {
  ALLOWED_ORIGINS.push(...process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()));
}

function isOriginAllowed(origin) {
  if (!origin) return true; // Server-to-server, curl, same-origin
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.onrender.com') || origin.endsWith('.github.io')) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  })
);

app.use(express.json({ limit: '100kb' })); // Guard against oversized payload attacks

// 4. Security: In-memory sliding rate limiter for Auth APIs (Anti-Brute Force / Anti-Bot)
const ipRateLimits = new Map();
function authRateLimiter(maxRequests = 20, windowMs = 60000) {
  return (req, res, next) => {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();
    let entry = ipRateLimits.get(ip);
    if (!entry || now - entry.resetTime > windowMs) {
      entry = { count: 1, resetTime: now };
      ipRateLimits.set(ip, entry);
    } else {
      entry.count++;
      if (entry.count > maxRequests) {
        return res.status(429).json({ error: 'Too many requests. Please slow down.' });
      }
    }
    next();
  };
}

// Clean stale IP rate limit tracking every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRateLimits.entries()) {
    if (now - entry.resetTime > 60000) ipRateLimits.delete(ip);
  }
}, 5 * 60 * 1000);

// Mount authentication API with rate limiting
app.use('/api/auth', authRateLimiter(20, 60000), authRouter);

// Serve static frontend in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// 5. STUN & Dynamic TURN Configuration (Zero hardcoded secrets in source code)
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

let cachedMeteredServers = [];
let lastMeteredFetch = 0;

// Dynamic Metered TURN fetcher via authenticated backend REST API
async function refreshMeteredTurn() {
  const apiKey = process.env.METERED_API_KEY;
  const appName = process.env.METERED_APP_NAME;

  if (apiKey && appName) {
    try {
      const url = `https://.metered.live/api/v1/turn/credentials?apiKey=`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          cachedMeteredServers = data;
          lastMeteredFetch = Date.now();
          console.log(`[WebRTC TURN] Loaded  dynamic TURN relay servers securely.`);
          return;
        }
      }
    } catch (err) {
      console.warn('[WebRTC TURN] Could not refresh Metered TURN credentials:', err.message);
    }
  }
}

// Refresh immediately and then every 30 minutes
refreshMeteredTurn();
setInterval(refreshMeteredTurn, 30 * 60 * 1000);

function getIceServers() {
  const servers = [...DEFAULT_ICE_SERVERS];

  // 1. Dynamic credentials fetched from Metered API
  if (cachedMeteredServers.length > 0) {
    servers.unshift(...cachedMeteredServers);
  } else if (process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    // 2. Credentials securely injected via environment variables (Render / .env)
    const urls = process.env.TURN_URLS
      ? process.env.TURN_URLS.split(',').map((u) => u.trim())
      : [
          'turn:global.relay.metered.ca:80',
          'turn:global.relay.metered.ca:443',
          'turn:global.relay.metered.ca:443?transport=tcp',
          'turns:global.relay.metered.ca:443?transport=tcp'
        ];
    servers.unshift({
      urls,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL
    });
  } else if (process.env.TURN_URLS) {
    const urls = process.env.TURN_URLS.split(',').map((u) => u.trim());
    servers.unshift({ urls });
  }

  // 3. Custom raw JSON ICE servers if provided
  if (process.env.ICE_SERVERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.ICE_SERVERS_JSON);
      if (Array.isArray(parsed) && parsed.length > 0) {
        servers.unshift(...parsed);
      }
    } catch (e) {
      console.warn('[WebRTC ICE] Could not parse ICE_SERVERS_JSON:', e.message);
    }
  }

  return servers;
}

// 6. Socket.IO Server with Strict Origin & Buffer Caps
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: ['GET', 'POST']
  },
  pingTimeout: 10000,
  pingInterval: 5000,
  maxHttpBufferSize: 1e6 // 1MB maximum payload (prevents memory exhaustion)
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

// Per-socket rate limiter to block automated message floods / rapid matchmaker abuse
const socketEventCounts = new Map();
function checkSocketRate(socketId, maxPerSec = 10) {
  const now = Date.now();
  let tracker = socketEventCounts.get(socketId);
  if (!tracker || now - tracker.windowStart > 1000) {
    tracker = { count: 1, windowStart: now };
    socketEventCounts.set(socketId, tracker);
    return true;
  }
  tracker.count++;
  return tracker.count <= maxPerSec;
}

const ALLOWED_MODES = new Set(['chat', 'audio', 'video']);
const ALLOWED_TIERS = new Set(['guest', 'standard', 'priority']);
const ALLOWED_GENDERS = new Set(['male', 'female', 'other']);
const ALLOWED_REGIONS = new Set([
  'global',
  'north_america',
  'europe',
  'asia',
  'south_america',
  'africa',
  'oceania'
]);

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

  // 1. Join queue / Find stranger (validated & rate-limited)
  socket.on('find-stranger', (payload = {}) => {
    if (!checkSocketRate(socket.id, 5)) return;

    cleanupCurrentMatch(socket);

    const safeMode = ALLOWED_MODES.has(payload.mode) ? payload.mode : 'video';
    const safeTier = ALLOWED_TIERS.has(payload.tier) ? payload.tier : 'guest';
    const safeGender = ALLOWED_GENDERS.has(payload.gender) ? payload.gender : 'other';
    const safeRegion = ALLOWED_REGIONS.has(payload.region) ? payload.region : 'global';

    const result = matchmaker.addUser(socket.id, safeMode, safeTier, safeGender, safeRegion);

    if (result && result.matched) {
      const {
        user1,
        user2,
        user1Tier,
        user2Tier,
        user1Gender,
        user2Gender,
        user1Region,
        user2Region,
        roomId
      } = result;

      const s1 = io.sockets.sockets.get(user1);
      const s2 = io.sockets.sockets.get(user2);

      if (s1) s1.join(roomId);
      if (s2) s2.join(roomId);

      const iceServers = getIceServers();

      // Notify initiator
      io.to(user1).emit('match-found', {
        roomId,
        partnerId: user2,
        partnerTier: user2Tier,
        partnerGender: user2Gender || 'other',
        partnerRegion: user2Region || 'global',
        isInitiator: true,
        mode: safeMode,
        iceServers
      });

      // Notify receiver
      io.to(user2).emit('match-found', {
        roomId,
        partnerId: user1,
        partnerTier: user1Tier,
        partnerGender: user1Gender || 'other',
        partnerRegion: user1Region || 'global',
        isInitiator: false,
        mode: safeMode,
        iceServers
      });

      broadcastStats();
    } else {
      socket.emit('waiting-for-stranger', {
        mode: safeMode,
        message: safeTier === 'priority' ? 'Priority queue active. Looking for a stranger...' : 'Looking for a stranger...'
      });
      broadcastStats();
    }
  });

  // 2. WebRTC Signaling relay (Offer, Answer, ICE Candidates with strict validation)
  socket.on('signal', ({ targetId, signal } = {}) => {
    if (!targetId || typeof targetId !== 'string') return;
    if (!signal || typeof signal !== 'object') return;

    const match = matchmaker.getMatch(socket.id);
    if (!match || match.partnerId !== targetId) {
      return;
    }
    io.to(targetId).emit('signal', {
      senderId: socket.id,
      signal
    });
  });

  // 3. Chat message relay (length capped, control characters stripped, rate-limited)
  socket.on('chat-message', ({ text, id, timestamp } = {}) => {
    if (!checkSocketRate(socket.id, 8)) return; // Max 8 messages / sec
    if (!text || typeof text !== 'string') return;

    const match = matchmaker.getMatch(socket.id);
    if (!match) return;

    // Sanitize: max 1000 characters, strip null bytes and invisible control codes
    const safeText = text.slice(0, 1000).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    if (!safeText.trim()) return;

    socket.to(match.partnerId).emit('chat-message', {
      sender: 'stranger',
      text: safeText,
      id: String(id || Date.now() + '-' + Math.random().toString(36).substr(2, 5)).slice(0, 64),
      timestamp: typeof timestamp === 'number' ? timestamp : Date.now()
    });
  });

  // 4. Typing indicator
  socket.on('typing', ({ isTyping } = {}) => {
    const match = matchmaker.getMatch(socket.id);
    if (match) {
      socket.to(match.partnerId).emit('stranger-typing', { isTyping: !!isTyping });
    }
  });

  // 5. External Web Co-Browse (Strict URL protocol validation - blocks javascript: and data: attacks)
  socket.on('web-share', ({ url, active } = {}) => {
    const match = matchmaker.getMatch(socket.id);
    if (!match) return;

    let safeUrl = '';
    if (active && url && typeof url === 'string') {
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          safeUrl = parsed.href;
        } else {
          return; // Drop invalid protocols (e.g. javascript:, data:, file:)
        }
      } catch {
        return;
      }
    }

    socket.to(match.partnerId).emit('web-share', {
      url: safeUrl,
      active: !!active && !!safeUrl,
      senderId: socket.id
    });
  });

  // 6. Skip stranger / Next (Rate-limited)
  socket.on('skip-stranger', ({ requeue = false, mode, tier = 'guest', gender = 'other', region = 'global' } = {}) => {
    if (!checkSocketRate(socket.id, 4)) return;

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
      const safeMode = ALLOWED_MODES.has(mode) ? mode : (prevMatch ? prevMatch.mode : 'video');
      const safeTier = ALLOWED_TIERS.has(tier) ? tier : 'guest';
      const safeGender = ALLOWED_GENDERS.has(gender) ? gender : 'other';
      const safeRegion = ALLOWED_REGIONS.has(region) ? region : 'global';

      const result = matchmaker.addUser(socket.id, safeMode, safeTier, safeGender, safeRegion);

      if (result && result.matched) {
        const {
          user1,
          user2,
          user1Tier,
          user2Tier,
          user1Gender,
          user2Gender,
          user1Region,
          user2Region,
          roomId
        } = result;
        const s1 = io.sockets.sockets.get(user1);
        const s2 = io.sockets.sockets.get(user2);

        if (s1) s1.join(roomId);
        if (s2) s2.join(roomId);

        const iceServers = getIceServers();

        io.to(user1).emit('match-found', {
          roomId,
          partnerId: user2,
          partnerTier: user2Tier,
          partnerGender: user2Gender || 'other',
          partnerRegion: user2Region || 'global',
          isInitiator: true,
          mode: safeMode,
          iceServers
        });

        io.to(user2).emit('match-found', {
          roomId,
          partnerId: user1,
          partnerTier: user1Tier,
          partnerGender: user1Gender || 'other',
          partnerRegion: user1Region || 'global',
          isInitiator: false,
          mode: safeMode,
          iceServers
        });
      } else {
        socket.emit('waiting-for-stranger', {
          mode: safeMode,
          message: safeTier === 'priority' ? 'Priority queue active. Looking for a stranger...' : 'Looking for a stranger...'
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
    socketEventCounts.delete(socket.id);

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

// ICE configuration diagnostic endpoint (Never leaks secret credentials in plain HTTP)
app.get('/api/ice-servers', (req, res) => {
  res.json({
    status: 'ok',
    hasCustomTurn: !!(process.env.TURN_URLS || (process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL)),
    hasMeteredTurn: cachedMeteredServers.length > 0
  });
});

// Catch-all for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("[TalkToStranger] Server active on port " + PORT);
  console.log("[Security] OWASP headers, CORS lockdown, rate limiting, and parameter validation active.");
});
