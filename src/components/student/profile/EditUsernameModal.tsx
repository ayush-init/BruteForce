"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X, CheckCircle, XCircle, User, AlertCircle, Shield } from 'lucide-react';
import { UsernameForm } from '@/types/student/index.types';
import { useUsernameCheck } from '@/components/student/onboarding/hooks/useUsernameCheck';

interface EditUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  usernameForm: UsernameForm;
  setUsernameForm: (form: UsernameForm) => void;
  handleSaveUsername: () => void;
  currentUsername?: string;
}

type UsernameStatus = "idle" | "typing" | "available" | "taken" | "invalid" | "same";

export function EditUsernameModal({
  isOpen,
  onClose,
  usernameForm,
  setUsernameForm,
  handleSaveUsername,
  currentUsername
}: EditUsernameModalProps) {
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { mutate: checkUsername, isPending } = useUsernameCheck();

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedUsernameRef = useRef<string>("");

  // SYNC FORM TO CURRENT USERNAME WHEN MODAL OPENS
  useEffect(() => {
    if (isOpen && currentUsername) {
      setUsernameForm({ username: currentUsername });
      setUsernameStatus("same");
      setDebouncedUsername(currentUsername);
      lastCheckedUsernameRef.current = currentUsername;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUsername]);

  // API CALL (after debounce) - Updated with same logic as OnboardingStep1
  useEffect(() => {
    const username = debouncedUsername.trim();
    const original = currentUsername?.trim();

    // 1️⃣ Empty
    if (username.length === 0) {
      setUsernameStatus("idle");
      return;
    }

    // 2️⃣ Same as existing username 
    if (username === original) {
      setUsernameStatus("same");
      return;
    }

    // 3️⃣ Length validation
    if (username.length < 3) {
      setUsernameStatus("invalid");
      return;
    }

    // 4️⃣ Prevent duplicate calls
    if (username === lastCheckedUsernameRef.current) return;

    lastCheckedUsernameRef.current = username;

    // 5️⃣ API CALL
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
  }, [debouncedUsername, checkUsername, currentUsername]);


  // INPUT HANDLER - Same logic as OnboardingStep1
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Lowercase + only allow a-z, 0-9, and underscore
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsernameForm({ ...usernameForm, username: value });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length > 0) {
      setUsernameStatus("typing");
    } else {
      setUsernameStatus("idle");
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedUsername(value);
      debounceTimerRef.current = null;
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSave && !isSaving) {
      e.preventDefault();
      handleSaveWithToast();
    }
  };

  const canSave = (usernameStatus === "available" || usernameStatus === "same") && usernameForm.username?.trim().length >= 3;

  // STATUS MESSAGE - Same logic as OnboardingStep1
  const getStatusMessage = () => {
    const base = "flex items-center gap-2 text-xs font-medium";

    switch (usernameStatus) {
      case "typing":
        return (
          <div className={`${base} text-muted-foreground`}>
            <span>Typing...</span>
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

  // INPUT STYLES - Same logic as OnboardingStep1
  const getInputStyles = () => {
    const base =
      "w-full border  rounded-lg bg-background transition-all duration-300";

    switch (usernameStatus) {
      case "typing":
        return `${base} border-blue-400/30 ring-2 ring-blue-400/10`;

      case "available":
        return `${base} border-green-400/40 ring-2 ring-green-400/20 shadow-md shadow-green-500/10`;

      case "taken":
      case "invalid":
        return `${base} border-red-400/40 ring-2 ring-red-400/20 shadow-md shadow-red-500/10`;

      default:
        return `${base} border-border focus:ring-2 focus:ring-primary/40`;
    }
  };

  // HANDLE SAVE
  const handleSaveWithToast = async () => {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    try {
      await handleSaveUsername();
      onClose();
    } catch (error) {
      // Error is handled by API client interceptor
    } finally {
      setIsSaving(false);
    }
  };

  // HANDLE CLOSE — restore form back to current username on close/cancel
  const handleClose = () => {
    setUsernameForm({ username: currentUsername || '' });
    setUsernameStatus(currentUsername ? 'same' : 'idle');
    setDebouncedUsername(currentUsername || '');
    onClose();
  };

  // HANDLE CANCEL — same restore behavior
  const handleCancel = () => {
    setUsernameForm({ username: currentUsername || '' });
    setUsernameStatus(currentUsername ? 'same' : 'idle');
    setDebouncedUsername(currentUsername || '');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-[calc(100%-1rem)] sm:max-w-sm overflow-hidden " showCloseButton={false}>
        <DialogHeader className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold">Edit <span className='text-primary' >Username</span></DialogTitle>
              <DialogDescription className="text-xs">Update your profile identifier</DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div >
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              Username
            </label>
            <div className="relative group">
              <Input
                type="text"
                value={usernameForm.username}
                onChange={handleUsernameChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter new username"
                className={`${getInputStyles()} group-focus-within:shadow-lg !pl-10`}
                style={{
                  height: 'var(--spacing-lg)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: 'var(--text-base)',
                  padding: '16px 20px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
              />

              {/* LEFT ICON */}
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              {/* RIGHT ICON - Same logic as OnboardingStep1 */}
              {(usernameStatus === "available" || usernameStatus === "same") && (
                <CheckCircle
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
                />
              )}

              {(usernameStatus === "taken" ||
                usernameStatus === "invalid") && (
                  <XCircle
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
                  />
                )}

            </div>

            {/* STATUS MESSAGE */}
            <div className="min-h-[20px] transition-all duration-300">
              <div key={usernameStatus} className="animate-fade-in">
                {getStatusMessage()}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Only lowercase letters, numbers and <span className="font-mono">_</span> are allowed.
            </p>


          </div>
        </div>

        <DialogFooter className="!pt-2 border-0! ">
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleSaveWithToast}
              className="flex-1"
              disabled={!canSave || isPending || isSaving}
            >
              {isSaving ? (
                <>
                  Saving...
                </>
              ) : (
                <>
                  Save
                </>
              )}
            </Button>
            <Button onClick={handleCancel} className="flex-1 bg-background! border border-border text-foreground!">
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
