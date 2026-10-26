import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import SponsorCard from './SponsorCard';

const ICEBREAKERS = [
  "Hey! Where are you from?",
  "What music are you listening to lately?",
  "What's the best movie you've watched recently?",
  "Tell me a random fun fact!"
];

export default function ChatPane({
  messages,
  onSendMessage,
  onTyping,
  strangerTyping,
  isMatched,
  isDataChannelReady,
  partnerTier,
  partnerGender
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, strangerTyping]);

  useEffect(() => {
    if (isMatched) {
      inputRef.current?.focus();
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
  };

  const handleIcebreakerClick = (text) => {
    setInputText(text);
    inputRef.current?.focus();
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

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0d0d] border-l border-[#1f1f1f] min-h-0">
      
      {/* Header */}
      <div className="h-8 sm:h-9 px-3 border-b border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-between text-[11px] font-mono text-[#888888] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#cccccc]">CHAT</span>
          {isMatched && (
            <div className="flex items-center gap-1 pl-2 border-l border-[#262626]">
              <span className="text-[#888888]">STRANGER</span>
              {renderGenderBadge(partnerGender)}
            </div>
          )}
          {partnerTier === 'priority' && (
            <span className="text-[9px] px-1 rounded bg-white text-black font-bold">
              VERIFIED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#777777]">{isDataChannelReady ? 'P2P DIRECT' : 'RELAY'}</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs min-h-0">
        {/* Native Sponsor Notice (Auto-removed for Priority users) */}
        <SponsorCard variant="inline" />

        {/* Welcome Banner */}
        <div className="p-3 my-1 bg-[#121212] border border-[#202020] rounded text-center">
          <p className="font-mono text-xs font-semibold text-white">
            You're chatting with a random Stranger.
          </p>
          <p className="text-[11px] text-[#777777] mt-0.5">
            End-to-end peer-to-peer encrypted. Left = Stranger, Right = You.
          </p>
        </div>

        {/* Icebreaker Prompts */}
        {messages.filter(m => m.sender !== 'system').length < 2 && isMatched && (
          <div className="p-2.5 my-2 bg-[#141414] border border-[#242424] rounded">
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#888888] mb-1.5">
              <Sparkles className="w-3 h-3 text-[#cccccc]" />
              <span>Break the ice:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ICEBREAKERS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleIcebreakerClick(prompt)}
                  className="text-[11px] px-2 py-1 rounded border border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222222] text-[#cccccc] hover:text-white transition-colors text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-1.5">
                <span className="text-[10px] font-mono text-[#888888] bg-[#141414] border border-[#222222] px-2.5 py-1 rounded-full text-center">
                  — {msg.text} —
                </span>
              </div>
            );
          }

          const isYou = msg.sender === 'you';

          return (
            <div
              key={msg.id}
              className={`flex w-full ${isYou ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-sm ${
                  isYou
                    ? 'bg-[#2563eb] text-white rounded-tr-xs'
                    : 'bg-[#1e2433] border border-[#2e394e] text-[#e2e8f0] rounded-tl-xs'
                }`}
              >
                {/* Header label inside bubble */}
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono">
                  <span className={`font-semibold ${isYou ? 'text-blue-200' : 'text-[#94a3b8]'}`}>
                    {isYou ? 'You' : 'Stranger'}
                  </span>
                  {!isYou && renderGenderBadge(partnerGender)}
                </div>

                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          );
        })}

        {/* Stranger Typing */}
        {strangerTyping && (
          <div className="flex justify-start">
            <div className="bg-[#1e2433] border border-[#2e394e] text-[#94a3b8] rounded-2xl rounded-tl-xs px-3.5 py-1.5 text-[11px] font-mono flex items-center gap-2">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce"></span>
              </span>
              <span>Stranger is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleFormSubmit}
        className="p-2 border-t border-[#1f1f1f] bg-[#0a0a0a] flex items-center gap-1.5 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          disabled={!isMatched}
          placeholder={isMatched ? 'Type message & press Enter...' : 'Connecting...'}
          className="flex-1 bg-[#141414] border border-[#262626] focus:border-[#444444] rounded px-2.5 py-1.5 sm:py-2 text-xs text-white placeholder-[#555555] outline-none font-sans disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || !isMatched}
          className="p-1.5 sm:p-2 rounded bg-white hover:bg-[#e0e0e0] disabled:opacity-20 text-black transition-colors shrink-0 font-mono text-xs font-semibold flex items-center gap-1"
          title="Send"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

    </div>
  );
}
