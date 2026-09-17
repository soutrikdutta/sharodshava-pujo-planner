import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, LogOut, SlidersHorizontal, MapPin, Home, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

interface NavbarProps {
  onGoHome: () => void;
  onOpenInfo: () => void;
  onOpenNearby: () => void;
  onOpenSocialHub?: () => void;
  simulatedDate: string | null;
  onSelectSimulatedDate: (dateStr: string | null) => void;
}

const LiveClock: React.FC = React.memo(() => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return (
    <span className="text-[10px] sm:text-xs font-mono text-white/90 tracking-wide">
      {dateStr} • {timeStr}
    </span>
  );
});

export const Navbar: React.FC<NavbarProps> = ({ 
  onGoHome,
  onOpenInfo, 
  onOpenNearby,
  onOpenSocialHub,
  simulatedDate, 
  onSelectSimulatedDate 
}) => {
  const { user, logout } = useAuth();
  const { permissionState, locality, closestPandal, requestLocation } = useLocation();
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-2.5 sm:px-6 py-2 sm:py-3 bg-[#080a10]/95 sm:bg-black/60 backdrop-blur-xl border-b border-white/15 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        
        {/* Left: Brand Logo & Title */}
        <div 
          onClick={onGoHome}
          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group shrink-0"
          title="Sharodshav — Return to Home"
        >
          <motion.div 
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-[#d4af37]/50 bg-black/80 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:border-[#d4af37] transition-all p-0.5 shrink-0"
          >
            <img 
              src="/sharodshav_logo.png" 
              alt="Sharodshav Logo" 
              className="w-full h-full object-contain object-center"
            />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#f4e5a9] via-[#d4af37] to-[#e6ca65] flex items-center gap-1 font-sans">
              SHARODSHAV
            </span>
            <span className="text-[8px] sm:text-[9px] tracking-wider text-white/50 uppercase font-medium hidden sm:inline-block">
              Optimal Pandal Navigation
            </span>
          </div>
        </div>

        {/* Center: Live Time (Desktop only) */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 flex-col items-center pointer-events-none">
          <LiveClock />
          {simulatedDate && (
            <span className="text-[9px] text-[#d4af37]/90 font-mono mt-0.5 tracking-wider uppercase">
              Preview Mode Active
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          
          {/* Home Button (Icon on mobile, labeled on desktop) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGoHome}
            title="Go to Home Dashboard"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-[#d4af37]/50 text-white transition-all flex items-center gap-1 text-xs cursor-pointer"
          >
            <Home size={14} className="text-[#d4af37]" />
            <span className="hidden sm:inline text-[11px] font-medium">Home</span>
          </motion.button>

          {/* Location status pill */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (permissionState === 'granted') {
                onOpenNearby();
              } else {
                requestLocation();
              }
            }}
            title={permissionState === 'granted' ? `Location: ${locality || 'Detected'} (Click to view nearby pandals)` : 'Click to allow location'}
            className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border transition-all flex items-center gap-1 text-xs cursor-pointer ${
              permissionState === 'granted'
                ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 hover:border-[#d4af37]/40 text-white'
                : permissionState === 'denied'
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300'
                  : 'bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border-[#d4af37]/40 text-[#f4e5a9] animate-pulse'
            }`}
          >
            <MapPin size={13} className={permissionState === 'granted' ? 'text-emerald-400 shrink-0' : 'text-[#d4af37] shrink-0'} />
            <span className="text-[10px] sm:text-[11px] font-medium max-w-[70px] sm:max-w-[120px] truncate">
              {permissionState === 'granted' 
                ? (locality ? locality.split(',')[0] : 'Kolkata')
                : permissionState === 'denied' 
                  ? 'Blocked' 
                  : 'Location'}
            </span>
            {permissionState === 'granted' && closestPandal && closestPandal.distanceKm !== null && (
              <span className="hidden xl:inline text-[10px] text-[#f4e5a9] font-mono pl-1 border-l border-white/10">
                {closestPandal.formattedDistance}
              </span>
            )}
          </motion.button>

          {/* Simulator pill */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSimMenu(!showSimMenu)}
              title="Test Festival Dates"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-white/30 transition-all flex items-center gap-1 text-xs text-white/80 hover:text-white cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-[#d4af37]" />
              <span className="hidden md:inline text-[11px] font-medium">Dates</span>
            </motion.button>

            {showSimMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 p-2 rounded-2xl glass-panel border border-white/20 shadow-2xl z-50 text-xs bg-[#0b0d13]/95"
                onClick={() => setShowSimMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-white/40 border-b border-white/10 mb-1">
                  Timeline Simulator
                </div>
                <button
                  onClick={() => onSelectSimulatedDate(null)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${!simulatedDate ? 'bg-[#d4af37]/20 text-[#f4e5a9] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>Live Today</span>
                  {!simulatedDate && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => onSelectSimulatedDate('2026-10-18')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${simulatedDate === '2026-10-18' ? 'bg-[#d4af37]/20 text-[#f4e5a9] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>Maha Shashti</span>
                  {simulatedDate === '2026-10-18' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => onSelectSimulatedDate('2026-10-19')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${simulatedDate === '2026-10-19' ? 'bg-[#d4af37]/20 text-[#f4e5a9] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>Maha Saptami</span>
                  {simulatedDate === '2026-10-19' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => onSelectSimulatedDate('2026-10-20')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${simulatedDate === '2026-10-20' ? 'bg-[#d4af37]/20 text-[#f4e5a9] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>Maha Ashtami</span>
                  {simulatedDate === '2026-10-20' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => onSelectSimulatedDate('2026-10-21')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${simulatedDate === '2026-10-21' ? 'bg-[#d4af37]/20 text-[#f4e5a9] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>Maha Nabami</span>
                  {simulatedDate === '2026-10-21' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => onSelectSimulatedDate('2026-10-22')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${simulatedDate === '2026-10-22' ? 'bg-[#d4af37]/20 text-[#f4e5a9] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>Vijaya Dashami</span>
                  {simulatedDate === '2026-10-22' && <span className="text-[10px]">●</span>}
                </button>
                <button
                  onClick={() => onSelectSimulatedDate('2026-10-25')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${simulatedDate === '2026-10-25' ? 'bg-[#d4af37]/20 text-[#f4e5a9] font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>Post-Pujo</span>
                  {simulatedDate === '2026-10-25' && <span className="text-[10px]">●</span>}
                </button>
              </div>
            )}
          </div>

          {/* Social Hub Button */}
          {onOpenSocialHub && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={onOpenSocialHub}
              aria-label="Friends & Live Pujo Chats"
              title="Friend Requests & Live Pujo Chats"
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-sky-400/50 flex items-center justify-center text-white/80 hover:text-sky-300 transition-all cursor-pointer shrink-0"
            >
              <Users size={15} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            </motion.button>
          )}

          {/* Info Icon */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenInfo}
            aria-label="Application Information"
            title="About Sharodshav"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-[#d4af37]/50 flex items-center justify-center text-white/80 hover:text-[#f4e5a9] transition-all cursor-pointer shrink-0"
          >
            <Info size={15} />
          </motion.button>

          {/* User profile with dropdown */}
          {user && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/20 hover:border-[#d4af37]/60 transition-all p-0.5 cursor-pointer"
                title={user.displayName || 'User Profile'}
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-[#d4af37]/30 flex items-center justify-center text-xs font-semibold text-[#f4e5a9]">
                    {user.displayName ? user.displayName.charAt(0) : 'U'}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-52 p-3 rounded-2xl glass-panel border border-white/20 shadow-2xl z-50 bg-[#0b0d13]/95"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="mb-2.5 pb-2 border-b border-white/10">
                    <p className="text-xs font-semibold text-white truncate">{user.displayName}</p>
                    <p className="text-[11px] text-white/40 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-2 text-xs text-red-400 hover:text-red-300 py-1.5 px-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
