import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, MapPin, Compass } from 'lucide-react';
import type { FestivalConfig, FestivalDay, FestivalStatus } from '../config/festivalConfig';
import { DayThemeDoodle } from './DurgaPujaDoodles';

interface FestivalHeroProps {
  festival: FestivalConfig;
  status: FestivalStatus;
  selectedDay: FestivalDay | null;
  onClearSelectedDay: () => void;
  onOpenSitePicker?: () => void;
}

// Animated counter hook for smooth number increment
function useAnimatedCounter(target: number, duration: number = 1.2) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalSteps = 45;
    const stepTime = (duration * 1000) / totalSteps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      // easeOutExpo progression
      const ease = 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * ease);
      setCount(current);

      if (currentStep >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

// Illustrated Durga Puja Typography Title Banners for each day
const DAY_DOODLE_TITLES: Record<string, string> = {
  shashti: '/images/doodles/shashti_title.png',
  saptami: '/images/doodles/saptami_title.png',
  ashtami: '/images/doodles/ashtami_title.png',
  nabami: '/images/doodles/navami_title.png',
  navami: '/images/doodles/navami_title.png',
  dashami: '/images/doodles/dashami_title.png',
};

export const FestivalHero: React.FC<FestivalHeroProps> = ({
  festival,
  status,
  selectedDay,
  onClearSelectedDay,
  onOpenSitePicker,
}) => {
  // If user explicitly picked a day from selector, showcase that day
  const isViewingSpecificDay = Boolean(selectedDay);
  const activeDay = selectedDay || status.currentDay;
  const daysToGo = status.daysRemaining ?? 1;
  const animatedDays = useAnimatedCounter(daysToGo, 1.4);

  const doodleTitleSrc = activeDay ? DAY_DOODLE_TITLES[activeDay.id] : undefined;

  return (
    <div className="relative flex flex-col items-center justify-center text-center px-3 sm:px-4 max-w-4xl mx-auto py-2 sm:py-6">
      
      {/* Selected Day Reset Banner if viewing a specific day */}
      <AnimatePresence>
        {isViewingSpecificDay && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3 sm:mb-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-[#d4af37]/35 backdrop-blur-2xl text-xs text-[#f4e5a9] shadow-lg"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
            <span>Viewing Day Plan: <strong>{selectedDay?.name}</strong></span>
            <button
              onClick={onClearSelectedDay}
              className="ml-2 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATE 1: VIEWING A SPECIFIC DAY OR DURING DURGA PUJA */}
      {(isViewingSpecificDay || status.status === 'DURING') && activeDay ? (
        <motion.div
          key={activeDay.id}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center w-full"
        >
          {/* Bengali title badge */}
          {activeDay.bengaliName && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-1.5 sm:mb-2 px-3.5 py-1 rounded-full bg-black/50 border border-white/15 backdrop-blur-2xl text-xs font-serif text-[#f4e5a9]/90 tracking-widest flex items-center gap-2 shadow-md"
            >
              <DayThemeDoodle dayId={activeDay.id} size="xs" animated={true} />
              <span>{activeDay.bengaliName}</span>
            </motion.div>
          )}

          {/* Illustrated Doodle Typographic Day Title Banner */}
          {doodleTitleSrc ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative my-2 sm:my-3 w-full max-w-[320px] sm:max-w-[480px] md:max-w-[620px] lg:max-w-[700px] mx-auto flex items-center justify-center"
            >
              {/* Subtle ambient warm back-glow behind typographic artwork */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/35 via-[#f97316]/30 to-[#e11d48]/35 blur-2xl opacity-80 pointer-events-none rounded-3xl" />
              
              <motion.img
                src={doodleTitleSrc}
                alt={`${activeDay.name} Durga Puja Doodle Typography`}
                className="relative z-10 w-full h-auto object-contain max-h-[140px] sm:max-h-[190px] md:max-h-[230px] drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)] select-none pointer-events-none filter brightness-105 contrast-105"
                animate={{ y: [-2.5, 2.5, -2.5] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          ) : (
            /* Fallback for non-doodled days */
            <div className="relative my-2">
              <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/25 via-[#8b1e2a]/25 to-[#d4af37]/25 blur-3xl opacity-70 pointer-events-none" />
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white uppercase font-sans drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
                {activeDay.name}
              </h1>
            </div>
          )}

          {/* Ordinal Subtitle & Significance */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-1 sm:mt-1.5 text-sm sm:text-lg font-light tracking-wide text-white/85 font-mono"
          >
            {activeDay.ordinalLabel}
          </motion.p>

          {/* Day Ritual & Shakti Significance Tag */}
          {activeDay.significance && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-2 px-3.5 py-1 rounded-full bg-black/45 border border-[#d4af37]/30 text-xs text-[#f4e5a9] backdrop-blur-md flex items-center gap-1.5 shadow-md max-w-sm sm:max-w-md text-center"
            >
              <Sparkles size={12} className="text-[#d4af37] shrink-0" />
              <span className="truncate">{activeDay.significance}</span>
            </motion.div>
          )}

          {/* Under that: "Choose the site" where user can select sites through the actual map */}
          {onOpenSitePicker && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mt-4 sm:mt-6 w-full max-w-sm sm:max-w-md"
            >
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenSitePicker}
                className="group relative w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl glass-panel-gold border border-[#d4af37]/40 hover:border-[#d4af37] bg-black/55 hover:bg-black/70 backdrop-blur-2xl text-white flex items-center justify-between space-x-3 transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_40px_rgba(212,175,55,0.3)]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform shrink-0">
                    <Compass size={18} className="text-[#d4af37] group-hover:rotate-45 transition-transform duration-500" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-[#f4e5a9] transition-colors flex items-center gap-1.5">
                      <span>Choose the site</span>
                      <MapPin size={13} className="text-[#d4af37] animate-pulse" />
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-white/60 tracking-normal font-light">
                      Select North, Central or South on Map
                    </span>
                  </div>
                </div>
                <div className="pl-2 border-l border-white/15 shrink-0">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/40 group-hover:bg-[#d4af37] group-hover:text-black transition-colors">
                    Map →
                  </span>
                </div>
              </motion.button>
            </motion.div>
          )}
        </motion.div>

      /* STATE 2: BEFORE DURGA PUJA (COUNTDOWN) */
      ) : status.status === 'BEFORE' ? (
        <motion.div
          key="countdown-hero"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center w-full"
        >
          {/* Subtle Bengali subtitle */}
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#d4af37]/90 font-medium mb-1 font-mono"
          >
            {festival.bengaliTitle} • Aagomoni
          </motion.span>

          {/* Central Extremely Large Animated Number with Warm Golden Aura */}
          <div className="relative my-1 sm:my-3 flex items-center justify-center">
            {/* Subtle animated ambient glow behind number */}
            <motion.div
              className="absolute w-44 sm:w-64 h-44 sm:h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(139, 30, 42, 0.15) 50%, transparent 75%)',
                filter: 'blur(45px)',
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* The Number */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 font-sans font-black text-7xl sm:text-9xl md:text-[130px] leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/70 drop-shadow-[0_10px_35px_rgba(212,175,55,0.3)]"
            >
              {animatedDays}
            </motion.div>
          </div>

          {/* "DAYS TO GO" */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="tracking-[0.3em] text-xs sm:text-sm font-semibold text-[#f4e5a9] uppercase font-mono"
          >
            DAYS TO GO
          </motion.div>

          {/* "Durga Puja is almost here" */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-2 text-sm sm:text-base font-light text-white/75 tracking-wide"
          >
            Durga Puja is almost here
          </motion.p>
        </motion.div>

      /* STATE 3: AFTER DURGA PUJA */
      ) : (
        <motion.div
          key="ended-hero"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Subtle halo */}
          <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center justify-center mb-6 text-[#d4af37] shadow-glass">
            <Sparkles size={32} />
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-sans">
            Pujo has ended
          </h1>

          <p className="mt-4 text-lg sm:text-2xl font-light text-[#f4e5a9]/90 tracking-wide flex items-center gap-2">
            <span>See you again next year</span>
            <span>✨</span>
          </p>

          <p className="mt-2 text-sm text-white/40 font-serif">
            শুভ বিজয়া • Asche bochor abar hobe!
          </p>
        </motion.div>
      )}

    </div>
  );
};
