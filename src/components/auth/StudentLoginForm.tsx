"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentAuthService } from '@/services/student/auth.service';
import { StudentLoginResponse } from '@/types/student/auth.types';
import { GoogleAuthButton } from '@/app/(auth)/login/components/GoogleAuthButton';
import { BruteForceLoader } from '@/components/ui/BruteForceLoader';
import Logo from '@/components/Logo';
import { handleError } from '@/errors';
import { loginStudentSchema, LoginStudentInput } from '@/schemas/auth.schema';
import { showSuccess } from '@/ui/toast';

export function StudentLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isSubmitting = React.useRef(false);

  const form = useForm<LoginStudentInput>({
    resolver: zodResolver(loginStudentSchema),
    mode: "onChange",
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  const processPostLogin = (u: StudentLoginResponse['user']) => {
    if (!u.leetcode_id || !u.gfg_id || !u.username) {
      localStorage.setItem('onboardingUser', JSON.stringify(u));
      router.push('/onboarding');
      return;
    }
    router.push('/');
  };

  const handleLogin = async (values: LoginStudentInput) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    const emailOrUsername = values.email || values.username || '';

    if (emailOrUsername.includes('@')) {
      if (!emailOrUsername.endsWith('@pwioi.com')) {
        setEmailError("Please sign in with your PW email.");
        isSubmitting.current = false;
        return;
      }
    }

    try {
      setLoading(true);
      setEmailError('');

      const payload = values.email
        ? { email: values.email, password: values.password }
        : { username: values.username, password: values.password };

      const data: StudentLoginResponse = await studentAuthService.login(payload);

      if (data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        showSuccess('Welcome Back!', 'You have successfully logged in.');
        processPostLogin(data.user);
      }
    } catch (err) {
      handleError(err, { context: 'Login' });
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex justify-center mb-8 [&_svg]:!w-[230px] [&_svg]:!h-[89px]">
        <Logo />
      </div>

      <GoogleAuthButton />

      {/* DIVIDER */}
      <div className="relative mb-6 mt-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="glass px-3 text-muted-foreground font-medium tracking-widest rounded-full">
            Or continue with
          </span>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">

        {/* EMAIL / USERNAME */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
            Email ID / Username
          </label>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

            <input
              type="text"
              disabled={loading || form.formState.isSubmitting}
              className='w-full h-12 pl-11 pr-4 border border-border rounded-xl text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-logo/40 transition-all'
              placeholder="Enter your email or username"
              value={form.watch("email") || form.watch("username") || ""}
              onChange={(e) => {
                const value = e.target.value;

                if (value.includes('@')) {
                  form.setValue('email', value, { shouldValidate: true });
                  form.setValue('username', undefined, { shouldValidate: false });
                } else {
                  form.setValue('username', value, { shouldValidate: true });
                  form.setValue('email', undefined, { shouldValidate: false });
                }
              }}
            />
          </div>

          <AnimatePresence mode="wait">
            {(emailError || form.formState.errors.email || form.formState.errors.username) && (
              <p className="text-xs text-red-400">
                {emailError ||
                  form.formState.errors.email?.message ||
                  form.formState.errors.username?.message}
              </p>
            )}
          </AnimatePresence>
        </div>

        {/* PASSWORD */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
              Password
            </label>

            <button
              type="button"
              className="text-[10px] font-bold text-slate-500 hover:text-[#CCFF00]"
              onClick={() => router.push('/forgot-password')}
            >
              Forgot Password?
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

            <input
              type={showPassword ? "text" : "password"}
              {...form.register('password')}
              disabled={loading || form.formState.isSubmitting}
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              placeholder="Enter your password"
              className="w-full h-12 pl-11 pr-10 border border-border rounded-xl text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-logo/40 transition-all"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-foreground/50 hover:text-secondary-foregorund"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {form.formState.errors.password && (
            <motion.p className="text-xs text-red-400">
              {form.formState.errors.password.message}
            </motion.p>
          )}
        </div>

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={
            loading ||
            form.formState.isSubmitting ||
            (!form.watch("email") && !form.watch("username")) ||
            !form.watch("password")
          }
          className="w-full h-14 bg-[#CCFF00] hover:bg-[#D9FF33] text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading || form.formState.isSubmitting ? (
            <>
              <BruteForceLoader size="sm" />
              <span className="text-sm">Logging in...</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              Log In
            </>
          )}
        </button>

      </form>
    </div>
  );
}