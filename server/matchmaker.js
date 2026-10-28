/**
 * In-Memory Matchmaker for TalkToStranger
 * Ultra-fast queueing algorithm supporting text, audio, and video modes
 * with Priority queue acceleration, gender metadata, optional Region/Country matching,
 * and smart instant FIFO pairing.
 */

class Matchmaker {
  constructor() {
    this.queues = {
      chat: new Set(),
      audio: new Set(),
      video: new Set()
    };

    this.priorityQueues = {
      chat: new Set(),
      audio: new Set(),
      video: new Set()
    };

    // User metadata: socketId -> { mode, tier, gender, region, joinedAt }
    this.users = new Map();

    // Active matches: socketId -> { partnerId, roomId, mode, partnerTier, partnerGender, partnerRegion, matchedAt }
    this.matches = new Map();
  }

  addUser(socketId, mode = 'video', tier = 'guest', gender = 'other', region = 'global') {
    if (!['chat', 'audio', 'video'].includes(mode)) {
      mode = 'video';
    }

    this.users.set(socketId, {
      mode,
      tier,
      gender: gender || 'other',
      region: region || 'global',
      joinedAt: Date.now()
    });

    return this.findAndPair(socketId, mode, tier);
  }

  findAndPair(socketId, mode, tier) {
    const queue = this.queues[mode];
    const priorityQueue = this.priorityQueues[mode];
    if (!queue || !priorityQueue) return null;

    const currentUser = this.users.get(socketId) || {
      mode,
      tier,
      gender: 'other',
      region: 'global',
      joinedAt: Date.now()
    };

    let bestMatchId = null;

    // Search order: Priority queue first, then general queue
    const candidatePools = [priorityQueue, queue];

    // PASS 1: If user chose a specific region, prioritize an exact country match!
    if (currentUser.region && currentUser.region !== 'global') {
      for (const pool of candidatePools) {
        for (const candidateId of pool) {
          if (candidateId !== socketId) {
            const candidateUser = this.users.get(candidateId);
            if (candidateUser && candidateUser.region === currentUser.region) {
              bestMatchId = candidateId;
              break;
            }
          }
        }
        if (bestMatchId) break;
      }
    }

    // PASS 2: If no exact region match (or user picked 'global'), match with any available candidate
    if (!bestMatchId) {
      for (const pool of candidatePools) {
        for (const candidateId of pool) {
          if (candidateId !== socketId) {
            bestMatchId = candidateId;
            break;
          }
        }
        if (bestMatchId) break;
      }
    }

    if (bestMatchId) {
      // Remove both from all waiting queues
      queue.delete(bestMatchId);
      priorityQueue.delete(bestMatchId);
      queue.delete(socketId);
      priorityQueue.delete(socketId);

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const candidateUser = this.users.get(bestMatchId) || { tier: 'guest', gender: 'other', region: 'global' };

      const matchData = {
        roomId,
        mode,
        matchedAt: Date.now()
      };

      this.matches.set(socketId, {
        partnerId: bestMatchId,
        partnerTier: candidateUser.tier || 'guest',
        partnerGender: candidateUser.gender || 'other',
        partnerRegion: candidateUser.region || 'global',
        ...matchData
      });

      this.matches.set(bestMatchId, {
        partnerId: socketId,
        partnerTier: currentUser.tier || 'guest',
        partnerGender: currentUser.gender || 'other',
        partnerRegion: currentUser.region || 'global',
        ...matchData
      });

      return {
        matched: true,
        user1: socketId,
        user2: bestMatchId,
        user1Tier: currentUser.tier || 'guest',
        user2Tier: candidateUser.tier || 'guest',
        user1Gender: currentUser.gender || 'other',
        user2Gender: candidateUser.gender || 'other',
        user1Region: currentUser.region || 'global',
        user2Region: candidateUser.region || 'global',
        roomId,
        mode
      };
    } else {
      if (tier === 'priority') {
        priorityQueue.add(socketId);
      } else {
        queue.add(socketId);
      }
      return { matched: false };
    }
  }

  removeFromQueue(socketId) {
    for (const mode in this.queues) {
      this.queues[mode].delete(socketId);
      this.priorityQueues[mode].delete(socketId);
    }
    this.users.delete(socketId);
  }

  endMatch(socketId) {
    const match = this.matches.get(socketId);
    if (!match) return null;

    const partnerId = match.partnerId;
    this.matches.delete(socketId);
    this.matches.delete(partnerId);

    return {
      partnerId,
      roomId: match.roomId,
      mode: match.mode
    };
  }

  getMatch(socketId) {
    return this.matches.get(socketId) || null;
  }

  getQueueStats() {
    return {
      chat: this.queues.chat.size + this.priorityQueues.chat.size,
      audio: this.queues.audio.size + this.priorityQueues.audio.size,
      video: this.queues.video.size + this.priorityQueues.video.size,
      totalWaiting:
        this.queues.chat.size + this.priorityQueues.chat.size +
        this.queues.audio.size + this.priorityQueues.audio.size +
        this.queues.video.size + this.priorityQueues.video.size,
      activeChats: Math.floor(this.matches.size / 2)
    };
  }
}

module.exports = Matchmaker;
