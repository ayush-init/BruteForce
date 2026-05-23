"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api';
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
import { Link as LinkIcon, Trash2, RotateCcw } from 'lucide-react';

interface EditClassModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   batchSlug: string;
   topicSlug: string;
   classData: any;
}

export default function EditClassModal({ isOpen, onClose, onSuccess, batchSlug, topicSlug, classData }: EditClassModalProps) {
   const [className, setClassName] = useState('');
   const [description, setDescription] = useState('');
   const [pdfUrl, setPdfUrl] = useState('');
   const [pdfFile, setPdfFile] = useState<File | null>(null);
   const [showReplaceInputs, setShowReplaceInputs] = useState(false);
   // When true, the existing PDF will be cleared on Save (no replacement).
   // Backend already supports this via the `remove_pdf=true` form field.
   const [removePdf, setRemovePdf] = useState(false);
   const [duration, setDuration] = useState('');
   const [classDate, setClassDate] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [formError, setFormError] = useState('');

   const isS3Pdf = (url: string) => {
      return url?.includes('amazonaws.com/class-pdfs/');
   };

   useEffect(() => {
      if (classData) {
         setClassName(classData.class_name);
         setDescription(classData.description || '');
         setPdfUrl('');
         setPdfFile(null);
         setDuration(classData.duration_minutes?.toString() || '');
         setClassDate(classData.class_date ? classData.class_date.substring(0, 10) : new Date().toISOString().substring(0, 10));
         setFormError('');
         setShowReplaceInputs(false);
         setRemovePdf(false);
      }
   }, [classData]);

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
         // Uploading a replacement overrides a pending "remove" intent.
         setRemovePdf(false);
         setFormError('');
      }
   };

   const handlePdfRemove = () => {
      setPdfFile(null);
      setPdfUrl('');
      setFormError('');
   };

   // "Remove existing PDF" — does NOT delete immediately. Marks intent;
   // actual deletion happens server-side on Save (backend already supports
   // remove_pdf=true on the PATCH endpoint, and handles S3 cleanup).
   const handleMarkRemoveExisting = () => {
      setRemovePdf(true);
      setShowReplaceInputs(false);
      setPdfFile(null);
      setPdfUrl('');
      setFormError('');
   };

   const handleUndoRemove = () => {
      setRemovePdf(false);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');
      setSubmitting(true);
      try {
         const formData = new FormData();
         formData.append('class_name', className);
         formData.append('description', description);
         formData.append('duration_minutes', duration);
         formData.append('class_date', classDate);

         if (pdfFile) {
            formData.append('pdf_file', pdfFile);
         } else if (pdfUrl) {
            formData.append('pdf_url', pdfUrl);
         } else if (removePdf && classData?.pdf_url) {
            // Tell the backend to clear the PDF (and clean up S3 if applicable).
            // Only send when there's actually an existing PDF to remove —
            // sending remove_pdf=true on a class with no PDF is a no-op but
            // pointless noise on the wire.
            formData.append('remove_pdf', 'true');
         }

         await apiClient.patch(`/api/admin/${batchSlug}/topics/${topicSlug}/classes/${classData.slug}`, formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         });

         onClose();
         resetForm();
         onSuccess();
      } catch (err: any) {
         // Error is handled by API client interceptor
         setFormError(err.response?.data?.error || 'Failed to update class');
      } finally {
         setSubmitting(false);
      }
   };

   const resetForm = () => {
      setClassName('');
      setDescription('');
      setPdfUrl('');
      setPdfFile(null);
      setShowReplaceInputs(false);
      setRemovePdf(false);
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
            className="w-full max-w-[calc(100%-1rem)] sm:max-w-[520px] max-h-[90vh] rounded-3xl border border-border/10 
    bg-gradient-to-br from-background via-background/95 to-background/90 
    backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col"
         >
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-border/50 bg-background/80 backdrop-blur-xl">
               <DialogHeader className="space-y-1">
                  <DialogTitle className="text-2xl sm:text-3xl font-bold text-foreground">
                     Update <span className='text-primary' >Class</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                     Modify class attributes directly.
                  </DialogDescription>
               </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-5">
               {formError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm rounded-xl">
                     {formError}
                  </div>
               )}

               <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">
                     Class Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                     value={className}
                     onChange={(e) => setClassName(e.target.value)}
                     required
                     placeholder="e.g. Intro to Arrays"
                     disabled={submitting}
                     className="w-full h-10 sm:h-11 rounded-2xl bg-muted/30 border border-border/40 
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

                  {classData?.pdf_url && !pdfFile && !pdfUrl && !removePdf && (
                     <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                           <div className="flex items-center gap-3">
                              {isS3Pdf(classData.pdf_url) ? (
                                 <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                                    <span className="text-red-500 text-xs font-bold">PDF</span>
                                 </div>
                              ) : (
                                 <LinkIcon className="w-4 h-4 text-blue-500" />
                              )}
                              <div>
                                 <p className="text-xs sm:text-sm font-medium">
                                    {isS3Pdf(classData.pdf_url) ? 'Current PDF' : 'External Link'}
                                 </p>
                                 <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    {isS3Pdf(classData.pdf_url) ? 'Stored in S3' : 'External URL'}
                                 </p>
                              </div>
                           </div>
                           <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                              <button
                                 type="button"
                                 onClick={() => window.open(classData.pdf_url, '_blank')}
                                 className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded hover:bg-blue-500/20 flex-1 sm:flex-none"
                              >
                                 View
                              </button>
                              <button
                                 type="button"
                                 onClick={() => {
                                    setShowReplaceInputs(true);
                                 }}
                                 className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 flex-1 sm:flex-none"
                              >
                                 Replace
                              </button>
                              <button
                                 type="button"
                                 onClick={handleMarkRemoveExisting}
                                 className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded hover:bg-red-500/20 flex-1 sm:flex-none flex items-center justify-center gap-1"
                              >
                                 <Trash2 className="w-3 h-3" />
                                 Remove
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Pending-removal banner: shown after admin clicks Remove
                      but BEFORE Save. The actual PDF + S3 file are only
                      deleted server-side when the form is submitted. */}
                  {removePdf && classData?.pdf_url && (
                     <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/30">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                                 <Trash2 className="w-4 h-4 text-red-500" />
                              </div>
                              <div>
                                 <p className="text-xs sm:text-sm font-medium text-red-500">
                                    PDF will be removed
                                 </p>
                                 <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    Click <span className="font-semibold">Save Changes</span> to confirm, or undo below.
                                 </p>
                              </div>
                           </div>
                           <button
                              type="button"
                              onClick={handleUndoRemove}
                              className="text-xs bg-muted/40 text-foreground px-2 py-1 rounded hover:bg-muted/60 flex items-center justify-center gap-1 w-full sm:w-auto"
                           >
                              <RotateCcw className="w-3 h-3" />
                              Undo
                           </button>
                        </div>
                     </div>
                  )}

                  {(!classData?.pdf_url || showReplaceInputs || pdfFile || pdfUrl) && !removePdf && (
                     <div className="space-y-3">
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
                              id="pdf-file-input-edit"
                              className="hidden"
                           />
                           <label
                              htmlFor="pdf-file-input-edit"
                              className="flex items-center justify-center w-full h-10 sm:h-11 rounded-2xl bg-muted/30 border border-border/40 
                        hover:bg-muted/40 cursor-pointer transition-colors"
                           >
                              <span className="text-xs sm:text-sm font-medium">
                                 Choose PDF File
                              </span>
                           </label>
                        </div>
                     </div>
                  )}

                  {pdfFile && <PdfPreview file={pdfFile} onRemove={handlePdfRemove} />}

                  {pdfUrl && !pdfFile && (
                     <div className="mt-3 p-3 bg-muted/20 rounded-xl border border-border/40">
                        <div className="flex items-center gap-3">
                           <LinkIcon className="w-4 h-4 text-blue-500" />
                           <div className="flex-1">
                              <p className="text-xs sm:text-sm font-medium">External Link</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                 {pdfUrl}
                              </p>
                           </div>
                           <button
                              type="button"
                              onClick={() => window.open(pdfUrl, '_blank')}
                              className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded hover:bg-blue-500/20"
                           >
                              Open
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </form>

            <DialogFooter className="flex-shrink-0 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 border-t border-border/50 p-4 sm:p-6 bg-background/80 backdrop-blur-xl">
               <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                     type="button"
                     onClick={handleClose}
                     disabled={submitting}
                     className="rounded-2xl px-4 sm:px-5 h-10 sm:h-11 flex-1 sm:flex-none text-secondary! bg-foreground!"
                  >
                     Cancel
                  </Button>
                  <Button
                     type="submit"
                     onClick={(e) => {
                        e.preventDefault();
                        handleSubmit(e);
                     }}
                     disabled={submitting}
                     className="rounded-2xl px-4 sm:px-6 h-10 sm:h-11 bg-primary hover:bg-primary/90
            shadow-lg shadow-primary/20 transition-all flex-1 sm:flex-none"
                  >
                     {submitting ? "Saving..." : "Save Changes"}
                  </Button>
               </div>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
