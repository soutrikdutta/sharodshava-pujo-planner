import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  AlertCircle, 
  Key, 
  Check, 
  ExternalLink, 
  HelpCircle, 
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { processGcpCredential } from '../services/gcpAuth';

// Floating particle config
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: 2 + Math.random() * 3,
  x: Math.random() * 100,
  delay: Math.random() * 6,
  duration: 8 + Math.random() * 7,
  drift: -20 + Math.random() * 40,
  opacity: 0.15 + Math.random() * 0.35,
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: 'easeOut' as const },
  },
};

const logoVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -12 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring' as const, damping: 15, stiffness: 180, delay: 0.1 },
  },
};

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: {
    x: '200%',
    transition: { duration: 2.5, ease: 'easeInOut' as const, repeat: Infinity, repeatDelay: 4 },
  },
};

const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 20px 0px rgba(212, 175, 55, 0.15)',
      '0 0 40px 8px rgba(212, 175, 55, 0.3)',
      '0 0 20px 0px rgba(212, 175, 55, 0.15)',
    ],
    transition: { duration: 3, ease: 'easeInOut' as const, repeat: Infinity },
  },
};

const floatAnimation = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 4, ease: 'easeInOut' as const, repeat: Infinity },
  },
};

// Google logo SVG
const GoogleLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

export const LoginScreen: React.FC = () => {
  const { 
    setUserFromGcp, 
    gcpClientId, 
    setGcpClientId 
  } = useAuth();
  
  const { permissionState, locality, requestLocation } = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showGcpConfigModal, setShowGcpConfigModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(gcpClientId || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isGisReady, setIsGisReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const gisInitializedRef = useRef(false);
  const signingInRef = useRef(false);

  // Initialize Google Identity Services
  const initializeGis = useCallback(() => {
    if (!gcpClientId || !window.google?.accounts?.id || !googleButtonContainerRef.current) {
      return false;
    }
    if (gisInitializedRef.current) return true;

    try {
      window.google.accounts.id.initialize({
        client_id: gcpClientId,
        callback: (response) => {
          signingInRef.current = false;
          setIsSigningIn(false);
          if (response.credential) {
            const user = processGcpCredential(response.credential);
            if (user) {
              setUserFromGcp(user);
            } else {
              setLoginError('Failed to decode Google user profile.');
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the official Google button inside our hidden container
      googleButtonContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: 300,
      });

      gisInitializedRef.current = true;
      setIsGisReady(true);
      return true;
    } catch (e) {
      console.warn('GIS init error:', e);
      return false;
    }
  }, [gcpClientId, setUserFromGcp]);

  // Poll for GIS SDK readiness
  useEffect(() => {
    if (!gcpClientId) return;
    gisInitializedRef.current = false;

    let attempts = 0;
    const maxAttempts = 50;

    const tryInit = () => {
      attempts++;
      if (initializeGis()) {
        clearInterval(timer);
      } else if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    };

    tryInit();
    const timer = setInterval(tryInit, 200);
    return () => clearInterval(timer);
  }, [gcpClientId, initializeGis]);

  // Sign-in handler — click hidden Google button then fall back to prompt
  const handleGoogleSignIn = useCallback(() => {
    if (signingInRef.current) return;
    signingInRef.current = true;
    setIsSigningIn(true);
    setLoginError(null);

    // Strategy 1: Click the real Google rendered button
    const googleDiv = googleButtonContainerRef.current?.querySelector('[role="button"]') as HTMLElement | null;
    
    if (googleDiv) {
      googleDiv.click();
      // Fallback: if nothing happens after a moment, use prompt
      setTimeout(() => {
        if (signingInRef.current) {
          try {
            window.google?.accounts?.id?.prompt();
          } catch {
            // ignore
          }
        }
      }, 1500);
    } else {
      // Strategy 2: Direct prompt (most reliable fallback)
      try {
        window.google?.accounts?.id?.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            signingInRef.current = false;
            setIsSigningIn(false);
            setLoginError('Google sign-in popup was blocked. Please allow popups and try again.');
          }
        });
      } catch {
        signingInRef.current = false;
        setIsSigningIn(false);
        setLoginError('Google sign-in is not available. Please try refreshing the page.');
      }
    }

    // Safety timeout
    setTimeout(() => {
      signingInRef.current = false;
      setIsSigningIn(false);
    }, 15000);
  }, []);

  const handleSaveGcpClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setGcpClientId(clientIdInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowGcpConfigModal(false);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      
      {/* Floating golden particles */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              bottom: '-5%',
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.9), rgba(212, 175, 55, 0.3))',
              boxShadow: `0 0 ${p.size * 3}px ${p.size}px rgba(212, 175, 55, 0.25)`,
            }}
            animate={{
              y: [0, -window.innerHeight * 1.2],
              x: [0, p.drift],
              opacity: [0, p.opacity, p.opacity, 0],
              scale: [0.5, 1, 1, 0.3],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Main login card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-sm z-10"
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-[2px] rounded-[26px] opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3), transparent 40%, transparent 60%, rgba(139, 30, 42, 0.3))',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
        />

        {/* Card body */}
        <div className="relative rounded-3xl p-7 sm:p-9 glass-panel border border-white/15 shadow-2xl overflow-hidden text-center bg-[#0b0d13]/90 backdrop-blur-xl">
          
          {/* Top shimmer line */}
          <div className="absolute top-0 inset-x-0 h-[1px] overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <motion.div
              className="absolute inset-y-0 w-[40%]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.6), transparent)',
              }}
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
            />
          </div>

          {/* Ambient glows */}
          <motion.div
            className="absolute -top-20 -right-20 w-48 h-48 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#8b1e2a]/15 rounded-full blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.12, 0.22, 0.12],
            }}
            transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 2 }}
          />

          {/* Logo */}
          <motion.div variants={logoVariants} {...floatAnimation}>
            <motion.div
              className="mx-auto mb-5 w-24 h-24 rounded-3xl overflow-hidden border border-[#d4af37]/50 bg-black/60 p-2 flex items-center justify-center"
              {...pulseGlow}
            >
              <img 
                src="/sharodshav_logo.png" 
                alt="Sharodshav Logo" 
                className="w-full h-full object-contain object-center"
              />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider font-sans relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f4e5a9] via-[#d4af37] to-[#e6ca65] text-glow">
                SHARODSHAV
              </span>
              <motion.span
                className="absolute -top-2 -right-5 text-[#d4af37]"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
              >
                <Sparkles size={14} />
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-1.5 text-xs sm:text-sm text-white/60 font-medium tracking-tight"
          >
            Optimal Pandal Navigation • Pujo Planner
          </motion.p>

          {/* Animated divider */}
          <motion.div
            variants={itemVariants}
            className="my-6 relative h-[1px] w-full overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <motion.div
              className="absolute inset-y-0 w-16"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent)',
              }}
              animate={{ x: ['-64px', 'calc(100% + 64px)'] }}
              transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2 }}
            />
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-4 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-[11px] text-red-200 flex items-start gap-2 text-left overflow-hidden"
              >
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign-In Button */}
          <motion.div variants={itemVariants}>
            {/* Hidden real Google button container */}
            <div 
              ref={googleButtonContainerRef}
              className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
              aria-hidden="true"
            />

            {/* Our custom button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || !isGisReady}
              onHoverStart={() => setButtonHovered(true)}
              onHoverEnd={() => setButtonHovered(false)}
              className="relative w-full max-w-[300px] mx-auto h-[50px] rounded-full overflow-hidden cursor-pointer disabled:cursor-wait group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {/* Button background */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8f8f8)',
                }}
                animate={{
                  boxShadow: buttonHovered
                    ? '0 8px 32px rgba(212, 175, 55, 0.25), 0 0 0 2px rgba(212, 175, 55, 0.4)'
                    : '0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)',
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Shimmer sweep on hover */}
              <motion.div className="absolute inset-0 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 w-[60%]"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.12), transparent)',
                  }}
                  animate={buttonHovered ? { x: ['-60%', '160%'] } : {}}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
              </motion.div>

              {/* Button content */}
              <div className="relative z-10 flex items-center justify-center gap-3 h-full px-6">
                {isSigningIn ? (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="w-5 h-5 border-2 border-gray-300 border-t-[#d4af37] rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="text-sm font-medium text-gray-600">Signing in...</span>
                  </motion.div>
                ) : !isGisReady ? (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="w-5 h-5 border-2 border-gray-200 border-t-[#4285F4] rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="text-sm font-medium text-gray-400">Loading...</span>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm border border-black/5 shrink-0 p-[5px]"
                      animate={buttonHovered ? { rotate: [0, -5, 5, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <GoogleLogo />
                    </motion.div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors tracking-tight">
                      Sign in with Google
                    </span>
                  </>
                )}
              </div>
            </motion.button>
          </motion.div>

          {/* "secure" divider */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 my-4"
          >
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">secure</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/10" />
          </motion.div>

          {/* Location status */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center space-x-1.5 text-xs text-white/50"
          >
            <motion.div
              animate={permissionState !== 'granted' ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MapPin size={12} className={permissionState === 'granted' ? 'text-emerald-400' : 'text-[#d4af37]'} />
            </motion.div>
            <span className="truncate max-w-[200px]">
              {permissionState === 'granted'
                ? `${locality || 'Location active'}`
                : permissionState === 'denied'
                  ? 'Location blocked'
                  : 'Detecting location...'}
            </span>
            {permissionState !== 'granted' && (
              <motion.button
                onClick={requestLocation}
                className="text-[#f4e5a9] underline ml-1 hover:text-white text-[11px] cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Enable
              </motion.button>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-4 text-[10px] text-white/25 tracking-wider font-mono"
          >
            made by - <span className="text-[#d4af37]/50">soutrik_2006</span>
          </motion.div>
        </div>
      </motion.div>

      {/* GCP Config Modal */}
      <AnimatePresence>
        {showGcpConfigModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGcpConfigModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl glass-panel border border-white/20 p-6 shadow-2xl bg-[#0b0d13]/95 text-left z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                    <Key size={16} />
                  </div>
                  <h3 className="text-base font-bold text-white">Google Cloud (GCP) OAuth</h3>
                </div>
                <motion.button
                  onClick={() => setShowGcpConfigModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              <form onSubmit={handleSaveGcpClientId} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    GCP OAuth Web Client ID
                  </label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#d4af37] focus:outline-none text-white text-xs font-mono placeholder:text-white/30 transition-colors"
                  />
                  <p className="text-[10px] text-white/40">
                    Saved directly in your browser's local storage and environment.
                  </p>
                </div>

                {/* Quick GCP Setup Guide */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs text-white/70">
                  <div className="flex items-center gap-1.5 font-semibold text-white text-[11px]">
                    <HelpCircle size={13} className="text-[#d4af37]" />
                    <span>How to get your GCP Client ID (1 minute):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-white/60 pl-1">
                    <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[#d4af37] underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink size={10} /></a></li>
                    <li>Click <strong>Create Credentials &rarr; OAuth client ID</strong></li>
                    <li>Select <strong>Web application</strong></li>
                    <li>Under <strong>Authorized JavaScript origins</strong>, add: <code className="bg-black/40 px-1 rounded text-emerald-300 font-mono text-[10px]">http://localhost:5173</code></li>
                    <li>Copy your <strong>Client ID</strong> and paste it above!</li>
                  </ol>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <motion.button
                    type="button"
                    onClick={() => setShowGcpConfigModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e6ca65] text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {savedSuccess ? (
                      <>
                        <Check size={14} />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Client ID</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
