import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Smile, Lightbulb, Dice5, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

const STARTER_CATEGORIES = {
  icebreakers: {
    label: "Icebreakers",
    icon: "💡",
    items: [
      "Hey! Where in the world are you from?",
      "What music or artist are you listening to lately?",
      "What's the best movie or series you've watched recently?",
      "Tell me a random fun fact about yourself!",
      "If you could travel anywhere right now, where would you go?",
      "What are you doing today or this weekend?",
      "What's your hidden talent or favorite hobby?"
    ]
  },
  wouldYouRather: {
    label: "Would You Rather",
    icon: "⚡",
    items: [
      "Would you rather be able to fly or be invisible?",
      "Would you rather travel 100 years into the past or the future?",
      "Would you rather explore outer space or the deep ocean?",
      "Would you rather never have to sleep or never have to eat?",
      "Would you rather be famous or secretly wealthy?",
      "Would you rather live without music or without movies?"
    ]
  },
  fun: {
    label: "Fun Games",
    icon: "🎯",
    items: [
      "Rate your day from 1 to 10 so far!",
      "Guess where I'm from, and I'll guess where you are from!",
      "Tell me the best joke you know!",
      "Two truths and a lie — you go first!",
      "What superpower would you choose right now?",
      "Cats or dogs? You have to pick one!"
    ]
  },
  chill: {
    label: "Chill / Casual",
    icon: "☕",
    items: [
      "I love your vibe! Having a good day?",
      "What's your go-to comfort food?",
      "Are you a morning person or a night owl?",
      "Coffee, tea, or soda?",
      "What's one thing that made you smile today?"
    ]
  }
};

const ALL_STARTERS = Object.values(STARTER_CATEGORIES).flatMap(c => c.items);

const QUICK_EMOJIS = ['👋', '😂', '🔥', '❤️', '👍', '💀', '😮', '✨'];
// 5 quick reaction emojis directly displayed below stranger's messages
const MESSAGE_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥'];

const EXPANDED_EMOJIS = [
  // Faces & Reactions
  '😀', '😂', '🤣', '😎', '😍', '🥳', '🥺', '💀',
  '🤡', '🤔', '🤫', '🙄', '😭', '🤯', '😴', '👀',
  // Gestures & Badges
  '👋', '👍', '👎', '✌️', '👏', '🙌', '🤝', '🙏',
  '🔥', '💯', '✨', '❤️', '💔', '⚡', '🎉', '🚀',
  // Objects & Vibes
  '🍕', '🍔', '☕', '🍦', '🎮', '🎧', '🐱', '🐶'
];

export default function ChatPane({
  messages,
  onSendMessage,
  onTyping,
  strangerTyping,
  isMatched,
  isDataChannelReady,
  partnerTier,
  partnerGender,
  partnerRegion = 'global',
  onClose
}) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [showStarters, setShowStarters] = useState(false);
  const [activeCategory, setActiveCategory] = useState('icebreakers');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState({}); // msgId -> emoji

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, strangerTyping]);

  useEffect(() => {
    if (isMatched) {
      inputRef.current?.focus();
    } else {
      setShowStarters(false);
      setShowEmojiPicker(false);
      setReactions({});
    }
  }, [isMatched]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (onTyping && isMatched) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || !isMatched) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (onTyping) onTyping(false);

    onSendMessage(clean);
    setInputText('');
    setShowEmojiPicker(false);
    setShowStarters(false);
  };

  // Insert text into input field without losing focus
  const insertText = (textToAppend, sendDirectly = false) => {
    if (!isMatched) return;

    if (sendDirectly) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (onTyping) onTyping(false);
      onSendMessage(textToAppend);
      setShowStarters(false);
      setShowEmojiPicker(false);
      return;
    }

    setInputText((prev) => (prev ? prev + ' ' + textToAppend : textToAppend));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Pick a random starter from all categories
  const handleRandomStarter = () => {
    const randomIndex = Math.floor(Math.random() * ALL_STARTERS.length);
    const chosen = ALL_STARTERS[randomIndex];
    setInputText(chosen);
    setShowStarters(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // DIRECT SEND: When clicking showing emoji, immediately send without waiting for Send button press
  const handleDirectSendEmoji = (emoji) => {
    if (!isMatched) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (onTyping) onTyping(false);

    onSendMessage(emoji);
    setShowEmojiPicker(false);
  };

  // Quick 5-emoji reaction directly below Stranger's message
  const handleMessageReaction = (msgId, emoji) => {
    if (!isMatched) return;

    setReactions((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === emoji ? null : emoji
    }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (onTyping) onTyping(false);

    onSendMessage(emoji);
  };

  // Helper to format partner gender badge
  const renderGenderBadge = (gender) => {
    if (gender === 'male') {
      return <span className="text-[10px] text-blue-400 font-mono flex items-center gap-0.5">♂ Male</span>;
    }
    if (gender === 'female') {
      return <span className="text-[10px] text-pink-400 font-mono flex items-center gap-0.5">♀ Female</span>;
    }
    if (gender === 'other') {
      return <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">🧑 Other</span>;
    }
    return null;
  };

  const renderRegionBadge = (reg) => {
    if (!reg || reg === 'global') {
      return <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">🌍 Global</span>;
    }
    return <span className="text-[10px] text-sky-300 font-mono font-semibold flex items-center gap-0.5">📍 {reg.toUpperCase()}</span>;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0f172a] border-l border-[#334155] min-h-0 relative">
      
      {/* Header */}
      <div className="h-8 sm:h-9 px-3 border-b border-[#334155] bg-[#1e293b] flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{t('chatHeader')}</span>
          {isMatched && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#334155]">
              <span className="text-slate-400">{t('stranger')}</span>
              {renderGenderBadge(partnerGender)}
              {renderRegionBadge(partnerRegion)}
            </div>
          )}
          {partnerTier === 'priority' && (
            <span className="text-[9px] px-1 rounded bg-white text-slate-900 font-bold">
              {t('verified')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">{isDataChannelReady ? 'P2P DIRECT' : 'RELAY'}</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-0.5 rounded bg-[#334155] hover:bg-[#475569] text-white text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Hide Chat to Maximize Video"
            >
              <X className="w-3 h-3" />
              <span>Hide</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs min-h-0 bg-[#0f172a]">
        {/* Welcome Banner */}
        <div className="p-3 my-1 bg-[#1e293b] border border-[#334155] rounded text-center shadow-sm">
          <p className="font-mono text-xs font-semibold text-white">
            You're chatting with a random Stranger.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            End-to-end peer-to-peer encrypted. Left = Stranger, Right = You.
          </p>
        </div>

        {/* Message Stream */}
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-1.5">
                <span className="text-[10px] font-mono text-slate-400 bg-[#1e293b] border border-[#334155] px-2.5 py-1 rounded-full text-center shadow-sm">
                  — {msg.text} —
                </span>
              </div>
            );
          }

          const isYou = msg.sender === 'you';

          return (
            <div
              key={msg.id}
              className={`flex flex-col w-full ${isYou ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-sm ${
                  isYou
                    ? 'bg-[#2563eb] text-white rounded-tr-xs'
                    : 'bg-[#1e293b] border border-[#334155] text-slate-100 rounded-tl-xs'
                }`}
              >
                {/* Header label inside bubble */}
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono">
                  <span className={`font-semibold ${isYou ? 'text-blue-100' : 'text-slate-400'}`}>
                    {isYou ? 'You' : 'Stranger'}
                  </span>
                  {!isYou && renderGenderBadge(partnerGender)}
                </div>

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Attached Reaction Pill */}
                {reactions[msg.id] && (
                  <div className="absolute -bottom-2 -right-1 bg-[#0f172a] border border-[#334155] rounded-full px-1.5 py-0.2 text-[11px] shadow-md flex items-center z-10 animate-in fade-in">
                    <span>{reactions[msg.id]}</span>
                  </div>
                )}
              </div>

              {/* Quick 5 Emoji Reaction Panel directly below Stranger's message */}
              {!isYou && isMatched && (
                <div className="flex items-center gap-1 mt-1 ml-1 select-none">
                  <div className="flex items-center gap-0.5 bg-[#162032]/90 border border-[#334155]/70 rounded-full px-1.5 py-0.5 shadow-xs backdrop-blur-xs">
                    {MESSAGE_REACTION_EMOJIS.map((emoji) => {
                      const isSelected = reactions[msg.id] === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleMessageReaction(msg.id, emoji)}
                          className={`text-xs p-1 rounded-full transition-all active:scale-125 hover:bg-[#334155] ${
                            isSelected ? 'bg-sky-500/30 scale-110' : 'opacity-85 hover:opacity-100'
                          }`}
                          title={`React ${emoji} (sends directly)`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Stranger Typing */}
        {strangerTyping && (
          <div className="flex justify-start">
            <div className="bg-[#1e293b] border border-[#334155] text-slate-300 rounded-2xl rounded-tl-xs px-3.5 py-1.5 text-[11px] font-mono flex items-center gap-2 shadow-sm">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
              </span>
              <span>Stranger is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Panel 1: Starters & Conversation Starters Drawer */}
      {showStarters && (
        <div className="p-3 border-t border-[#334155] bg-[#1e293b] shadow-xl z-20 flex flex-col gap-2 max-h-56 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-1 border-b border-[#334155]/60">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">Conversation Starters</span>
            </div>
            <button
              onClick={() => setShowStarters(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
            {Object.entries(STARTER_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={`px-2 py-0.5 rounded-full border transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === key
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-semibold'
                    : 'bg-[#0f172a] border-[#334155] text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Prompts List */}
          <div className="overflow-y-auto space-y-1.5 max-h-32 pr-1">
            {STARTER_CATEGORIES[activeCategory].items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-1.5 rounded border border-[#334155] bg-[#0f172a] hover:bg-[#27354a] transition-all group"
              >
                <span className="text-[11px] text-slate-200 leading-snug">{item}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => insertText(item, false)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] border border-[#334155] text-slate-300 hover:text-white font-mono"
                    title="Insert into chat to edit"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => insertText(item, true)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-mono font-semibold"
                    title="Send to stranger instantly"
                  >
                    Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Panel 2: Expanded Emoji Picker */}
      {showEmojiPicker && (
        <div className="p-2 border-t border-[#334155] bg-[#1e293b] shadow-xl z-20">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-1.5 mb-1.5 border-b border-[#334155]/60">
            <span className="text-[11px] font-semibold text-slate-200">Tap emoji to send instantly:</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1.5 text-lg p-1 max-h-36 overflow-y-auto">
            {EXPANDED_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleDirectSendEmoji(emoji)}
                className="p-1 rounded hover:bg-[#334155] active:scale-125 transition-all text-center flex items-center justify-center aspect-square"
                title={`Send ${emoji} instantly`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Toolbar (Starters, Random, Emojis) - Hidden on mobile/vertical screens to maximize viewing space */}
      <div className="hidden md:flex px-2 py-1 bg-[#1e293b]/90 border-t border-[#334155]/70 items-center justify-between gap-1 text-[11px] font-mono shrink-0">
        
        {/* Left helper tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setShowStarters((prev) => !prev);
              setShowEmojiPicker(false);
            }}
            disabled={!isMatched}
            className={`px-2 py-1 rounded border flex items-center gap-1 transition-all ${
              showStarters
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                : 'border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40'
            }`}
            title="Conversation topics and icebreakers"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span className="hidden xs:inline">Topics</span>
          </button>

          <button
            type="button"
            onClick={handleRandomStarter}
            disabled={!isMatched}
            className="px-2 py-1 rounded border border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 flex items-center gap-1 transition-all"
            title="Insert a random fun question"
          >
            <Dice5 className="w-3 h-3 text-emerald-400" />
            <span className="hidden xs:inline">Random</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker((prev) => !prev);
              setShowStarters(false);
            }}
            disabled={!isMatched}
            className={`px-2 py-1 rounded border flex items-center gap-1 transition-all ${
              showEmojiPicker
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-semibold'
                : 'border-[#334155] bg-[#0f172a] text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40'
            }`}
            title="Open emoji keyboard"
          >
            <Smile className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Emoji</span>
          </button>
        </div>

        {/* Right Quick 1-Tap Reaction Emojis */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {QUICK_EMOJIS.slice(0, 6).map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              disabled={!isMatched}
              onClick={() => handleDirectSendEmoji(emoji)}
              className="text-sm px-1.5 py-0.5 rounded hover:bg-[#334155] disabled:opacity-30 active:scale-125 transition-transform cursor-pointer"
              title={`Send ${emoji} instantly`}
            >
              {emoji}
            </button>
          ))}
        </div>

      </div>

      {/* Input Form */}
      <form
        onSubmit={handleFormSubmit}
        className="p-1.5 sm:p-2 border-t border-[#334155] bg-[#1e293b] flex items-center gap-1 sm:gap-1.5 shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker((prev) => !prev);
            setShowStarters(false);
          }}
          disabled={!isMatched}
          className="p-1 sm:p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#334155] disabled:opacity-30 transition-colors cursor-pointer"
          title="Open emoji keyboard"
        >
          <Smile className="w-4 h-4 text-sky-400" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          disabled={!isMatched}
          placeholder={isMatched ? 'Type message & press Enter...' : 'Connecting with stranger...'}
          className="flex-1 bg-[#0f172a] border border-[#334155] focus:border-sky-400 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none font-sans disabled:opacity-40 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !isMatched}
          className="p-1.5 sm:p-2 rounded bg-white hover:bg-slate-100 disabled:opacity-20 text-slate-900 transition-colors shrink-0 font-mono text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
          title="Send"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

    </div>
  );
}
