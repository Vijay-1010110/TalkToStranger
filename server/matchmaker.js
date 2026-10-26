/**
 * In-Memory Matchmaker for TalkToStranger
 * Ultra-fast queueing algorithm supporting text, audio, and video modes
 * with Priority queue acceleration and instant FIFO pairing.
 */

class Matchmaker {
  constructor() {
    // Mode-specific queues: Map<mode, Set<socketId>>
    this.queues = {
      chat: new Set(),
      audio: new Set(),
      video: new Set()
    };

    // Priority queues: Map<mode, Set<socketId>>
    this.priorityQueues = {
      chat: new Set(),
      audio: new Set(),
      video: new Set()
    };

    // User metadata: socketId -> { mode, tier, joinedAt }
    this.users = new Map();

    // Active matches: socketId -> { partnerId, roomId, mode, matchedAt }
    this.matches = new Map();
  }

  addUser(socketId, mode = 'video', tier = 'guest') {
    if (!['chat', 'audio', 'video'].includes(mode)) {
      mode = 'video';
    }

    this.users.set(socketId, {
      mode,
      tier,
      joinedAt: Date.now()
    });

    return this.findAndPair(socketId, mode, tier);
  }

  findAndPair(socketId, mode, tier) {
    const queue = this.queues[mode];
    const priorityQueue = this.priorityQueues[mode];
    if (!queue || !priorityQueue) return null;

    let bestMatchId = null;

    // Search order: Always check priority queue first, then general queue
    const candidatePools = [priorityQueue, queue];

    for (const pool of candidatePools) {
      for (const candidateId of pool) {
        if (candidateId !== socketId) {
          bestMatchId = candidateId;
          break;
        }
      }
      if (bestMatchId) break;
    }

    if (bestMatchId) {
      // Remove both from all waiting queues
      queue.delete(bestMatchId);
      priorityQueue.delete(bestMatchId);
      queue.delete(socketId);
      priorityQueue.delete(socketId);

      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const candidateUser = this.users.get(bestMatchId);
      const currentUser = this.users.get(socketId);

      const matchData = {
        roomId,
        mode,
        matchedAt: Date.now()
      };

      this.matches.set(socketId, {
        partnerId: bestMatchId,
        partnerTier: candidateUser ? candidateUser.tier : 'guest',
        ...matchData
      });

      this.matches.set(bestMatchId, {
        partnerId: socketId,
        partnerTier: currentUser ? currentUser.tier : 'guest',
        ...matchData
      });

      return {
        matched: true,
        user1: socketId,
        user2: bestMatchId,
        user1Tier: currentUser ? currentUser.tier : 'guest',
        user2Tier: candidateUser ? candidateUser.tier : 'guest',
        roomId,
        mode
      };
    } else {
      // Add to corresponding queue
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
