"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "../../../../app/(auth)/shared/components/Input";
import { Button } from "../../../../app/(auth)/shared/components/Button";
import { useUsernameCheck } from "../hooks/useUsernameCheck";
import { CheckCircle, XCircle } from "lucide-react";
import { BruteForceLoader } from '@/components/ui/BruteForceLoader';
import { OnboardingStep1Props } from '@/types/student/index.types';

type UsernameStatus =
  | "idle"
  | "typing"
  | "available"
  | "taken"
  | "invalid"
  | "same";

export function OnboardingStep1({
  data,
  setData,
  setStep,
  onboardingUser,
}: OnboardingStep1Props) {
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameStatus>("idle");

  const [debouncedUsername, setDebouncedUsername] = useState("");

  const { mutate: checkUsername, isPending } = useUsernameCheck();

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedUsernameRef = useRef<string>("");

  const existingUsername =
    onboardingUser?.username || data.username || "";

  //  FIX 1: INITIAL STATE SET ON LOAD
  useEffect(() => {
    if (existingUsername && existingUsername.trim().length >= 3) {
      setUsernameStatus("same");
      setDebouncedUsername(existingUsername.trim()); // important
    }
  }, [existingUsername]);

  //  MAIN VALIDATION EFFECT
  useEffect(() => {
    const username = debouncedUsername.trim();
    const original = existingUsername.trim();

    if (username.length === 0) {
      setUsernameStatus("idle");
      return;
    }

    // 🔥 SAME USERNAME
    if (username === original) {
      setUsernameStatus("same");
      return;
    }

    if (username.length < 3) {
      setUsernameStatus("invalid");
      return;
    }

    if (username === lastCheckedUsernameRef.current) return;

    lastCheckedUsernameRef.current = username;

    checkUsername(
      { username },
      {
        onSuccess: (res) => {
          setUsernameStatus(res.available ? "available" : "taken");
        },
        onError: () => {
          setUsernameStatus("invalid");
        },
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUsername, existingUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Lowercase + only allow a-z, 0-9, and underscore
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");

    setData({ ...data, username: value });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setUsernameStatus("idle");
    } else {
      setUsernameStatus("typing");
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedUsername(trimmed);
      debounceTimerRef.current = null;
    }, 500);
  };

  // 🔥 FIX 2: allow same username immediately
  const canProceed =
    (usernameStatus === "available" || usernameStatus === "same") &&
    data.username?.trim().length >= 3;

  const getStatusMessage = () => {
    const base = "flex items-center gap-2 text-xs font-medium";

    switch (usernameStatus) {
      case "typing":
        return (
          <div className={`${base} text-muted-foreground`}>
            {/* <BruteForceLoader size="sm" /> */}
            <span>Checking...</span>
          </div>
        );

      case "available":
        return (
          <div className={`${base} text-green-500`}>
            <CheckCircle size={14} />
            <span>Username is available</span>
          </div>
        );

      case "taken":
        return (
          <div className={`${base} text-red-500`}>
            <XCircle size={14} />
            <span>Username already taken</span>
          </div>
        );

      case "invalid":
        return (
          <div className={`${base} text-red-500`}>
            <XCircle size={14} />
            <span>Minimum 3 characters required</span>
          </div>
        );

      case "same":
        return (
          <div className={`${base} text-green-500`}>
            <CheckCircle size={14} />
            <span>Already yours</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 ">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canProceed) setStep(2);
        }}
        className="space-y-5"
      >
        <div className="space-y-2">
          {data.username?.trim() !== "" && (
            <label className="text-s font-medium text-muted-foreground">
              Username <span className="text-destructive">*</span>
            </label>
          )}

          <div className="relative">
            <Input
              type="text"
              placeholder="ayush_dev"
              value={data.username ?? ""}
              onChange={handleUsernameChange}
              required
              className="w-full !h-12 rounded-xl bg-background/70 border border-border px-4 text-sm mt-1 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all duration-200"
            />

            {(usernameStatus === "available" ||
              usernameStatus === "same") && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
            )}

            {(usernameStatus === "taken" ||
              usernameStatus === "invalid") && (
              <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
            )}

           
          </div>

          {data.username?.trim() !== "" && (
            <div className="text-xs animate-fade-in">
              {getStatusMessage()}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Only lowercase letters, numbers and <span className="font-mono">_</span> are allowed.
          </p>
        </div>

        <Button
          type="submit"
          disabled={!canProceed || isPending}
          className="w-full h-11 rounded-xl font-medium text-sm bg-primary text-primary-foreground hover:shadow-[0_0_20px_var(--hover-glow)] hover:brightness-105 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Checking..." : "Next →"}
        </Button>
      </form>
    </div>
  );
}