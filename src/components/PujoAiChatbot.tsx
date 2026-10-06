import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Send, 
  Flame, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  Copy,
  Check
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { askGeminiPujoAi, type ChatTurn } from '../services/geminiAi';

interface BotMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  chips?: string[];
}

const DEFAULT_SUGGESTION_CHIPS = [
  '🚇 What is my closest Metro station?',
  '📍 Nearest pandals from my exact location?',
  '🍲 Famous food & Biryani nearby?',
  '🔥 Ashtami Sandhi Puja exact timings?',
  '🌙 Midnight metro train schedules?',
  '🗺️ Open Interactive 3D Map'
];

const STORAGE_KEY_AI_DISMISSED = 'pujo_ai_bubble_dismissed';

export const PujoAiChatbot: React.FC = () => {
  const { coordinates, locality } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_AI_DISMISSED) === 'true';
    } catch {
      return false;
    }
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleOpenAi = () => {
      setIsDismissed(false);
      try {
        localStorage.removeItem(STORAGE_KEY_AI_DISMISSED);
      } catch { /* ignore */ }
      setIsOpen(true);
    };
    window.addEventListener('pujo_open_ai', handleOpenAi);
    return () => window.removeEventListener('pujo_open_ai', handleOpenAi);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY_AI_DISMISSED, 'true');
    } catch { /* ignore */ }
  };
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `নমস্কার! I am **SHARODSHAV AI**, your live Kolkata Durga Puja 2026 companion powered by Google Gemini.\n\nAsk me about the closest pandals, nearest Metro stations (Line 1, Line 2, Line 4, Line 6), walking routes, midnight transit schedules, or iconic food spots!\n\nHow can I help you today?`,
      timestamp: 'Just now',
      chips: DEFAULT_SUGGESTION_CHIPS
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  const conversationHistory = useMemo<ChatTurn[]>(() => {
    return messages.map(m => ({
      sender: m.sender,
      text: m.text
    }));
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    const userMsg: BotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      // Use live coordinates if present, or verified default
      const activeLat = coordinates?.latitude ?? 22.6390;
      const activeLng = coordinates?.longitude ?? 88.4280;
      const activeLocality = locality || 'Jessore Road, Kolkata';
      const activeAccuracy = coordinates?.accuracy ?? 15;

      const reply = await askGeminiPujoAi(
        text,
        {
          latitude: activeLat,
          longitude: activeLng,
          accuracy: activeAccuracy,
          locality: activeLocality,
          hasRealGps: true
        },
        conversationHistory
      );

      const followUpChips: string[] = [];
      const lowerReply = reply.toLowerCase();
      if (lowerReply.includes('pandal') || lowerReply.includes('route')) {
        followUpChips.push('🍲 Where can I eat near here?', '🚇 What is the nearest Metro station?');
      }
      if (lowerReply.includes('metro') || lowerReply.includes('transit')) {
        followUpChips.push('🌙 Midnight metro train schedules?', '🚶 Walking distance to closest pandal?');
      }
      if (lowerReply.includes('food') || lowerReply.includes('biryani')) {
        followUpChips.push('📍 Pandals closest to this food joint?', '🚇 How to get there by Metro?');
      }
      if (followUpChips.length === 0) {
        followUpChips.push('📍 Nearest pandals?', '🚇 Closest Metro station?', '🔥 Sandhi Puja timings?');
      }

      const botMsg: BotMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: followUpChips
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('[PujoAi] Chat error:', err);
      const errorMsg: BotMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: 'নমস্কার! I encountered a momentary connection dip with the server. Please try asking again in a moment!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: ['🚇 Closest Metro station?', '📍 Closest pandals?']
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    const cleanText = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingId(id);

    const cleanText = text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\*\*/g, '')
      .replace(/[#\[\]()]/g, '')
      .replace(/📍|🏛️|🍲|🚇|🔥|🌙|💡|🎉|✨/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India')) || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const renderFormattedMessage = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} className="h-2" />;
      }

      if (line.startsWith('### ')) {
        return (
          <h4 key={lineIdx} className="text-xs sm:text-sm font-bold text-[#fcedb3] mt-2 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
            {line.replace('### ', '')}
          </h4>
        );
      }

      const parts = line.split(/(\[.*?\]\(.*?\))/g);

      return (
        <p key={lineIdx} className="text-xs sm:text-[13px] leading-relaxed mb-1">
          {parts.map((part, pIdx) => {
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
              const label = linkMatch[1];
              const href = linkMatch[2];

              if (href.startsWith('#')) {
                return (
                  <button
                    key={pIdx}
                    onClick={() => {
                      setIsOpen(false);
                      const action = href.replace('#', '');
                      if (action === 'open-map') {
                        window.dispatchEvent(new CustomEvent('pujo:open-map'));
                      } else if (action === 'open-plan-trip') {
                        window.dispatchEvent(new CustomEvent('pujo:open-plan-trip'));
                      } else if (action === 'open-friends') {
                        window.dispatchEvent(new CustomEvent('pujo:open-friends'));
                      }
                    }}
                    className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.8 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/35 text-[#fcedb3] border border-[#d4af37]/40 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <span>{label}</span>
                    <ExternalLink size={11} className="opacity-70" />
                  </button>
                );
              }

              return (
                <a
                  key={pIdx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all shadow-xs"
                >
                  <span>{label}</span>
                  <ExternalLink size={11} className="opacity-70" />
                </a>
              );
            }

            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return (
              <React.Fragment key={pIdx}>
                {boldParts.map((bp, bIdx) => {
                  if (bp.startsWith('**') && bp.endsWith('**')) {
                    return (
                      <strong key={bIdx} className="text-[#fcedb3] font-bold">
                        {bp.slice(2, -2)}
                      </strong>
                    );
                  }
                  return bp;
                })}
              </React.Fragment>
            );
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* Movable Small Floating Trigger Button */}
      <AnimatePresence>
        {!isDismissed && !isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => {
              setTimeout(() => setIsDragging(false), 150);
            }}
            initial={{ opacity: 0, scale: 0.7, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-24 right-4 sm:bottom-7 sm:right-7 z-40 touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            <div className="relative group">
              {/* Dismiss / Remove Cross Sign Button */}
              <button
                type="button"
                onClick={handleDismiss}
                title="Remove AI button (You can open from Navbar anytime)"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#12141d] border border-white/30 hover:border-rose-400 hover:bg-rose-500 text-white/70 hover:text-white flex items-center justify-center transition-all shadow-md cursor-pointer z-50 group-hover:opacity-100 opacity-80"
              >
                <X size={10} strokeWidth={2.8} />
              </button>

              {/* Compact Floating Orb Button */}
              <motion.button
                type="button"
                onClick={() => {
                  if (!isDragging) setIsOpen(true);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#d4af37] via-[#f39c12] to-[#c0392b] shadow-2xl flex items-center justify-center cursor-pointer border border-amber-200/50 animate-glow-ring shimmer-badge"
                title="Sharodshav AI Guide (Drag to move anywhere)"
              >
                <div className="w-full h-full rounded-full bg-black/85 backdrop-blur-md flex items-center justify-center text-[#fcedb3]">
                  <Bot size={20} className="text-[#fcedb3] drop-shadow-sm group-hover:rotate-12 transition-transform duration-300" />
                </div>

                {/* Active Live Beacon Dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#08090d] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[420px] max-w-[440px] h-[580px] max-h-[82vh] rounded-3xl bg-[#0d0e15] border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl text-white font-sans"
          >
            {/* Clean, Elegant Header (No location strip) */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#1c1208] via-[#16101c] to-[#0c0e17] border-b border-amber-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#e67e22] p-0.5 flex items-center justify-center shadow-lg">
                  <div className="w-full h-full bg-black/40 rounded-[14px] flex items-center justify-center text-amber-200">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <Flame size={12} className="absolute -top-1 -right-1 text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-[#fcedb3] tracking-wide">
                      Sharodshav AI
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50">
                    Durga Puja 2026 Guide • Powered by Gemini
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setMessages([
                      {
                        id: `reset-${Date.now()}`,
                        sender: 'bot',
                        text: 'নমস্কার! Conversation reset. What would you like to explore regarding Kolkata Durga Puja 2026, nearest Metro stations, or pandal routes?',
                        timestamp: 'Just now',
                        chips: DEFAULT_SUGGESTION_CHIPS
                      }
                    ]);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Reset Conversation"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Close Assistant"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Messages Container */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                const isSpeaking = speakingId === msg.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 350 }}
                    className="space-y-2"
                  >
                    <div className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
                      {isBot && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#d4af37]/30 to-[#f39c12]/30 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0 mt-1">
                          <Bot size={14} />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 shadow-md ${
                          isBot
                            ? 'bg-[#181a24] border border-white/10 text-white/90 rounded-tl-sm'
                            : 'bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black font-medium rounded-tr-sm'
                        }`}
                      >
                        {renderFormattedMessage(msg.text)}

                        <div className={`flex items-center justify-between mt-2 pt-1 border-t ${
                          isBot ? 'border-white/10 text-white/45' : 'border-black/10 text-black/60'
                        } text-[10px]`}>
                          <span className="font-mono">{msg.timestamp}</span>

                          {isBot && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleSpeak(msg.id, msg.text)}
                                className={`p-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                                  isSpeaking ? 'bg-[#d4af37] text-black font-bold' : 'hover:bg-white/10 hover:text-white'
                                }`}
                                title={isSpeaking ? 'Stop voice readout' : 'Listen to answer'}
                              >
                                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                                <span className="text-[9px]">{isSpeaking ? 'Speaking...' : 'Listen'}</span>
                              </button>

                              <button
                                onClick={() => handleCopyText(msg.id, msg.text)}
                                className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                                title="Copy answer"
                              >
                                {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isBot && msg.chips && msg.chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-9">
                        {msg.chips.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => handleSend(chip)}
                            className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-[#d4af37]/20 border border-white/10 hover:border-[#d4af37]/50 text-[11px] text-[#fcedb3] transition-all text-left cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2.5 pl-1 text-xs text-white/50">
                  <div className="w-7 h-7 rounded-xl bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center shrink-0 border border-[#d4af37]/40 animate-pulse">
                    <Sparkles size={14} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#181a24] border border-white/10 px-3.5 py-2 rounded-2xl shadow-md">
                    <span className="text-[11px] font-medium text-amber-200">Consulting Gemini for {locality || 'Kolkata'}...</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Clean Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-white/10 bg-[#08090d] flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about closest metro, pandals near you, routes..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
                title="Send query"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
