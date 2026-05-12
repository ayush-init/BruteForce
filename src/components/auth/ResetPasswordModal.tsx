"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";
import { BruteForceLoader } from '@/components/ui/BruteForceLoader';
import { Button } from "../../app/(auth)/shared/components/Button";
import { Input } from "../../app/(auth)/shared/components/Input";
import { PasswordInputWithValidation } from "../../components/ui/PasswordStrengthIndicator";
import { useResetPassword } from "../../app/(auth)/reset-password/hooks/useResetPassword";
import { useProgressivePasswordValidation } from "../../hooks/useProgressivePasswordValidation";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ResetPasswordModalContent({ isOpen, onClose }: ResetPasswordModalProps) {
  const {
    fpNewPassword,
    setFpNewPassword,
    fpConfirmPassword,
    setFpConfirmPassword,
    error,
    loading,
    handleResetPassword,
  } = useResetPassword();

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  // Progressive validation for new password
  const { isComplete: isPasswordComplete } = useProgressivePasswordValidation(fpNewPassword);

  // Check if passwords match
  const doPasswordsMatch = fpNewPassword && fpConfirmPassword && fpNewPassword === fpConfirmPassword;

  // Form validation
  const isFormValid = fpNewPassword && fpConfirmPassword && isPasswordComplete && doPasswordsMatch;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 🔥 PREMIUM BACKDROP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-login/80 backdrop-blur-md"
      />

      {/* 🔥 AMBIENT GLOW DECORATION */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-logo/5 rounded-full blur-[120px] pointer-events-none" />

      {/* 🔥 MODAL CONTAINER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="
          relative z-10 w-full max-w-[420px]
          bg-login border border-foreground/6
          rounded-[28px] overflow-hidden
          shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]
        "
      >
        {/* PREMIUM GLASS REFLECTION TOP LAYER */}
        <div className="absolute inset-0 bg-gradient-to-b from-forground/3 to-transparent pointer-events-none" />

        {/* HEADER */}
        <div className="relative px-8 pt-10 pb-6 text-center">
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-logo/10 border border-logo/20 mb-6"
          >
            <ShieldCheck className="text-logo" size={28} />
          </motion.div>

          <h2 className="text-2xl font-bold text-forground tracking-tight leading-tight">
            Reset <span className="text-primary">Password</span>
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Enter your new secure access credentials
          </p>

          <button
            onClick={() => {
              onClose();
              router.push("/login");
            }}
            className="absolute right-6 top-6 p-2 rounded-full text-slate-500  hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-8 pb-10">
          <form onSubmit={handleResetPassword} className="space-y-5">



            {/* NEW PASSWORD */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                New Password
              </label>
              <PasswordInputWithValidation
                password={fpNewPassword}
                onPasswordChange={setFpNewPassword}
                disabled={loading}
                showStrengthIndicator={true}
                showChecklist={true}
                className="space-y-2"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-2 ">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-logo">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-logo transition-colors"
                />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="•••••••"
                  value={fpConfirmPassword}
                  onChange={(e) => setFpConfirmPassword(e.target.value)}
                  disabled={loading}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  className="
                    !pl-11 w-full h-12! bg-white/[0.03] border-white/10 rounded-xl
                    focus:border-logo/40 focus:ring-4 focus:ring-logo/5
                    transition-all duration-300
                  "
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:text-forground hover:bg-forground/10 active:scale-90 transition-all"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password match indicator */}
              {fpConfirmPassword && (
                <div className={`text-xs font-medium flex items-center gap-2 ${doPasswordsMatch ? 'text-green-400' : 'text-red-400'
                  }`}>
                  {doPasswordsMatch ? (
                    <>
                      <ShieldCheck size={14} />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                variant="outline"
                className="
                  flex-1 h-12 text-foreground rounded-2xl order-2 sm:order-1 border
                  border-border hover:bg-foreground/5 hover:text-foreground 
                  transition-all duration-200 gap-2
                "
              >
                <ArrowLeft size={16} />
                Back
              </Button>

              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="
                  flex-1 h-12 rounded-xl order-1 sm:order-2
                  bg-[#CCFF00] text-black font-bold
                  hover:bg-[#d9ff33] hover:shadow-[0_0_20px_rgba(204,255,0,0.3)]
                  active:scale-[0.98] transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <BruteForceLoader size="sm" />
                    Resetting...
                  </span>
                ) : "Reset Password"}
              </Button>
            </div>
          </form>
        </div>

      </motion.div>
    </div>
  );
}

export function ResetPasswordModal(props: ResetPasswordModalProps) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0F]">
        <BruteForceLoader size="md" />
      </div>
    }>
      <ResetPasswordModalContent {...props} />
    </Suspense>
  );
}