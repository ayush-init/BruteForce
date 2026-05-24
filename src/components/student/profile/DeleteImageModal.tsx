"use client";

import React, { useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  uploading: boolean;
}

export function DeleteImageModal({ isOpen, onClose, onConfirm, uploading }: DeleteImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter' && !uploading) {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, uploading, onConfirm]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader className='border-0!'>
          <div className="flex items-start gap-3 sm:gap-4 ">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-base sm:text-lg">Remove Profile Photo</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1">
                You can cancel this change before saving.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={onConfirm}
            disabled={uploading}
            variant="destructive"
            className="w-full sm:flex-1 h-10 sm:h-12"
          >
            {uploading ? 'Removing…' : 'Remove Photo'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full sm:flex-1 h-10 sm:h-12"
            disabled={uploading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
