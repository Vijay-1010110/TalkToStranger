import React, { useState } from 'react';
import { X, User, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { user, login, register, logout, isGuest } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loginInput, setLoginInput] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (tab === 'login') {
        await login(loginInput, password);
      } else {
        await register(registerUsername, registerEmail, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-[#262626] rounded max-w-sm w-full p-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              {user && !isGuest ? 'Account Profile' : 'Identity'}
            </span>
            {user?.tier === 'priority' && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-black font-semibold">
                PRIORITY
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is already logged in with a permanent account */}
        {user && !isGuest ? (
          <div className="space-y-4">
            <div className="p-3 bg-[#181818] border border-[#282828] rounded">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#888888]">Username:</span>
                <span className="text-white font-mono font-semibold">{user.username}</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#888888]">Email:</span>
                <span className="text-[#cccccc] font-mono">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#888888]">Status:</span>
                <span className="font-mono font-semibold text-white uppercase">
                  {user.tier}
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full py-2 rounded border border-[#333333] hover:border-[#555555] bg-[#1a1a1a] text-xs font-mono text-[#cccccc] hover:text-white transition-colors"
            >
              Sign Out (Switch to Guest)
            </button>
          </div>
        ) : (
          /* Login / Register Tabs */
          <div>
            {isGuest && (
              <div className="mb-3 p-2 bg-[#171717] border border-[#222222] rounded text-[11px] text-[#888888] flex items-center justify-between">
                <span>Current session: <strong className="text-white font-mono">{user?.username}</strong></span>
                <span className="text-[10px] text-emerald-400 font-mono">GUEST</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#181818] border border-[#242424] rounded mb-4">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className={`py-1.5 text-xs font-mono rounded transition-colors ${
                  tab === 'login' ? 'bg-[#282828] text-white font-semibold' : 'text-[#888888]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); }}
                className={`py-1.5 text-xs font-mono rounded transition-colors ${
                  tab === 'register' ? 'bg-[#282828] text-white font-semibold' : 'text-[#888888]'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === 'login' ? (
                <div>
                  <label className="block text-[11px] font-mono text-[#888888] mb-1">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full px-2.5 py-1.5 bg-[#161616] border border-[#2c2c2c] focus:border-[#555555] rounded text-xs text-white placeholder-[#555555] outline-none font-sans"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-mono text-[#888888] mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      placeholder="e.g. shadow_coder"
                      className="w-full px-2.5 py-1.5 bg-[#161616] border border-[#2c2c2c] focus:border-[#555555] rounded text-xs text-white placeholder-[#555555] outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#888888] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-2.5 py-1.5 bg-[#161616] border border-[#2c2c2c] focus:border-[#555555] rounded text-xs text-white placeholder-[#555555] outline-none font-sans"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-mono text-[#888888] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-2.5 py-1.5 bg-[#161616] border border-[#2c2c2c] focus:border-[#555555] rounded text-xs text-white placeholder-[#555555] outline-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2 rounded bg-white hover:bg-[#e0e0e0] text-black font-semibold text-xs transition-colors font-mono disabled:opacity-50"
              >
                {submitting ? 'Authenticating...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-3 pt-3 border-t border-[#222222] text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-[#777777] hover:text-white font-mono"
              >
                Continue as Anonymous Guest
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
