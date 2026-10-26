import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('stranger_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[Auth] Token validation failed:', e);
        }
      }

      // If no valid user, initialize anonymous guest session
      await initGuest();
      setLoading(false);
    }

    loadUser();
  }, [token]);

  const initGuest = async () => {
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('stranger_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
    } catch (e) {
      console.error('[Auth] Failed to initialize guest:', e);
    }
  };

  const login = async (loginVal, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginVal, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('stranger_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    localStorage.setItem('stranger_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    localStorage.removeItem('stranger_token');
    setToken(null);
    setUser(null);
    await initGuest();
  };

  const upgradeToPriority = async () => {
    if (!token || user?.isGuest) {
      throw new Error('Please create an account before activating Priority Pass.');
    }

    const res = await fetch('/api/auth/upgrade-priority', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to activate Priority Pass');
    }

    localStorage.setItem('stranger_token', data.token);
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
