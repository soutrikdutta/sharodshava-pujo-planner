import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Building2, 
  Flame,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitPandalSuggestionToDb, type PandalSuggestion } from '../services/firebaseBackend';

interface SuggestPandalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultZone?: 'north' | 'central' | 'south';
}

const ZONES: { id: 'north' | 'central' | 'south'; name: string; bengali: string; accent: string; bg: string; border: string }[] = [
  { id: 'north', name: 'North Kolkata', bengali: 'উত্তর কলকাতা', accent: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { id: 'central', name: 'Central Kolkata', bengali: 'মধ্য কলকাতা', accent: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'south', name: 'South Kolkata', bengali: 'দক্ষিণ কলকাতা', accent: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' }
];

export const SuggestPandalModal: React.FC<SuggestPandalModalProps> = ({
  isOpen,
  onClose,
  defaultZone = 'south'
}) => {
  const { user } = useAuth();

  const [selectedZone, setSelectedZone] = useState<'north' | 'central' | 'south'>(defaultZone);
  const [pandalName, setPandalName] = useState('');
  const [locality, setLocality] = useState('');
  const [description, setDescription] = useState('');
  const [submitterName, setSubmitterName] = useState(user?.displayName || '');
  const [submitterEmail, setSubmitterEmail] = useState(user?.email || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      if (defaultZone) setSelectedZone(defaultZone);
      if (user?.displayName && !submitterName) setSubmitterName(user.displayName);
      if (user?.email && !submitterEmail) setSubmitterEmail(user.email);
      setIsSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, defaultZone, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pandalName.trim()) {
      setErrorMessage('Please provide the pandal name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const zoneObj = ZONES.find(z => z.id === selectedZone);
      const payload: PandalSuggestion = {
        zone: selectedZone,
        zoneLabel: zoneObj?.name || 'South Kolkata',
        pandalName: pandalName.trim(),
        locality: locality.trim() || undefined,
        description: description.trim() || undefined,
        submittedByName: submitterName.trim() || user?.displayName || 'Devotee',
        submittedByEmail: submitterEmail.trim() || user?.email || undefined,
        submittedByUid: user?.uid,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };

      await submitPandalSuggestionToDb(payload);
      setIsSuccess(true);
      setPandalName('');
      setLocality('');
      setDescription('');
    } catch (err: any) {
      console.error('Failed to submit suggestion:', err);
      setErrorMessage(err.message || 'Could not submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#0e1118] border border-[#d4af37]/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(212,175,55,0.15)] z-10 overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Top decorative sheen */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-75" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-4 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37]/25 to-amber-500/10 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-inner">
                <Flame size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Suggest a Pandal</span>
                  <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#f4e5a9] border border-[#d4af37]/30">
                    Sharodshav 2026
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  Help devotees discover your neighborhood barowari or bonedi bari puja
                </p>
              </div>
            </div>

            {/* Success State */}
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-auto py-8 text-center flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-lg font-bold text-white">
                    Pandal Submitted Successfully!
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Thank you! Your suggested pandal has been recorded in Cloud Firestore and sent to the curator's Google Docs for review & inclusion in Sharodshav 2026.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Suggest Another
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black text-xs font-bold transition-transform hover:scale-102 cursor-pointer shadow-lg"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                    <AlertCircle size={15} className="shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. Select Part of Kolkata */}
                <div>
                  <label className="block text-xs font-bold text-[#f4e5a9] mb-2 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#d4af37]" />
                    <span>1. Select Part of Kolkata <span className="text-rose-400">*</span></span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ZONES.map((zone) => {
                      const isSelected = selectedZone === zone.id;
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => setSelectedZone(zone.id)}
                          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? `${zone.bg} ${zone.border} border-2 shadow-md ring-1 ring-white/15`
                              : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <span className={`text-xs font-bold ${isSelected ? zone.accent : 'text-white/80'}`}>
                            {zone.name.replace(' Kolkata', '')}
                          </span>
                          <span className="text-[10px] text-white/40 font-serif">
                            {zone.bengali}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Pandal Name */}
                <div>
                  <label className="block text-xs font-bold text-[#f4e5a9] mb-1.5 flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#d4af37]" />
                    <span>2. Pandal / Puja Name <span className="text-rose-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pandalName}
                    onChange={(e) => setPandalName(e.target.value)}
                    placeholder="e.g. Suruchi Sangha, Tala Barowari, Shibmandir..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37] focus:bg-white/[0.07] transition-all"
                  />
                </div>

                {/* 3. Locality / Nearest Landmark / Metro */}
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-white/50" />
                    <span>3. Locality / Nearest Metro / Landmark (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Near Kalighat Metro, Shyambazar 5-point, Ballygunge..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37] transition-all"
                  />
                </div>

                {/* 4. Vibe / Special Theme / Highlights */}
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-white/50" />
                    <span>4. Theme / Attraction / Vibe (Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Traditional clay Pratima, eco-friendly architecture, 100-year heritage..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37] transition-all resize-none"
                  />
                </div>

                {/* 5. Submitter Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="Devotee name"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Your Email</label>
                    <input
                      type="email"
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !pandalName.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6ca65] to-[#d4af37] hover:brightness-110 active:scale-[0.99] text-black text-xs sm:text-sm font-extrabold shadow-lg shadow-[#d4af37]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Pandal...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Submit Pandal Suggestion</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
