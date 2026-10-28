import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, HelpCircle, Shield, User, Crown, Home, Globe, ChevronDown, Share2, Bookmark, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export default function Navbar({
  onlineCount,
  isSoundMuted,
  toggleSound,
  onOpenShortcuts,
  onOpenAuth,
  onOpenPriority,
  onOpenShare,
  appState = 'idle',
  onGoHome
}) {
  const { user, isPriority, isGuest } = useAuth();
  const { language, setLanguage, t, supportedLanguages } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [bookmarkTip, setBookmarkTip] = useState(null);
  const langDropdownRef = useRef(null);

  const handleBookmark = () => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|od|ad)/.test(navigator.platform);
    const keyCombination = isMac ? '⌘ + D' : 'Ctrl + D';
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    if (isMobile) {
      setBookmarkTip('Tap browser menu (⋮ or ⬆) ➔ Add to Bookmarks');
    } else {
      setBookmarkTip(`Press ${keyCombination} to bookmark Talk to Stranger!`);
    }
    
    setTimeout(() => {
      setBookmarkTip(null);
    }, 3500);
  };

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandClick = () => {
    if (onGoHome) onGoHome();
  };

  const currentLangObj = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];

  return (
    <header className="h-11 sm:h-12 border-b border-[#334155] bg-[#1e293b] px-3 sm:px-4 flex items-center justify-between z-20 shrink-0 shadow-sm relative">
      
      {/* Left: Brand & Tier Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handleBrandClick}
          className="font-mono font-bold text-xs sm:text-sm tracking-wider text-white uppercase hover:text-sky-400 transition-colors flex items-center gap-1.5"
          title="Return to Home"
        >
          <span>{t('brand')}</span>
        </button>

        {appState !== 'idle' && (
          <button
            onClick={onGoHome}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-mono transition-all font-semibold"
            title="Stop and return to Home"
          >
            <Home className="w-3 h-3" />
            <span className="hidden xs:inline">{t('home')}</span>
          </button>
        )}
        
        {isPriority ? (
          <span
            onClick={onOpenPriority}
            className="cursor-pointer text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-900 font-bold flex items-center gap-1 hover:bg-[#e5e5e5] transition-colors"
            title="Priority Pass Active"
          >
            <Crown className="w-2.5 h-2.5 fill-current" />
            <span>{t('priority').toUpperCase()}</span>
          </span>
        ) : (
          <button
            onClick={onOpenPriority}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:border-[#475569] transition-colors"
          >
            {t('priority')}
          </button>
        )}
      </div>

      {/* Center: Clean P2P Status for regular users */}
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="hidden xs:inline">{t('p2pEncrypted')}</span>
        <span className="xs:hidden">P2P</span>
      </div>

      {/* Right: Language, User identity & Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langDropdownRef}>
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1 px-1.5 py-1 rounded border border-[#334155] bg-[#0f172a] hover:bg-[#27354a] text-slate-300 hover:text-white text-[11px] font-mono transition-colors"
            title="Change language"
          >
            <Globe className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">{currentLangObj.flag} {currentLangObj.code.toUpperCase()}</span>
            <span className="sm:hidden">{currentLangObj.flag}</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-[#1e293b] border border-[#334155] rounded-md shadow-xl py-1 z-50 max-h-60 overflow-y-auto">
              {supportedLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center justify-between hover:bg-[#334155] transition-colors ${
                    language === l.code ? 'text-sky-400 font-bold bg-[#0f172a]' : 'text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </span>
                  {language === l.code && <span className="text-sky-400 text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account / Guest Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1 px-2 py-1 rounded border border-[#334155] bg-[#0f172a] hover:bg-[#27354a] text-slate-200 hover:text-white text-[11px] font-mono transition-colors"
        >
          <User className="w-3 h-3 text-slate-400" />
          <span className="max-w-[65px] sm:max-w-[100px] truncate">
            {user ? user.username : t('account')}
          </span>
          {isGuest && (
            <span className="hidden md:inline text-[9px] text-slate-400">({t('guest')})</span>
          )}
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          title={isSoundMuted ? 'Unmute sounds' : 'Mute sounds'}
          className="p-1.5 rounded hover:bg-[#27354a] text-slate-400 hover:text-white transition-colors"
        >
          {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShare}
          title="Share with friends"
          className="p-1.5 rounded hover:bg-[#27354a] text-sky-400 hover:text-white transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Bookmark Button */}
        <div className="relative">
          <button
            onClick={handleBookmark}
            title="Bookmark this website"
            className="p-1.5 rounded hover:bg-[#27354a] text-amber-400 hover:text-white transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          {/* Floating Bookmark Toast */}
          {bookmarkTip && (
            <div className="absolute right-0 top-9 w-56 p-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 text-[11px] font-mono shadow-xl z-50 text-center animate-fade-in backdrop-blur-md">
              <span className="font-semibold block mb-0.5">🔖 Bookmark Website:</span>
              <span>{bookmarkTip}</span>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts"
          className="hidden sm:flex p-1.5 rounded hover:bg-[#27354a] text-slate-400 hover:text-white transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

    </header>
  );
}
