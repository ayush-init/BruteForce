"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { studentAuthService } from '@/services/student/auth.service';
import { showError, showSuccess } from '@/ui/toast';
import { BruteForceLoader } from '@/components/ui/BruteForceLoader';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let hasRun = false;

    const handleGoogleCallback = async () => {
      if (hasRun) return;
      hasRun = true;

      try {
        setLoading(true);
        setError('');

        // Debug: Log all URL parameters
        // console.log('All URL params:', Object.fromEntries(searchParams.entries()));
        // console.log('Current URL:', window.location.href);
        // console.log('Hash fragment:', window.location.hash);

        // Extract credential from URL parameters (GIS redirect)
        const credential = searchParams.get('credential');

        // Also check for id_token in hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const idToken = hashParams.get('id_token');

        // Check for error parameters first
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          const errorMsg = `Google OAuth Error: ${errorDescription || error}`;
          setError(errorMsg);
          showError('Google Sign-In Failed', errorDescription || String(error) || 'An error occurred during Google authentication.');
          return;
        }

        const token = credential || idToken;

        if (!token) {
          setError('No credential received from Google');
          showError('Sign-In Failed', 'No credentials received from Google. Please try again.');
          return;
        }

        // Send token to backend for verification using your backend route
        const data = await studentAuthService.googleLogin(token);

        if (data.accessToken) {
          // Store access token securely
          localStorage.setItem('accessToken', data.accessToken);
          document.cookie = `accessToken=${data.accessToken}; path=/; secure; samesite=strict`;
          showSuccess('Welcome Back!', 'You have successfully signed in with Google.');

          // Handle post-login routing
          if (!data.user.leetcode_id || !data.user.gfg_id || !data.user.username) {
            localStorage.setItem('onboardingUser', JSON.stringify(data.user));
            router.push('/onboarding');
          } else {
            router.push('/');
          }
        } else {
          setError('Login failed: No token received');
          showError('Sign-In Failed', 'Session could not be established. Please try logging in again.');
        }
      } catch (err: unknown) {
        const error = err as {
          message?: string;
          response?: { data?: { error?: string; message?: string } };
        };

        const errorMessage = error.message ||
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Google login failed';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <BruteForceLoader />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center text-center max-w-md w-full">
          <div className="w-[70vmin] h-[70vmin] max-w-[500px] max-h-[500px]">
            <DotLottieReact
              src="/404erroranimation.json"
              loop
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </div>



          <p className="text-muted-foreground mb-8">
            {error.toLowerCase().includes('not registered')
              ? 'Your email is not registered. Please contact the admin.'
              : error}
          </p>

          <button
            onClick={() => router.push('/login')}
            className="px-8 py-2.5 rounded-full bg-primary text-black font-semibold
                     hover:opacity-90 transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
