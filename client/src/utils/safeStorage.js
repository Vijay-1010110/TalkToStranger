// Bulletproof Storage Helper
// Safely falls back to an in-memory dictionary if localStorage throws SecurityError
// (common in mobile Safari Private Browsing mode, restricted incognito, or embedded WebViews).

const memoryStore = new Map();

export const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      // localStorage blocked or restricted
    }
    return memoryStore.get(key) || null;
  },

  setItem: (key, val) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
        return;
      }
    } catch (e) {
      // localStorage quota exceeded or restricted
    }
    memoryStore.set(key, String(val));
  },

  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
    memoryStore.delete(key);
  }
};
