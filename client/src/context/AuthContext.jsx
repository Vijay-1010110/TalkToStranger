import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';

const AuthContext = createContext(null);

const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
    ? 'https://talktostranger-9my8.onrender.com'
    : '';

export function AuthProvider({ children }) {
  // Pre-seed an anonymous guest so the app can render instantly with zero delay
  const [user, setUser] = useState(() => ({
    id: 'guest_' + Math.random().toString(36).substring(2, 9),
    username: 'Guest',
    tier: 'guest',
    isGuest: true
  }));
  const [token, setToken] = useState(() => safeStorage.getItem('stranger_token') || null);
  const [loading, setLoading] = useState(true);

  // Load or validate user profile on mount
  useEffect(() => {
    let isMounted = true;

    // Hard safety timeout: NEVER hold the loading screen for more than 1000ms
    // under any circumstance (cold start, slow mobile 3G/4G network, or packet loss)
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    async function loadUser() {
      try {
        const storedToken = safeStorage.getItem('stranger_token');
        if (storedToken) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              if (isMounted && data.user) {
                setUser(data.user);
                setToken(storedToken);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn('[Auth] Token validation timed out or failed:', e);
          }
        }

        // Initialize guest with a fast timeout so it never hangs
        await initGuest();
      } catch (err) {
        console.warn('[Auth] loadUser error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const initGuest = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/api/auth/guest`, {
        method: 'POST',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.token && data.user) {
        safeStorage.setItem('stranger_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return;
      }
    } catch (e) {
      console.warn('[Auth] Guest fetch failed or timed out; running with local anonymous session:', e);
    }
  };

  const login = async (loginVal, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginVal, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    safeStorage.setItem('stranger_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    safeStorage.setItem('stranger_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    safeStorage.removeItem('stranger_token');
    setToken(null);
    setUser({
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      username: 'Guest',
      tier: 'guest',
      isGuest: true
    });
    await initGuest();
  };

  const upgradeToPriority = async () => {
    if (!token || user?.isGuest) {
      throw new Error('Please create an account before activating Priority Pass.');
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/upgrade-priority`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to activate Priority Pass');
    }

    safeStorage.setItem('stranger_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const isPriority = user?.tier === 'priority';
  const isGuest = !!user?.isGuest;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        upgradeToPriority,
        isPriority,
        isGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
