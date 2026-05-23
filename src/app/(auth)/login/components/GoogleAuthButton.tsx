"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { studentAuthService } from '@/services/student/auth.service';
import { useLocalStorage } from '../../shared/hooks/useLocalStorage';
import { toast } from 'sonner';
import { StudentLoginResponse } from '@/types/student/auth.types';

export function GoogleAuthButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setOnboardingUser] = useLocalStorage('onboardingUser', null);

  // When the user clicks "Continue with Google" we set loading=true and
  // navigate to Google via window.location.href. If they then press the
  // browser BACK button, modern browsers restore this page from the
  // back-forward cache (bfcache) with React state preserved as-is —
  // so loading stays true forever, the button stays disabled, and the
  // "Redirecting to Google..." spinner is stuck on screen.
  //
  // The `pageshow` event fires both on first load and on bfcache restore;
  // `event.persisted === true` distinguishes the bfcache case. We reset
  // state only on bfcache restore so first-time mount behaviour is
  // unaffected.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoading(false);
        setError('');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const processPostLogin = (u: StudentLoginResponse['user']) => {
    if (!u.leetcode_id || !u.gfg_id || !u.username) {
      localStorage.setItem('onboardingUser', JSON.stringify(u));
      router.push('/onboarding');
      return;
    }
    router.push('/');
  };


  const handleGoogleSignIn = () => {
    if (loading) return;

    setLoading(true);
    setError('');

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    const scope = encodeURIComponent('openid email profile');

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=id_token&` +
      `scope=${scope}&` +
      `nonce=${Date.now()}`;

    window.location.href = googleAuthUrl;
  };

  return (
<div className="flex flex-col items-center w-full  mx-auto ">
  <button
    onClick={handleGoogleSignIn}
    disabled={loading}
    className="glass relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
  >
    {/* Google Icon Wrapper */}
    <div className="flex h-5 w-5 items-center justify-center">
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107" />
        <path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00" />
        <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50" />
        <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2" />
      </svg>
    </div>
    
    <span className='text-foreground'>Continue with Google</span>
  </button>

  {/* Error Message */}
  {error && (
    <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-1">
      <span className="h-1 w-1 rounded-full bg-red-600" />
      {error}
    </div>
  )}

  {/* Loading State */}
  {loading && !error && (
    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-500 animate-pulse">
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      Redirecting to Google...
    </div>
  )}
</div>
  );
}
