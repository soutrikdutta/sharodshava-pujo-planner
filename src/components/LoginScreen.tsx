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

// Floating particle specs using pure CSS animation coordinates to avoid any JS evaluation bugs
const PARTICLES = [
  { id: 0, size: 3, left: 8, delay: 0.2, duration: 9 },
  { id: 1, size: 2, left: 18, delay: 2.1, duration: 11 },
  { id: 2, size: 4, left: 28, delay: 1.0, duration: 10 },
  { id: 3, size: 3, left: 38, delay: 3.4, duration: 8 },
  { id: 4, size: 2, left: 48, delay: 0.8, duration: 12 },
  { id: 5, size: 4, left: 58, delay: 2.7, duration: 9 },
  { id: 6, size: 3, left: 68, delay: 1.5, duration: 11 },
  { id: 7, size: 2, left: 78, delay: 4.0, duration: 8.5 },
  { id: 8, size: 4, left: 88, delay: 0.5, duration: 10.5 },
  { id: 9, size: 3, left: 94, delay: 2.9, duration: 9.5 },
];

// Clean Google brand SVG
const GoogleLogo: React.FC = () => (
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
    loginAsGuest,
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

  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const gisInitializedRef = useRef(false);
  const signingInRef = useRef(false);

  // Initialize Google Identity Services (GIS)
  const initializeGis = useCallback(() => {
    if (!gcpClientId || typeof window === 'undefined' || !window.google?.accounts?.id || !googleButtonContainerRef.current) {
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
              setLoginError('Failed to decode Google profile.');
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render official Google button into overlay/hidden element
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
    const maxAttempts = 60;

    const tryInit = () => {
      attempts++;
      if (initializeGis()) {
        clearInterval(timer);
      } else if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    };

    tryInit();
    const timer = setInterval(tryInit, 250);
    return () => clearInterval(timer);
  }, [gcpClientId, initializeGis]);

  // Sign-in trigger: clicks Google button & triggers prompt fallback
  const handleGoogleSignIn = useCallback(() => {
    if (signingInRef.current) return;
    signingInRef.current = true;
    setIsSigningIn(true);
    setLoginError(null);

    const googleBtn = googleButtonContainerRef.current?.querySelector('[role="button"]') as HTMLElement | null;
    
    if (googleBtn) {
      googleBtn.click();
      setTimeout(() => {
        if (signingInRef.current) {
          try {
            window.google?.accounts?.id?.prompt();
          } catch {
            // ignore
          }
        }
      }, 1200);
    } else {
      try {
        window.google?.accounts?.id?.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            signingInRef.current = false;
            setIsSigningIn(false);
            setLoginError('Sign-in popup was blocked. Please enable popups or try again.');
          }
        });
      } catch {
        signingInRef.current = false;
        setIsSigningIn(false);
        setLoginError('Google services unavailable. Please refresh.');
      }
    }

    setTimeout(() => {
      signingInRef.current = false;
      setIsSigningIn(false);
    }, 12000);
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
      
      {/* Floating golden festive particles (pure hardware CSS keyframes for 100% reliability) */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden select-none">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-float-ember transform-gpu"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              bottom: '5%',
              background: '#fde047',
              boxShadow: '0 0 10px 2px rgba(234, 179, 8, 0.7)',
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main Login Card with smooth entrance */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-sm z-10"
      >
        {/* Glowing border ring */}
        <div 
          className="absolute -inset-[2px] rounded-[26px] opacity-70 pointer-events-none animate-pulse-slow"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.4), transparent 40%, transparent 60%, rgba(139, 30, 42, 0.4))',
          }}
        />

        {/* Card glass panel */}
        <div className="relative rounded-3xl p-7 sm:p-9 glass-panel border border-white/15 shadow-2xl overflow-hidden text-center bg-[#0b0d13]/90 backdrop-blur-xl">
          
          {/* Top specular shimmer line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Ambient festive glows */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#d4af37]/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#8b1e2a]/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

          {/* Brand Logo with float animation */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
            className="mx-auto mb-5 w-24 h-24 rounded-3xl overflow-hidden border border-[#d4af37]/50 bg-black/60 p-2 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.35)]"
          >
            <img 
              src="/sharodshav_logo.png" 
              alt="Sharodshav Logo" 
              className="w-full h-full object-contain object-center"
            />
          </motion.div>

          {/* Title with subtle sparkle */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider font-sans relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f4e5a9] via-[#d4af37] to-[#e6ca65] text-glow">
              SHARODSHAV
            </span>
            <span className="absolute -top-2 -right-5 text-[#d4af37]">
              <Sparkles size={14} className="animate-spin" style={{ animationDuration: '8s' }} />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-1.5 text-xs sm:text-sm text-white/70 font-medium tracking-tight">
            Optimal Pandal Navigation • Pujo Planner
          </p>

          {/* Divider */}
          <div className="my-6 relative h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Error message */}
          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="mb-4 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-[11px] text-red-200 flex items-start gap-2 text-left"
              >
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign-In Button */}
          <div className="flex justify-center items-center my-3">
            {/* Hidden real Google button container */}
            <div 
              ref={googleButtonContainerRef}
              className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
              aria-hidden="true"
            />

            {/* Premium styled clickable button */}
            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full max-w-[290px] h-[48px] rounded-full overflow-hidden cursor-pointer shadow-lg group bg-white text-gray-800 flex items-center justify-center font-medium text-sm select-none border border-white/30 hover:border-[#d4af37] transition-colors"
            >
              {/* Button content */}
              <div className="flex items-center gap-3 px-5 pointer-events-none">
                {isSigningIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-[#d4af37] animate-spin" />
                    <span className="text-xs text-gray-700 font-semibold">Signing in...</span>
                  </div>
                ) : !isGisReady ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-[#4285F4] animate-spin" />
                    <span className="text-xs text-gray-500">Connecting Google...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0">
                      <GoogleLogo />
                    </div>
                    <span className="tracking-tight font-semibold text-gray-700 group-hover:text-black transition-colors">
                      Sign in with Google
                    </span>
                  </>
                )}
              </div>
            </motion.button>
          </div>

          {/* Quick Instant Devotee Demo Access Fallback */}
          <div className="mt-2.5 mb-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => loginAsGuest('Guest Devotee')}
              className="text-[11px] text-white/50 hover:text-[#f4e5a9] underline transition-colors cursor-pointer flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-white/5"
            >
              <span>Explore as Guest / Demo Devotee</span>
            </button>
          </div>

          {/* Location badge */}
          <div className="mt-5 flex items-center justify-center space-x-1.5 text-xs text-white/50">
            <MapPin size={12} className={permissionState === 'granted' ? 'text-emerald-400' : 'text-[#d4af37]'} />
            <span className="truncate max-w-[200px]">
              {permissionState === 'granted'
                ? `${locality || 'Location active'}`
                : permissionState === 'denied'
                  ? 'Location blocked'
                  : 'Detecting location...'}
            </span>
            {permissionState !== 'granted' && (
              <button
                type="button"
                onClick={requestLocation}
                className="text-[#f4e5a9] underline ml-1 hover:text-white text-[11px] cursor-pointer"
              >
                Enable
              </button>
            )}
          </div>

          {/* Footer attribution */}
          <div className="mt-4 text-[10px] text-white/30 tracking-wider font-mono">
            made by - <span className="text-[#d4af37]/60">soutrik_2006</span>
          </div>

        </div>
      </motion.div>

      {/* GCP OAuth Client ID Configuration Modal */}
      <AnimatePresence>
        {showGcpConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl glass-panel border border-white/20 p-6 shadow-2xl bg-[#0b0d13]/95 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                    <Key size={16} />
                  </div>
                  <h3 className="text-base font-bold text-white">Google Cloud (GCP) OAuth</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGcpConfigModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#d4af37] focus:outline-none text-white text-xs font-mono placeholder:text-white/30"
                  />
                  <p className="text-[10px] text-white/40">
                    Saved directly in your browser's local storage and environment.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs text-white/70">
                  <div className="flex items-center gap-1.5 font-semibold text-white text-[11px]">
                    <HelpCircle size={13} className="text-[#d4af37]" />
                    <span>How to get your GCP Client ID (1 minute):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-white/60 pl-1">
                    <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[#d4af37] underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink size={10} /></a></li>
                    <li>Click <strong>Create Credentials &rarr; OAuth client ID</strong></li>
                    <li>Select <strong>Web application</strong></li>
                    <li>Under <strong>Authorized JavaScript origins</strong>, add your site origin</li>
                    <li>Copy your <strong>Client ID</strong> and paste it above!</li>
                  </ol>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowGcpConfigModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e6ca65] text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {savedSuccess ? (
                      <>
                        <Check size={14} />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Client ID</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
