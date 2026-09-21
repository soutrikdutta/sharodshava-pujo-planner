import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Send, 
  Flame, 
  RotateCcw,
  MapPin,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Compass,
  Calendar,
  Navigation,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { useLocation, KOLKATA_LANDMARK_PRESETS } from '../context/LocationContext';
import { askGeminiPujoAi, type ChatTurn } from '../services/geminiAi';

interface BotMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  chips?: string[];
}

const DEFAULT_SUGGESTION_CHIPS = [
  '📍 Nearest pandals from my exact location?',
  '🚇 Closest Metro & midnight timings?',
  '🍲 Famous food & Biryani nearby?',
  '🔥 Ashtami Sandhi Puja exact timings?',
  '🌙 Plan midnight pandal hopping route',
  '🗺️ Open Interactive 3D Map'
];

export const PujoAiChatbot: React.FC = () => {
  const { 
    coordinates, 
    locality, 
    permissionState, 
    isManualLocation, 
    requestLocation, 
    refreshLocation, 
    setManualLocation 
  } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `নমস্কার! I am **SHARODSHAV AI**, your live interactive Kolkata Durga Puja 2026 guide powered by Google Gemini.\n\n📍 **Live Grounding Status:** ${
        coordinates 
          ? `Connected to **${locality || 'Kolkata'}** (${coordinates.latitude.toFixed(4)}°N, ${coordinates.longitude.toFixed(4)}°E) with active GPS!`
          : 'Browser GPS not shared yet — tap "Share GPS" in the top bar for exact doorstep walking routes.'
      }\n\nAsk me for the closest pandals, direct Google Maps routes, midnight metro schedules, or iconic food joints!`,
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
      const reply = await askGeminiPujoAi(
        text,
        {
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
          accuracy: coordinates?.accuracy,
          locality: locality || (coordinates ? `${coordinates.latitude.toFixed(4)}°N, ${coordinates.longitude.toFixed(4)}°E` : 'Kolkata'),
          hasRealGps: !!coordinates && !isManualLocation,
          isManualSelection: isManualLocation
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
      if (lowerReply.includes('ashtami') || lowerReply.includes('sandhi')) {
        followUpChips.push('🌸 Kumari Puja timings & venue?', '🔥 Dhunuchi Naach timings?');
      }
      followUpChips.push('🗺️ Open Interactive Map', '📋 Plan Trip Route');

      const botMsg: BotMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: followUpChips.slice(0, 4)
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.warn('[PujoAiChatbot] Response error:', err);
      const errorMsg: BotMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'নমস্কার! A momentary network surge occurred. Please tap below to find pandals near you or ask again!',
        timestamp: 'Just now',
        chips: ['📍 Nearest pandals from my exact location?', '🚇 Closest Metro Station?']
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[*#_~]/g, '')
      .replace(/https?:\/\/\S+/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.name.includes('India'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (msgId: string, text: string) => {
    const cleanText = text
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '$1: $2')
      .replace(/[*_~]/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-1.5 leading-relaxed text-xs sm:text-[13px]">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} className="h-1" />;

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={lIdx} className="text-sm font-bold text-[#fcedb3] mt-2 mb-0.5 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#d4af37] shrink-0" />
                <span>{trimmed.replace(/^###\s+/, '')}</span>
              </h4>
            );
          }

          const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
          const lineText = isBullet ? trimmed.replace(/^[*\-•]\s+/, '') : trimmed;
          const parts = parseMarkdownTokens(lineText);

          return (
            <div key={lIdx} className={`${isBullet ? 'flex items-start gap-2 pl-1' : ''}`}>
              {isBullet && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 shrink-0" />
              )}
              <div className="flex-1">{parts}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const parseMarkdownTokens = (text: string) => {
    const regex = /(\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*)/g;
    const segments = text.split(regex);

    return segments.map((seg, idx) => {
      const linkMatch = seg.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const url = linkMatch[2];

        if (url.includes('google.com/maps') || url.includes('maps/dir')) {
          return (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 rounded-xl bg-gradient-to-r from-[#d4af37]/30 via-amber-500/20 to-[#d4af37]/30 border border-[#d4af37]/60 text-[#fcedb3] hover:text-black hover:bg-[#d4af37] text-xs font-bold shadow-md transition-all cursor-pointer group select-none mr-1.5"
              title="Open turn-by-turn directions in Google Maps"
            >
              <MapPin size={13} className="text-[#d4af37] group-hover:text-black shrink-0 animate-bounce" />
              <span>{label}</span>
              <ExternalLink size={11} className="opacity-80 group-hover:text-black shrink-0" />
            </a>
          );
        }

        if (url === '#open-map') {
          return (
            <button
              key={idx}
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new Event('pujo_open_map'));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 rounded-xl bg-[#d4af37] hover:bg-[#e6ca65] text-black text-xs font-bold shadow-md cursor-pointer mr-1.5 transition-transform hover:scale-105 active:scale-95"
            >
              <Compass size={13} />
              <span>{label}</span>
            </button>
          );
        }

        if (url === '#open-plan-trip') {
          return (
            <button
              key={idx}
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new Event('pujo_open_plan_trip'));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold shadow-md cursor-pointer mr-1.5 transition-transform hover:scale-105 active:scale-95"
            >
              <Calendar size={13} className="text-[#d4af37]" />
              <span>{label}</span>
            </button>
          );
        }

        if (url === '#open-friends') {
          return (
            <button
              key={idx}
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new Event('pujo_open_friends'));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-md cursor-pointer mr-1.5 transition-transform hover:scale-105 active:scale-95"
            >
              <span>{label}</span>
            </button>
          );
        }

        return (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4af37] hover:underline inline-flex items-center gap-1 font-semibold mx-1"
          >
            <span>{label}</span>
            <ExternalLink size={10} />
          </a>
        );
      }

      const boldMatch = seg.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        return <strong key={idx} className="font-bold text-white">{boldMatch[1]}</strong>;
      }

      return <span key={idx}>{seg}</span>;
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(prev => !prev)}
          className="relative group p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#e6ca65] to-[#d4af37] text-black shadow-[0_4px_28px_rgba(212,175,55,0.45)] hover:shadow-[0_6px_36px_rgba(212,175,55,0.7)] flex items-center justify-center cursor-pointer transition-all border border-amber-200/60"
          title="Open Sharodshav Live Gemini Pujo AI"
        >
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0b0d13]" />
          </span>

          <div className="flex items-center gap-2">
            <Bot size={22} className="text-black" />
            <span className="text-xs font-bold font-sans hidden sm:inline tracking-tight">
              Pujo AI
            </span>
          </div>
        </motion.button>
      </div>

      {/* Main Interactive Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 35 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 35 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed bottom-20 right-3 sm:right-6 w-[94vw] sm:w-[430px] h-[580px] sm:h-[640px] max-h-[85vh] rounded-3xl border border-[#d4af37]/45 shadow-[0_0_50px_rgba(0,0,0,0.85)] z-50 overflow-hidden flex flex-col bg-[#0b0d13]/98 backdrop-blur-2xl text-left"
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03] shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#d4af37]/30 to-[#d4af37]/10 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow-sm shrink-0">
                  <Flame size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Sharodshav AI</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono flex items-center gap-1 border border-amber-500/30">
                      <Sparkles size={9} />
                      GEMINI LIVE
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/70">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${coordinates ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <MapPin size={9} className="text-[#d4af37] shrink-0" />
                    <span className="truncate font-medium text-white/90">
                      {locality || (coordinates ? `${coordinates.latitude.toFixed(3)}°N, ${coordinates.longitude.toFixed(3)}°E` : 'Detecting GPS...')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowLocationPicker(prev => !prev)}
                  className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[#fcedb3] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Change or select location"
                >
                  <Navigation size={11} className="text-[#d4af37]" />
                  <span>Area</span>
                  <ChevronDown size={10} />
                </button>

                <button
                  onClick={() => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    setSpeakingId(null);
                    setMessages([
                      {
                        id: `reset-${Date.now()}`,
                        sender: 'bot',
                        text: `নমস্কার! Conversation refreshed. Grounded near **${locality || 'Kolkata'}** (${coordinates ? `${coordinates.latitude.toFixed(4)}°N, ${coordinates.longitude.toFixed(4)}°E` : 'Central Kolkata'}). Where would you like to hop next?`,
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

            {/* Live Location Grounding & Neighborhood Picker Bar */}
            <div className="bg-[#12141e] border-b border-white/10 px-3.5 py-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] min-w-0">
                  <span className="text-white/50">Grounding:</span>
                  <span className="text-emerald-300 font-bold truncate">
                    {locality || 'Kolkata'}
                  </span>
                  {coordinates && (
                    <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
                      ({coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={refreshLocation}
                    className="px-2 py-0.8 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#fcedb3] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-[#d4af37]/40"
                    title="Get fresh live GPS reading from browser"
                  >
                    <RefreshCw size={10} className={permissionState === 'requesting' ? 'animate-spin' : ''} />
                    <span>GPS</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Area Selector */}
              {showLocationPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 pt-2 border-t border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-white/60">
                    <span>Select your active Kolkata neighborhood for exact distance:</span>
                    <button
                      onClick={requestLocation}
                      className="text-[#d4af37] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation size={9} />
                      <span>Use Device GPS</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-[110px] overflow-y-auto pr-1">
                    {KOLKATA_LANDMARK_PRESETS.map((preset) => {
                      const isSelected = locality?.includes(preset.name.split(' ')[0]);
                      return (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setManualLocation(preset.name, preset.lat, preset.lng);
                            setShowLocationPicker(false);
                            const notificationMsg: BotMessage = {
                              id: `loc-update-${Date.now()}`,
                              sender: 'bot',
                              text: `📍 Grounding updated to **${preset.name}** (${preset.lat}°N, ${preset.lng}°E). All distances and Google Maps routes are now computed from here!\n\nWhat pandals would you like to explore near ${preset.name.split('/')[0]}?`,
                              timestamp: 'Just now',
                              chips: [`📍 Pandals closest to ${preset.name.split('/')[0]}?`, '🚇 Nearest Metro station?', '🍲 Food hotspots nearby?']
                            };
                            setMessages(prev => [...prev, notificationMsg]);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                              : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                          }`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Scrollable Messages Container */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                const isSpeaking = speakingId === msg.id;

                return (
                  <div key={msg.id} className="space-y-2">
                    <div className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
                      {isBot && (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#d4af37]/25 to-amber-500/15 text-[#d4af37] flex items-center justify-center shrink-0 mt-0.5 border border-[#d4af37]/40 shadow-sm">
                          <Bot size={15} />
                        </div>
                      )}
                      
                      <div className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed shadow-lg ${
                        isBot
                          ? 'bg-[#181a24] border border-white/15 text-white/95 rounded-tl-xs shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                          : 'bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black font-medium rounded-tr-xs shadow-[0_4px_14px_rgba(212,175,55,0.25)] text-xs sm:text-sm'
                      }`}>
                        {isBot ? renderFormattedContent(msg.text) : <p className="whitespace-pre-line">{msg.text}</p>}

                        <div className={`flex items-center justify-between gap-2 pt-2 mt-1 border-t ${
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
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2.5 pl-1 text-xs text-white/50">
                  <div className="w-7 h-7 rounded-xl bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center shrink-0 border border-[#d4af37]/40 animate-pulse">
                    <Sparkles size={14} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#181a24] border border-white/10 px-3.5 py-2 rounded-2xl shadow-md">
                    <span className="text-[11px] font-medium text-amber-200">Consulting Gemini & live GPS for {locality || 'Kolkata'}...</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-white/10 bg-[#08090d] flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about pandals near ${locality ? locality.split('/')[0].trim() : 'you'}, routes...`}
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
