"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api';
import { showSuccess } from '@/ui/toast';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
} from "@/components/ui/dialog";
import { Trash2 } from 'lucide-react';

interface DeletePdfModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   batchSlug: string;
   topicSlug: string;
   classSlug: string;
}

export default function DeletePdfModal({ isOpen, onClose, onSuccess, batchSlug, topicSlug, classSlug }: DeletePdfModalProps) {
   const [submitting, setSubmitting] = useState(false);
   const [formError, setFormError] = useState('');

   const handleDelete = useCallback(async () => {
      setFormError('');
      setSubmitting(true);
      try {
         const formData = new FormData();
         formData.append('remove_pdf', 'true');

         await apiClient.patch(`/api/admin/${batchSlug}/topics/${topicSlug}/classes/${classSlug}`, formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         });

         showSuccess('PDF Removed', 'The PDF has been removed from this class.');
         onClose();
         onSuccess();
      } catch (err: any) {
         // Error is handled by API client interceptor
         setFormError(err.response?.data?.error || 'Failed to remove PDF');
      } finally {
         setSubmitting(false);
      }
   }, [batchSlug, topicSlug, classSlug, onClose, onSuccess]);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (!isOpen) return;
         if (e.key === 'Enter' && !submitting) {
            handleDelete();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, submitting, handleDelete]);

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="text-lg font-semibold text-foreground">
                  Remove PDF
               </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
               <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto">
                  <Trash2 className="w-6 h-6 text-destructive" />
               </div>

               <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">
                     Are you sure you want to remove this PDF?
                  </p>
                  <p className="text-xs text-muted-foreground">
                     This action will remove the PDF from the class and cannot be undone.
                  </p>
               </div>

               {formError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                     {formError}
                  </div>
               )}

               <DialogFooter className="flex justify-end gap-3">
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
                     onClick={handleDelete}
                     disabled={submitting}
                     className="rounded-xl px-6 shadow-sm hover:shadow-md transition"
                  >
                     {submitting ? "Removing..." : "Remove PDF"}
                  </Button>
               </DialogFooter>
            </div>
         </DialogContent>
      </Dialog>
   );
}
