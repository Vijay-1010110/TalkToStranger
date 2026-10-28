import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageSquare, Send, ExternalLink, Bookmark } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, currentRoomId = null }) {
  const [copied, setCopied] = useState(false);
  const [bookmarkToast, setBookmarkToast] = useState(false);

  if (!isOpen) return null;

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://talktostranger-9my8.onrender.com';
  const shareTitle = 'Talk to Stranger - Free Omegle Alternative';
  const shareText = 'Hey! Chat with strangers online for free on Talk to Stranger (Omegle alternative with random video calls, voice, and text):';
  const fullShareUrl = `${siteUrl}/`;

  // Direct 1-click share URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${fullShareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullShareUrl)}&hashtags=omegle,talktostranger,randomvideochat`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullShareUrl)}&text=${encodeURIComponent(shareText)}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(fullShareUrl)}&title=${encodeURIComponent('TalkToStranger - Free P2P Encrypted Omegle Alternative')}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Native mobile share if supported
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: fullShareUrl,
        });
      } catch (err) {
        // User canceled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-2xl relative text-slate-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded hover:bg-[#334155] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-white">Share Talk to Stranger</h3>
            <p className="text-[11px] text-slate-400">Invite friends or share with communities</p>
          </div>
        </div>

        {/* 1-Click Social Share Buttons */}
        <div className="grid grid-cols-2 gap-2 my-4">
          
          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366] hover:text-white font-mono text-xs font-semibold transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          {/* Twitter / X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 hover:bg-sky-500 hover:text-white font-mono text-xs font-semibold transition-all"
          >
            <span className="font-bold text-xs">𝕏</span>
            <span>Twitter / X</span>
          </a>

          {/* Telegram */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500 hover:text-white font-mono text-xs font-semibold transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Telegram</span>
          </a>

          {/* Reddit */}
          <a
            href={redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500 hover:text-white font-mono text-xs font-semibold transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Reddit</span>
          </a>

        </div>

        {/* Bookmark & Mobile Share Action Row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => {
              setBookmarkToast(true);
              setTimeout(() => setBookmarkToast(false), 3500);
            }}
            className="py-2 px-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-900 font-mono text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmark (Ctrl+D)</span>
          </button>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
            <button
              onClick={handleNativeShare}
              className="py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More Options</span>
            </button>
          ) : (
            <button
              onClick={handleCopyLink}
              className="py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-mono text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied Link!' : 'Quick Copy'}</span>
            </button>
          )}
        </div>

        {/* Bookmark Feedback Alert */}
        {bookmarkToast && (
          <div className="mb-3 p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-center font-mono text-[11px] animate-fade-in">
            📌 Press <strong>Ctrl + D</strong> (or <strong>⌘ + D</strong> on Mac) to bookmark!
          </div>
        )}

        {/* Copy Website Link Box */}
        <div className="pt-3 border-t border-[#334155]">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Website Link
          </span>
          <div className="flex items-center gap-1.5 p-1.5 bg-[#0f172a] border border-[#334155] rounded-lg">
            <input
              type="text"
              readOnly
              value={fullShareUrl}
              className="bg-transparent text-xs font-mono text-slate-300 px-1 flex-1 outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1 transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-200 text-slate-900'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
