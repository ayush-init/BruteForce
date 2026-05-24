"use client";

import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from 'lucide-react';
import { AdminStudent } from '@/types/student/index.types';

interface BulkDeleteStudentsModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
   submitting: boolean;
   selectedStudents: AdminStudent[];
}

export default function BulkDeleteStudentsModal({
   isOpen,
   onClose,
   onConfirm,
   submitting,
   selectedStudents,
}: BulkDeleteStudentsModalProps) {
   const count = selectedStudents.length;

   const handleConfirm = useCallback(() => {
      if (!submitting && count > 0) onConfirm();
   }, [submitting, count, onConfirm]);

   // Enter to confirm (matches DeleteClassModal pattern)
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (!isOpen) return;
         if (e.key === 'Enter' && !submitting && count > 0) {
            handleConfirm();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, submitting, count, handleConfirm]);

   // Show up to 5 names in the preview to avoid an absurdly tall modal on
   // large selections; remainder is summarised as "+N more".
   const previewLimit = 5;
   const preview = selectedStudents.slice(0, previewLimit);
   const overflow = count - preview.length;

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[480px] rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-6">
            <DialogHeader className="space-y-1">
               <DialogTitle className="text-xl font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Delete {count} {count === 1 ? 'Student' : 'Students'}?
               </DialogTitle>
               <DialogDescription className="text-sm text-muted-foreground">
                  This action cannot be undone. Selected students and their related data will be permanently removed.
               </DialogDescription>
            </DialogHeader>

            <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4 space-y-2 max-h-[240px] overflow-y-auto">
               {preview.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <Trash2 className="w-4 h-4 text-destructive" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                     </div>
                  </div>
               ))}
               {overflow > 0 && (
                  <p className="text-xs text-muted-foreground pt-1 pl-1">
                     …and {overflow} more
                  </p>
               )}
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-border/60 flex justify-end gap-3">
               <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-xl px-5"
               >
                  Cancel
               </Button>
               <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={submitting || count === 0}
                  className="rounded-xl px-6 shadow-sm hover:shadow-md transition"
               >
                  {submitting ? "Deleting..." : `Delete ${count}`}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
