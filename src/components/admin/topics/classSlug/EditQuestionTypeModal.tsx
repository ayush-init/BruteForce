"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { updateQuestionVisibilityType } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogDescription,
} from "@/components/ui/dialog";
import { Home, GraduationCap } from 'lucide-react';

interface EditQuestionTypeModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   batchSlug: string;
   topicSlug: string;
   classSlug: string;
   question: any;
}

export default function EditQuestionTypeModal({ isOpen, onClose, onSuccess, batchSlug, topicSlug, classSlug, question }: EditQuestionTypeModalProps) {
   const [editType, setEditType] = useState<'HOMEWORK' | 'CLASSWORK'>('HOMEWORK');
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      if (question) {
         setEditType(question.type || 'HOMEWORK');
      }
   }, [question]);

   const handleSubmit = useCallback(async () => {
      if (!question) return;
      setSubmitting(true);
      try {
         await updateQuestionVisibilityType(
            batchSlug,
            topicSlug,
            classSlug,
            question.visibility_id || question.id,
            editType
         );
         onClose();
         onSuccess();
      } catch (err: any) {
         // Error is handled by API client interceptor
         alert(err.response?.data?.error || "Failed to update question type");
      } finally {
         setSubmitting(false);
      }
   }, [question, batchSlug, topicSlug, classSlug, editType, onClose, onSuccess]);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (!isOpen) return;
         if (e.key === 'Enter' && !submitting) {
            handleSubmit();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, submitting, handleSubmit]);

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
               <DialogTitle>Edit Question Type</DialogTitle>
               <DialogDescription>
                  Change the type for <strong>{question?.question?.question_name || question?.question_name}</strong>
               </DialogDescription>
            </DialogHeader>

            <div className="py-6">
               <div className="flex rounded-2xl border border-border overflow-hidden">
                  <button
                     onClick={() => setEditType('HOMEWORK')}
                     className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${editType === 'HOMEWORK'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                  >
                     <Home className="w-4 h-4" />
                     Homework
                  </button>
                  <button
                     onClick={() => setEditType('CLASSWORK')}
                     className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${editType === 'CLASSWORK'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                  >
                     <GraduationCap className="w-4 h-4" />
                     Classwork
                  </button>
               </div>
            </div>

            <DialogFooter>
               <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
               >
                  Cancel
               </Button>
               <Button
                  onClick={handleSubmit}
                  disabled={submitting}
               >
                  {submitting ? 'Saving...' : 'Save Changes'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
