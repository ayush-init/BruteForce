"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api';
import { showSuccess } from '@/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PdfPreview } from '@/components/ui/PdfPreview';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogDescription,
} from "@/components/ui/dialog";

interface CreateClassModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   batchSlug: string;
   topicSlug: string;
}

export default function CreateClassModal({ isOpen, onClose, onSuccess, batchSlug, topicSlug }: CreateClassModalProps) {
   const [className, setClassName] = useState('');
   const [description, setDescription] = useState('');
   const [pdfUrl, setPdfUrl] = useState('');
   const [pdfFile, setPdfFile] = useState<File | null>(null);
   const [duration, setDuration] = useState('');
   const [classDate, setClassDate] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [formError, setFormError] = useState('');

   useEffect(() => {
      if (isOpen) {
         setClassDate(new Date().toISOString().substring(0, 10));
      }
   }, [isOpen]);

   const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         if (file.type !== 'application/pdf') {
            setFormError('Only PDF files are allowed');
            return;
         }
         if (file.size > 20 * 1024 * 1024) {
            setFormError('PDF file size must be less than 20MB');
            return;
         }
         setPdfFile(file);
         setPdfUrl('');
         setFormError('');
      }
   };

   const handlePdfRemove = () => {
      setPdfFile(null);
      setPdfUrl('');
      setFormError('');
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');
      setSubmitting(true);
      try {
         const formData = new FormData();
         formData.append('class_name', className);
         formData.append('description', description);
         formData.append('duration_minutes', duration ? duration.toString() : '');
         formData.append('class_date', classDate);

         if (pdfFile) {
            formData.append('pdf_file', pdfFile);
         } else if (pdfUrl) {
            formData.append('pdf_url', pdfUrl);
         }

         await apiClient.post(`/api/admin/${batchSlug}/topics/${topicSlug}/classes`, formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         });

         showSuccess('Class Created', 'The new class has been added to this topic.');
         onClose();
         resetForm();
         onSuccess();
      } catch (err: any) {
         // Error is handled by API client interceptor
         setFormError(err.response?.data?.error || 'Failed to create class');
      } finally {
         setSubmitting(false);
      }
   };

   const resetForm = () => {
      setClassName('');
      setDescription('');
      setPdfUrl('');
      setPdfFile(null);
      setDuration('');
      setClassDate('');
      setFormError('');
   };

   const handleClose = () => {
      resetForm();
      onClose();
   };

   return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
         <DialogContent
            className="w-full max-w-[calc(100%-1rem)]  max-h-[90vh] rounded-3xl border border-white/10 
    bg-gradient-to-br from-background via-background/95 to-background/90 
    backdrop-blur-2xl  shadow-2xl overflow-hidden flex flex-col"
         >
            <div className="flex-shrink-0  border-b border-border/50 bg-background/80 backdrop-blur-xl ">
               <DialogHeader className="space-y-1">
                  <DialogTitle className="text-3xl sm:text-2xl font-bold text-foreground">
                     Create <span className='text-primary'>Class</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                     Add a new class under <span className="font-medium text-foreground">{topicSlug}</span>
                  </DialogDescription>
               </DialogHeader>
            </div>

            <form id="create-class-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar  p-4 sm:p-6 space-y-4 sm:space-y-5 ">
               {formError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm rounded-xl">
                     {formError}
                  </div>
               )}

               <div>
                  <label className="text-xs sm:text-sm font-medium">
                     Class Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                     value={className}
                     onChange={(e) => setClassName(e.target.value)}
                     required
                     placeholder="Intro to Arrays"
                     disabled={submitting}
                     className="mt-1 w-full h-10 sm:h-11 rounded-2xl bg-muted/30 border border-border/40 
          focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition text-sm"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Description</label>
                  <RichTextEditor
                     value={description}
                     onChange={setDescription}
                     disabled={submitting}
                     placeholder="Optional details about this class."
                  />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Duration */}
                  <div className="flex flex-col gap-2 w-full">
                     <label className="text-xs sm:text-sm font-medium flex items-center gap-1">
                        Duration
                        <span className="text-[10px] sm:text-xs text-muted-foreground">(min)</span>
                        <span className="text-destructive">*</span>
                     </label>

                     <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        placeholder="90"
                        disabled={submitting}
                        className="w-full h-10 sm:h-11 rounded-xl bg-muted/30 border border-border/40 
      focus:ring-2 focus:ring-primary/40 px-4 text-sm"
                     />
                  </div>

                  {/* Date */}
                  <div className="flex flex-col gap-2 w-full">
                     <label className="text-xs sm:text-sm font-medium flex items-center gap-1">
                        Date
                        <span className="text-destructive">*</span>
                     </label>

                     <div className="relative w-full">
                        <Input
                           type="date"
                           value={classDate}
                           onChange={(e) => setClassDate(e.target.value)}
                           required
                           disabled={submitting}
                           className="w-full h-10 sm:h-11 rounded-xl bg-muted/30 border border-border/40 
        focus:ring-2 focus:ring-primary/40 px-4 pr-10 text-sm appearance-none"
                        />
                     </div>
                  </div>

               </div>

               <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">
                     PDF Content{" "}
                     <span className="text-[10px] sm:text-xs text-muted-foreground">(Optional)</span>
                  </label>

                  <div>
                     <Input
                        type="url"
                        value={pdfUrl}
                        onChange={(e) => {
                           setPdfUrl(e.target.value);
                           setPdfFile(null);
                        }}
                        placeholder="Enter PDF URL (Google Drive, etc.)"
                        disabled={submitting}
                        className="w-full h-10 sm:h-11 rounded-2xl bg-muted/30 border border-border/40 
                    focus:ring-2 focus:ring-primary/40 text-sm"
                     />
                  </div>

                  <div className="text-center">
                     <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">OR</span>
                  </div>

                  <div>
                     <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfFileChange}
                        disabled={submitting}
                        id="pdf-file-input-create"
                        className="hidden"
                     />
                     <label
                        htmlFor="pdf-file-input-create"
                        className="flex items-center justify-center w-full h-10 sm:h-11 rounded-2xl bg-muted/30 border border-border/40 
                    hover:bg-muted/40 cursor-pointer transition-colors"
                     >
                        <span className="text-xs sm:text-sm font-medium">
                           Choose PDF File
                        </span>
                     </label>
                  </div>

                  {pdfFile && <PdfPreview file={pdfFile} onRemove={handlePdfRemove} />}
               </div>
            </form>

            <DialogFooter className="flex-shrink-0 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 border-t border-border/50 p-4 sm:p-6 bg-background/80 backdrop-blur-xl">

               <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                     type="button"
                     onClick={handleClose}
                     disabled={submitting}
                     className="rounded-2xl  bg-foreground! text-secondary!"
                  >
                     Cancel
                  </Button>
                  <Button
                     form="create-class-form"
                     type="submit"
                     disabled={submitting}
                     className="rounded-xl px-4 sm:px-6 h-10 sm:h-11 bg-primary hover:bg-primary/90
            shadow-lg shadow-primary/20 transition-all flex-1 sm:flex-none"
                  >
                     {submitting ? "Creating..." : "Create Class"}
                  </Button>
               </div>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
