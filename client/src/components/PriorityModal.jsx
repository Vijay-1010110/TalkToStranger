import React, { useState } from 'react';
import { X, Check, ShieldCheck, Zap, Globe, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PriorityModal({ isOpen, onClose, onOpenAuth }) {
  const { user, isPriority, isGuest, upgradeToPriority } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async () => {
    if (isGuest) {
      onClose();
      onOpenAuth();
      return;
    }

    setLoading(true);
    setError('');
    try {
      await upgradeToPriority();
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e) {
      setError(e.message || 'Failed to activate Priority Pass');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    {
      title: 'Priority Match Queue',
      desc: 'Bypass general waiting queues and connect with strangers first.'
    },
    {
      title: 'External Web & Co-Browse Interface',
      desc: 'Unlock live co-viewing of external web pages, docs, and links together.'
    },
    {
      title: 'Verified Anonymous Badge',
      desc: 'Display a clean verified mark proving you are an authenticated peer.'
    },
    {
      title: 'Ad-Free Clean View',
      desc: 'Completely eliminates all native community sponsor slots.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg max-w-sm w-full p-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Priority Pass
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-black font-semibold">
              UNLIMITED
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isPriority ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full border border-white mx-auto flex items-center justify-center text-white">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-white">Priority Pass is Active</h4>
            <p className="text-xs text-[#888888]">
              Your account currently has full access to the Priority matchmaking pool, external web co-viewing, and ad-free browsing.
            </p>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 rounded bg-[#202020] hover:bg-[#282828] text-white text-xs font-mono"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-[#888888] mb-4">
              Priority Pass enhances your peer-to-peer experience with dedicated queueing and external interface tooling.
            </p>

            {/* Perks list */}
            <div className="space-y-3 mb-5">
              {perks.map((p, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-[#222222] border border-[#333333] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#e5e5e5] block">{p.title}</span>
                    <span className="text-[11px] text-[#777777] leading-tight block">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-3 p-2 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-3 p-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono text-center">
                Priority Pass activated successfully!
              </div>
            )}

            {isGuest ? (
              <button
                type="button"
                onClick={handleActivate}
                className="w-full py-2.5 rounded bg-white hover:bg-[#e0e0e0] text-black font-semibold text-xs transition-colors font-mono"
              >
                Create Account to Activate
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || success}
                onClick={handleActivate}
                className="w-full py-2.5 rounded bg-white hover:bg-[#e0e0e0] disabled:opacity-50 text-black font-semibold text-xs transition-colors font-mono"
              >
                {loading ? 'Activating...' : 'Activate Priority Pass (Free)'}
              </button>
            )}

            <div className="mt-2 text-center">
              <span className="text-[10px] text-[#555555] font-mono">
                100% Free during beta • No credit card required
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
