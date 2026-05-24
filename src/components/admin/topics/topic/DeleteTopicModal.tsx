"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { deleteAdminTopic } from '@/services/admin.service';
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
import { Topic } from '@/types/admin/topic.types';

interface DeleteTopicModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   topic: Topic | null;
}

export default function DeleteTopicModal({ isOpen, onClose, onSuccess, topic }: DeleteTopicModalProps) {
   const [submitting, setSubmitting] = useState(false);
   const [formError, setFormError] = useState('');

   const canDelete = (topic?.classCount ?? 0) === 0;

   const handleDelete = useCallback(async () => {
      setFormError('');
      setSubmitting(true);
      try {
         if (!topic) return;

         await deleteAdminTopic(topic.slug);
         onClose();
         onSuccess();
      } catch (err: any) {
         setFormError(err.response?.data?.error || err.response?.data?.message || 'This topic cannot be deleted because it is currently being used in batches or linked to global question bank.');
      } finally {
         setSubmitting(false);
      }
   }, [topic, onClose, onSuccess]);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (!isOpen) return;
         if (e.key === 'Enter' && !submitting && canDelete) {
            handleDelete();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, submitting, canDelete, handleDelete]);

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="rounded-2xl p-0 overflow-hidden shadow-xl max-w-[480px] z-50">
            <DialogHeader className="px-6 py-5 border-b border-red-500/20">
               <DialogTitle className="text-lg font-semibold text-red-400">
                  Delete Topic
               </DialogTitle>
               <DialogDescription className="text-sm text-muted-foreground">
                  Are you sure you want to delete "{topic?.topic_name}"? This action cannot be undone.
               </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6">
               <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                     <Trash2 className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-sm text-muted-foreground rounded-2xl text-center mt-4 px-6">
                     This action cannot be undone and may affect associated data.
                  </p>
               </div>

               {(topic?.classCount ?? 0) > 0 && (
                  <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-border/40">
                     <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-red-400" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-foreground">
                           {topic?.topic_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                           {topic?.classCount} classes attached
                        </p>
                     </div>
                  </div>
               )}

               {(topic?.classCount ?? 0) > 0 && (
                  <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-2xl p-4 flex gap-3">
                     <AlertTriangle className="w-5 h-5 text-yellow-400 mt-[2px]" />
                     <div className="text-sm text-yellow-400">
                        This topic cannot be deleted because it still has active classes.
                     </div>
                  </div>
               )}

               {formError && (
                  <div className="text-sm px-3 py-2 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
                     {formError}
                  </div>
               )}
            </div>

            <DialogFooter className="border-t border-border/40 px-6 py-4 flex gap-3">
               <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting || !canDelete}
                  className="h-11 w-full mb-4 font-semibold bg-red-500 hover:bg-red-600 text-white"
               >
                  {submitting ? "Deleting..." : "Delete Topic"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
