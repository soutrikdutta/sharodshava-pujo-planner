import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Users, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Flame, 
  Compass
} from 'lucide-react';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMap?: () => void;
}

interface GuideStep {
  title: string;
  subtitle: string;
  bengali: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  borderColor: string;
  bgGradient: string;
  description: string;
  tips: string[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Explore Kolkata Zones & 151+ Pandals',
    subtitle: 'Interactive Zone Map Navigation',
    bengali: 'উত্তর, মধ্য ও দক্ষিণ কলকাতা পরিক্রমা',
    badge: 'Step 1 • Zone Trails',
    icon: Compass,
    accentColor: 'text-[#d4af37]',
    borderColor: 'border-[#d4af37]/40',
    bgGradient: 'from-[#d4af37]/20 via-[#d4af37]/5 to-transparent',
    description: 'Tap on North, Central, or South Kolkata on the interactive map to unlock 151+ authentic pandals curated with real Kolkata coordinates and vibe descriptions.',
    tips: [
      'North Kolkata: Traditional barowari & bonedi bari heritage.',
      'Central Kolkata: Grand lighting spectacles & historic city squares.',
      'South Kolkata: Modern theme pandals & magnificent artistic installations.'
    ]
  },
  {
    title: 'Instant Search & 1-Tap Itinerary',
    subtitle: 'Lightning-Fast Pandal Discovery',
    bengali: 'প্যান্ডেল খুঁজুন এবং রুট বানান',
    badge: 'Step 2 • Smart Search',
    icon: Search,
    accentColor: 'text-sky-400',
    borderColor: 'border-sky-500/40',
    bgGradient: 'from-sky-500/20 via-sky-500/5 to-transparent',
    description: 'Use the gold search bar at the top of any zone to find any pandal instantly by name, neighborhood, or theme.',
    tips: [
      'Tap "Select Recommended Options" for an instant Google-ranked trail.',
      'Filter by festival day (e.g. Saptami, Ashtami, Navami) to match your day.',
      'Tap "Suggest a Pandal" if your neighborhood favorite isn\'t listed yet!'
    ]
  },
  {
    title: 'Live Pujo Squad & Devotee Chats',
    subtitle: 'Connect With Friends Real-Time',
    bengali: 'বন্ধুদের সাথে লাইভ চ্যাট ও রুট শেয়ার',
    badge: 'Step 3 • Social Squad',
    icon: Users,
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgGradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    description: 'Tap "Squad & Chats" in the top bar to see other real Google devotees hopping near you across Kolkata.',
    tips: [
      'Send squad requests to coordinate hopping together.',
      'Direct 1-on-1 isolated chatting with instant message delivery.',
      'Share your active pandal trail directly inside chat with 1 tap!'
    ]
  },
  {
    title: 'Day-by-Day Rituals & Puja Timings',
    subtitle: 'Shashti to Dashami Cultural Guide',
    bengali: 'মহালয়া থেকে বিজয়া দশমী নির্ঘণ্ট',
    badge: 'Step 4 • Festival Days',
    icon: Calendar,
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    bgGradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
    description: 'Click "View Day Details" or select any festival day card on the home screen to discover deep cultural significance and auspicious timings.',
    tips: [
      'Bodhon & Kalparambha on Maha Shashti.',
      'Sandhi Puja & Kumari Puja timings on Maha Ashtami.',
      'Sindoor Khela & Bisarjan immersion on Vijaya Dashami.'
    ]
  },
  {
    title: 'AI Pujo Assistant & Transit Guide',
    subtitle: 'Kolkata-Smart Festival Companion',
    bengali: 'আপনার ব্যক্তিগত এআই সহায়ক',
    badge: 'Step 5 • AI Companion',
    icon: Sparkles,
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgGradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    description: 'The golden Durga assistant button at the bottom-right corner knows everything about Kolkata Pujo transit, Metro hours, food joints, and crowd patterns.',
    tips: [
      'Ask: "Which metro station is nearest to Suruchi Sangha?"',
      'Ask: "Suggest the best low-crowd pandals to visit late at night."',
      'Ask: "Where can I get the best Kathi rolls near College Square?"'
    ]
  }
];

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenMap
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = GUIDE_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === GUIDE_STEPS.length - 1;

  const handleFinish = () => {
    try {
      localStorage.setItem('pujo_guide_seen_device', 'true');
    } catch { /* ignore */ }
    onClose();
    if (onOpenMap) onOpenMap();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            try {
              localStorage.setItem('pujo_guide_seen_device', 'true');
            } catch { /* ignore */ }
            onClose();
          }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#0e1118] border border-[#d4af37]/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(212,175,55,0.2)] z-10 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top festive sheen */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

          {/* Close & Skip Buttons */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <Flame size={13} />
              <span>Sharodshav User Guide</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('pujo_guide_seen_device', 'true');
                  } catch { /* ignore */ }
                  onClose();
                }}
                className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-lg"
              >
                Skip Tour
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('pujo_guide_seen_device', 'true');
                  } catch { /* ignore */ }
                  onClose();
                }}
                className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Step Content Carousel */}
          <div className="py-4 flex-1 overflow-y-auto no-scrollbar flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {/* Step Badge & Bengali Subtitle */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 border ${currentStep.borderColor} ${currentStep.accentColor}`}>
                    {currentStep.badge}
                  </span>
                  <span className="text-xs text-white/40 font-serif">
                    {currentStep.bengali}
                  </span>
                </div>

                {/* Hero Icon & Title Box */}
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentStep.bgGradient} border ${currentStep.borderColor} flex items-start gap-3.5`}>
                  <div className={`w-12 h-12 rounded-2xl bg-black/50 border ${currentStep.borderColor} flex items-center justify-center shrink-0 ${currentStep.accentColor} shadow-inner`}>
                    <StepIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                      {currentStep.title}
                    </h3>
                    <p className={`text-xs ${currentStep.accentColor} font-medium mt-0.5`}>
                      {currentStep.subtitle}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                  {currentStep.description}
                </p>

                {/* Key Highlights / Tips */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                    Quick Pro Tips:
                  </span>
                  <ul className="space-y-1.5">
                    {currentStep.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-white/75 leading-relaxed">
                        <Check size={13} className={`${currentStep.accentColor} shrink-0 mt-0.5`} />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls & Progress Dots */}
          <div className="pt-3 border-t border-white/10 shrink-0 space-y-3">
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-1.5">
              {GUIDE_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-[#d4af37]'
                      : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isFirst}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca65] to-[#d4af37] hover:brightness-110 active:scale-[0.99] text-black text-xs sm:text-sm font-extrabold shadow-md shadow-[#d4af37]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isLast ? 'Start Exploring Sharodshav' : 'Next Step'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
