const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'database.json');

class Database {
  constructor() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialData = {
        users: [],
        guests: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      this.data = initialData;
    } else {
      try {
        this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (err) {
        console.error('[DB] Error reading database file, initializing empty:', err);
        this.data = { users: [], guests: [] };
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error persisting to database file:', err);
    }
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }

  getUserByUsername(username) {
    if (!username) return null;
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  createUser({ username, email, passwordHash, tier = 'standard' }) {
    const user = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username,
      email: email.toLowerCase(),
      passwordHash,
      tier, // 'standard' | 'priority'
      createdAt: Date.now(),
      savedTags: [],
      karma: 100
    };

    this.data.users.push(user);
    this.save();
    return user;
  }

  createGuest() {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guest = {
      id: 'gst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: `Guest_${randomSuffix}`,
      isGuest: true,
      tier: 'guest',
      createdAt: Date.now()
    };

    this.data.guests.push(guest);
    // Keep only last 1000 guest logs
    if (this.data.guests.length > 1000) {
      this.data.guests.splice(0, this.data.guests.length - 1000);
    }
    this.save();
    return guest;
  }

  updateUser(id, updates) {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    this.data.users[userIndex] = {
      ...this.data.users[userIndex],
      ...updates
    };

    this.save();
    return this.data.users[userIndex];
  }
}

module.exports = new Database();
