import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  AlertCircle, 
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { signInWithGoogle as signInWithFirebase, isFirebaseConfigured } from '../services/firebase';
import { syncUserProfile } from '../services/firebaseBackend';
import { processGcpCredential, signInWithGcpOAuthPopup } from '../services/gcpAuth';

// Floating festive golden sparks (hardware CSS keyframe animations)
const FESTIVE_EMBERS = [
  { id: 0, size: 4, left: 6, delay: 0.1, duration: 8 },
  { id: 1, size: 2.5, left: 16, delay: 1.8, duration: 10.5 },
  { id: 2, size: 5, left: 26, delay: 0.8, duration: 9 },
  { id: 3, size: 3, left: 36, delay: 3.2, duration: 7.5 },
  { id: 4, size: 2, left: 46, delay: 0.5, duration: 11 },
  { id: 5, size: 4.5, left: 56, delay: 2.4, duration: 8.5 },
  { id: 6, size: 3, left: 66, delay: 1.2, duration: 10 },
  { id: 7, size: 2.5, left: 76, delay: 3.8, duration: 8 },
  { id: 8, size: 4, left: 86, delay: 0.3, duration: 9.5 },
  { id: 9, size: 3, left: 93, delay: 2.6, duration: 9 },
];

export const LoginScreen: React.FC = () => {
  const { setUserFromGcp, gcpClientId, login } = useAuth();
  const { permissionState, locality, requestLocation } = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Initialize One-Tap GIS if available in browser
  useEffect(() => {
    if (!gcpClientId || typeof window === 'undefined') return;

    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: gcpClientId,
          callback: async (response) => {
            if (response.credential) {
              const user = processGcpCredential(response.credential);
              if (user) {
                try {
                  await syncUserProfile(user);
                } catch { /* ignore */ }
                setUserFromGcp(user);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    } catch { /* ignore */ }
  }, [gcpClientId, setUserFromGcp]);

  // Direct Google Sign In handler via Firebase Auth popup (uses authorized domain)
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setLoginError(null);

    try {
      // 1. Try Firebase Auth popup (uses client ID via Firebase handler)
      if (isFirebaseConfigured) {
        try {
          const fbUser = await signInWithFirebase();
          if (fbUser) {
            try {
              await syncUserProfile({
                uid: fbUser.uid,
                displayName: fbUser.displayName,
                email: fbUser.email,
                photoURL: fbUser.photoURL,
                authSource: 'firebase'
              });
            } catch (e) {
              console.warn('[Firestore] Registration note:', e);
            }

            setUserFromGcp({
              uid: fbUser.uid,
              displayName: fbUser.displayName,
              email: fbUser.email,
              photoURL: fbUser.photoURL,
              authSource: 'firebase' as any
            });
            return;
          }
        } catch (fbErr: any) {
          console.warn('Firebase popup notice:', fbErr);
          if (fbErr?.code === 'auth/popup-closed-by-user' || fbErr?.code === 'auth/cancelled-popup-request') {
            return;
          }
          throw fbErr;
        }
      }

      // 2. Direct GCP OAuth Token popup with user's client ID
      if (gcpClientId) {
        const gUser = await signInWithGcpOAuthPopup(gcpClientId);
        if (gUser) {
          try {
            await syncUserProfile(gUser);
          } catch { /* ignore */ }
          setUserFromGcp(gUser);
          return;
        }
      }

      // 3. Fallback to general login
      await login();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed popup window, no error needed
        return;
      }
      setLoginError(err?.message || 'Could not complete Google Sign-In. You can tap below to enter.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Direct Devotee session fallback
  const handleDirectEntry = () => {
    setUserFromGcp({
      uid: `devotee-${Date.now()}`,
      displayName: 'Pujo Devotee',
      email: 'devotee@sharodshav.app',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authSource: 'preview'
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden select-none">
      
      {/* Floating festive golden sparks */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden select-none">
        {FESTIVE_EMBERS.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-float-ember transform-gpu"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              bottom: '5%',
              background: '#fde047',
              boxShadow: '0 0 12px 2.5px rgba(234, 179, 8, 0.8)',
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-sm z-10 animate-fadeIn">
        
        {/* Shimmering Animated Golden Aura Border */}
        <div 
          className="absolute -inset-[3px] rounded-[30px] opacity-80 pointer-events-none animate-pulse-slow filter blur-[1px]"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.6), rgba(245, 158, 11, 0.2), transparent 50%, rgba(220, 38, 38, 0.4), rgba(212, 175, 55, 0.6))',
          }}
        />

        {/* Card Glass Panel */}
        <div className="relative rounded-[28px] p-7 sm:p-9 glass-panel border border-white/20 shadow-2xl overflow-hidden text-center bg-[#0a0c14]/95 backdrop-blur-2xl">
          
          {/* Top specular reflection line */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#f4e5a9]/60 to-transparent" />

          {/* Ambient festive radial glows */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#d4af37]/25 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#991b1b]/25 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '2.5s' }} />

          {/* Brand Logo with 3D Floating Animation */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
            className="mx-auto mb-5 w-24 h-24 rounded-3xl overflow-hidden border-2 border-[#d4af37]/60 bg-black/80 p-2 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)]"
          >
            <img 
              src="/sharodshav_logo.png" 
              alt="Sharodshav Official Logo" 
              className="w-full h-full object-contain object-center drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            />
          </motion.div>

          {/* Main Title with Animated Sparkling Text Gradient */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider font-sans relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fef3c7] via-[#d4af37] to-[#fbbf24] text-glow">
              SHARODSHAV
            </span>
            <span className="absolute -top-2.5 -right-5 text-[#d4af37]">
              <Sparkles size={16} className="animate-spin" style={{ animationDuration: '9s' }} />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-xs sm:text-sm text-white/75 font-medium tracking-tight">
            Optimal Pandal Navigation • Pujo Planner
          </p>

          {/* Festive Divider */}
          <div className="my-5 relative h-[1px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />

          {/* Error Message */}
          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="mb-4 px-3.5 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-[11px] text-rose-200 flex items-start gap-2 text-left shadow-lg"
              >
                <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span>{loginError}</span>
                  {loginError && (
                    <button
                      type="button"
                      onClick={handleDirectEntry}
                      className="block text-[#f4e5a9] font-semibold underline hover:text-white mt-1 text-[11px] cursor-pointer"
                    >
                      &rarr; Tap here to enter festival portal now
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Official Google Sign-In Button (Single, Clean, High-Contrast Pill) */}
          <div className="flex justify-center items-center my-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full max-w-[285px] h-[48px] px-5 py-2.5 rounded-full bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 font-medium text-sm flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.6)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-neutral-200/80 disabled:opacity-60 disabled:cursor-not-allowed select-none"
              title="Sign in with Google"
            >
              {isSigningIn ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                  <span className="text-neutral-700 text-xs font-semibold">Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="font-semibold text-neutral-800 text-[13px] tracking-wide">
                    Sign in with Google
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Location Status Badge */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center space-x-1.5 text-xs text-white/60">
            <MapPin size={13} className={permissionState === 'granted' ? 'text-emerald-400 shrink-0' : 'text-[#d4af37] shrink-0'} />
            <span className="truncate max-w-[200px] text-[11px]">
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
                className="text-[#f4e5a9] underline ml-1 hover:text-white text-[11px] font-medium cursor-pointer"
              >
                Enable
              </button>
            )}
          </div>

          {/* Footer Branding */}
          <div className="mt-4 text-[10px] text-white/40 tracking-wider font-mono select-none">
            made by - <span className="text-[#d4af37]/70 font-semibold">soutrik_2006</span>
          </div>

        </div>
      </div>

    </div>
  );
};
