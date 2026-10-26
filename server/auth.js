const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'talk-to-stranger-secret-key-free-p2p';

// Helper to sign JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      tier: user.tier || 'standard',
      isGuest: !!user.isGuest
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Middleware to verify token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters.' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens, and underscores.' });
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    if (db.getUserByUsername(cleanUsername)) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    if (db.getUserByEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      tier: 'standard'
    });

    const token = generateToken(user);
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tier: user.tier,
        karma: user.karma
      },
      token
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Username/email and password required.' });
    }

    const cleanLogin = String(login).trim();
    let user = db.getUserByUsername(cleanLogin);
    if (!user) {
      user = db.getUserByEmail(cleanLogin);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tier: user.tier,
        karma: user.karma
      },
      token
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest Instant Access
router.post('/guest', (req, res) => {
  try {
    const guest = db.createGuest();
    const token = generateToken(guest);

    res.json({
      user: guest,
      token
    });
  } catch (err) {
    console.error('[Auth] Guest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current User Profile
router.get('/me', authMiddleware, (req, res) => {
  if (req.user.isGuest) {
    return res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        isGuest: true,
        tier: 'guest'
      }
    });
  }

  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      tier: user.tier,
      karma: user.karma,
      isGuest: false
    }
  });
});

// Upgrade / Toggle Priority Pass (Simulation / Instant activation)
router.post('/upgrade-priority', authMiddleware, (req, res) => {
  if (req.user.isGuest) {
    return res.status(400).json({ error: 'Please create an account before activating Priority.' });
  }

  const updated = db.updateUser(req.user.id, { tier: 'priority' });
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = generateToken(updated);
  res.json({
    user: {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      tier: updated.tier,
      karma: updated.karma
    },
    token,
    message: 'Priority status activated.'
  });
});

module.exports = {
  router,
  authMiddleware
};
