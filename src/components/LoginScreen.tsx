import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  AlertCircle, 
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { processGcpCredential } from '../services/gcpAuth';

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

// Rounded Google brand logo SVG
const GoogleRoundIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md shrink-0 p-1">
    <svg className="w-full h-full" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  </div>
);

export const LoginScreen: React.FC = () => {
  const { setUserFromGcp, gcpClientId } = useAuth();
  const { permissionState, locality, requestLocation } = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showDirectHelp, setShowDirectHelp] = useState(false);
  const googleBtnMountRef = useRef<HTMLDivElement>(null);
  const gisMountedRef = useRef(false);

  // Initialize official Google Identity Services button inside container
  useEffect(() => {
    if (!gcpClientId || typeof window === 'undefined') return;

    const tryRenderOfficialGoogleButton = () => {
      if (window.google?.accounts?.id && googleBtnMountRef.current && !gisMountedRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: gcpClientId,
            callback: (response) => {
              setIsSigningIn(false);
              if (response.credential) {
                const user = processGcpCredential(response.credential);
                if (user) {
                  setUserFromGcp(user);
                } else {
                  setLoginError('Could not process Google profile.');
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          googleBtnMountRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnMountRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 290,
          });

          gisMountedRef.current = true;
        } catch (e) {
          console.warn('[GIS] Official button mount error:', e);
        }
      }
    };

    tryRenderOfficialGoogleButton();
    const interval = setInterval(tryRenderOfficialGoogleButton, 350);
    return () => clearInterval(interval);
  }, [gcpClientId, setUserFromGcp]);

  // Primary Google Sign-in Handler: Uses Google OAuth2 token popup
  const handlePrimaryGoogleSignIn = useCallback(() => {
    setIsSigningIn(true);
    setLoginError(null);

    // 1. If Google OAuth2 token client is available, trigger direct popup
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: gcpClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.warn('OAuth2 error:', tokenResponse.error);
              setIsSigningIn(false);
              // If origin mismatch on new Vercel domain, explain clearly
              if (tokenResponse.error.includes('origin') || tokenResponse.error === 'idpiframe_initialization_failed') {
                setLoginError('Domain origin pending in Google Cloud Console. Click below to enter festival portal.');
                setShowDirectHelp(true);
              } else if (tokenResponse.error !== 'popup_closed_by_user') {
                setLoginError(`Google Sign-in: ${tokenResponse.error}`);
              }
              return;
            }

            if (!tokenResponse.access_token) {
              setIsSigningIn(false);
              setLoginError('No access token received from Google.');
              return;
            }

            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              if (!res.ok) throw new Error('Could not fetch user profile');
              const data = await res.json();
              setUserFromGcp({
                uid: data.sub || `gcp-${Date.now()}`,
                displayName: data.name || data.given_name || 'Pujo Devotee',
                email: data.email || null,
                photoURL: data.picture || null,
                authSource: 'gcp'
              });
            } catch (err: any) {
              setIsSigningIn(false);
              setLoginError('Failed to load Google profile.');
            }
          }
        });

        client.requestAccessToken();
        // Reset signing in flag after 25 seconds if popup neglected
        setTimeout(() => setIsSigningIn(false), 25000);
        return;
      } catch (err: any) {
        console.warn('OAuth2 popup exception:', err);
      }
    }

    // 2. Fallback to GIS prompt / One Tap
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            setIsSigningIn(false);
            setLoginError('Sign-in popup unavailable. Tap the official Google button below.');
            setShowDirectHelp(true);
          }
        });
        setTimeout(() => setIsSigningIn(false), 8000);
        return;
      } catch {
        // pass
      }
    }

    // 3. If Google SDK is still loading or blocked
    setIsSigningIn(false);
    setLoginError('Google services loading. Please tap again in a moment.');
  }, [gcpClientId, setUserFromGcp]);

  // Direct Devotee session fallback (only shown when Google OAuth origin check fails on unverified domain)
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
                  {showDirectHelp && (
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

          {/* CONSTANT ROUNDED GOOGLE SIGN-IN BUTTON (Hyped Festive Animations) */}
          <div className="flex flex-col items-center justify-center my-3 gap-3">
            
            {/* Main Interactive Button with Shimmer & Scale Bounce */}
            <motion.button
              type="button"
              onClick={handlePrimaryGoogleSignIn}
              disabled={isSigningIn}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative w-full max-w-[300px] h-[52px] rounded-full overflow-hidden cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.35)] group bg-white text-gray-900 flex items-center px-2 font-medium text-sm select-none border-2 border-white/60 hover:border-[#d4af37] transition-all"
            >
              {/* Animated Light Sweep Bar */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

              {/* Rounded Google Logo */}
              <GoogleRoundIcon />

              {/* Centered Button Text */}
              <div className="flex-1 flex items-center justify-center pr-2">
                {isSigningIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-[#d4af37] animate-spin" />
                    <span className="text-xs text-gray-800 font-bold">Connecting...</span>
                  </div>
                ) : (
                  <span className="font-bold text-gray-800 tracking-tight text-[13px] sm:text-sm group-hover:text-black transition-colors">
                    Sign in with Google
                  </span>
                )}
              </div>
            </motion.button>

            {/* Official Google Identity Services Render Target */}
            <div 
              ref={googleBtnMountRef}
              className="flex justify-center items-center overflow-hidden min-h-[44px] transition-opacity duration-300"
              title="Official Google Sign-in Service"
            />

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
