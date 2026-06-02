"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore } from '@/store/adminStore';
import { apiClient } from '@/api';
import {
   removeQuestionFromClass,
   bulkRemoveQuestionsFromClass,
} from '@/services/admin.service';
import AssignQuestionsModal from '@/components/admin/topics/classSlug/AssignQuestionsModal';
import EditQuestionTypeModal from '@/components/admin/topics/classSlug/EditQuestionTypeModal';
import ClassDetailHeader from '@/components/admin/topics/classSlug/ClassDetailHeader';
import ClassDetailFilter from '@/components/admin/topics/classSlug/ClassDetailFilter';
import ClassDetailTable from '@/components/admin/topics/classSlug/ClassDetailTable';
import ClassDetailShimmer from '@/components/admin/topics/classSlug/ClassDetailShimmer';
import BulkDeleteModal from '@/components/admin/BulkDeleteModal';
import { Button } from '@/components/ui/button';
import {
   BookOpen,
   Trash2,
   X as XIcon,
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { DeleteModal } from '@/components/DeleteModal';
import { ClassAssignedQuestion, ClassDetails, ApiError } from '@/types/admin/index.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { showSuccess } from '@/ui/toast';

export default function AdminClassDetailsPage() {
   const params = useParams();
   const router = useRouter();
   const topicSlug = decodeURIComponent(params.topicSlug as string);
   const classSlug = decodeURIComponent(params.classSlug as string);

   const { selectedBatch, isLoadingContext } = useAdminStore();

   // Assigned Questions Data
   const [assignedQuestions, setAssignedQuestions] = useState<ClassAssignedQuestion[]>([]);
   const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
   const [loading, setLoading] = useState(false);
   const [search, setSearch] = useState('');
   const [assignedPage, setAssignedPage] = useState(1);
   const [assignedTotalPages, setAssignedTotalPages] = useState(1);
   const [assignedTotalCount, setAssignedTotalCount] = useState(0);
   const [limit, setLimit] = useState(10);

   // Debounced values
   const debouncedSearch = useDebouncedValue(search, 500);
   const debouncedPage = useDebouncedValue(assignedPage, 300);
   const debouncedLimit = useDebouncedValue(limit, 300);

   // Assign Modal States
   const [isAssignOpen, setIsAssignOpen] = useState(false);

   // Edit Type Modal States
   const [isEditTypeOpen, setIsEditTypeOpen] = useState(false);
   const [editingQuestion, setEditingQuestion] = useState<ClassAssignedQuestion | null>(null);

   // Delete Modal States
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [deletingQuestion, setDeletingQuestion] = useState<ClassAssignedQuestion | null>(null);
   const [submitting, setSubmitting] = useState(false);

   // Bulk-delete selection — tracked by question id so it survives row
   // reordering on refetch. Cleared on any context change.
   const [selectedIds, setSelectedIds] = useState<number[]>([]);
   const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
   const [bulkDeleting, setBulkDeleting] = useState(false);

   // Refs for preventing double API calls
   const isFetchingAssigned = useRef(false);
   const lastFetchAssignedParams = useRef<{ topicSlug?: string; classSlug?: string; page: number; limit: number; search: string }>({
      page: 1,
      limit: 10,
      search: ''
   });


   const fetchAssigned = async (page: number = 1, searchQuery: string = debouncedSearch) => {
      if (!selectedBatch) return;

      // Skip if already fetching
      if (isFetchingAssigned.current) {
         return;
      }

      // Check if same params were already used
      const currentParams = { topicSlug, classSlug, page: debouncedPage, limit: debouncedLimit, search: debouncedSearch };
      const sameParams =
         lastFetchAssignedParams.current.topicSlug === topicSlug &&
         lastFetchAssignedParams.current.classSlug === classSlug &&
         lastFetchAssignedParams.current.page === debouncedPage &&
         lastFetchAssignedParams.current.limit === debouncedLimit &&
         lastFetchAssignedParams.current.search === debouncedSearch;

      if (sameParams) {
         return;
      }

      isFetchingAssigned.current = true;
      lastFetchAssignedParams.current = currentParams;
      setLoading(true);
      try {
         const params: { page: number; limit: number; search?: string } = { page: debouncedPage, limit: debouncedLimit };
         if (debouncedSearch) params.search = debouncedSearch;

         const response = await apiClient.get(`/api/admin/${selectedBatch.slug}/topics/${topicSlug}/classes/${classSlug}/questions`, { params });
         const data = response.data;
         // Backend returns { message: "...", data: [...], pagination: {...}, classDetails: {...} }
         setAssignedQuestions(data.data || []);
         setAssignedTotalPages(data.pagination?.totalPages || 1);
         setAssignedTotalCount(data.pagination?.total || 0);
         setClassDetails(data.classDetails || null);
      } catch (err: unknown) {
         // Error is handled by API client interceptor
         console.error("Failed to fetch assigned questions", err);
         // If current deeply tracked class does not exist in active batch context, redirect out safely.
         const error = err as ApiError;
         if (error.response?.status === 400 || error.response?.status === 404) {
            router.push('/admin/topics');
         }
      } finally {
         setLoading(false);
         isFetchingAssigned.current = false;
      }
   };


   useEffect(() => {
      fetchAssigned(debouncedPage, debouncedSearch);
   }, [selectedBatch, topicSlug, classSlug, debouncedPage, debouncedSearch, debouncedLimit]);

   // Reset page to 1 when search changes
   useEffect(() => {
      if (search !== debouncedSearch) {
         setAssignedPage(1);
      }
   }, [debouncedSearch, search]);


   const handleRemoveQuestion = async (questionId: number) => {
      const questionObj = assignedQuestions.find(q => {
         const questionData = q.question || q;
         return questionData.id === questionId;
      });

      if (questionObj) {
         setDeletingQuestion(questionObj);
         setIsDeleteOpen(true);
      }
   };

   const handleConfirmDelete = async () => {
      if (!deletingQuestion) return;

      try {
         setSubmitting(true);
         const q = deletingQuestion.question || deletingQuestion;
         await removeQuestionFromClass(selectedBatch!.slug, topicSlug, classSlug, q.id);
         lastFetchAssignedParams.current = { page: 0, limit: 0, search: '', topicSlug: '', classSlug: '' }; // Reset to force refetch
         fetchAssigned();
         setIsDeleteOpen(false);
         setDeletingQuestion(null);
      } catch (err: unknown) {
         // Error is handled by API client interceptor
         const error = err as ApiError;
         alert(error.response?.data?.error || "Failed to remove question");
      } finally {
         setSubmitting(false);
      }
   };

   const handleOpenEditType = (question: any) => {
      setEditingQuestion(question);
      setIsEditTypeOpen(true);
   };

   // Reset selection on any context change.
   useEffect(() => {
      setSelectedIds([]);
   }, [selectedBatch?.id, topicSlug, classSlug, debouncedSearch, debouncedPage, debouncedLimit]);

   const toggleSelect = useCallback((id: number) => {
      setSelectedIds((prev) =>
         prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
   }, []);

   // Pull the question id off either the wrapped row or the inline shape —
   // server has historically returned both, see ClassDetailTable.
   const visibleIds = assignedQuestions.map((row) => row.question?.id ?? row.id);
   const toggleSelectAll = useCallback(() => {
      setSelectedIds((prev) => {
         const allSelected =
            visibleIds.length > 0 && visibleIds.every((id) => prev.includes(id));
         if (allSelected) {
            const visibleSet = new Set(visibleIds);
            return prev.filter((id) => !visibleSet.has(id));
         }
         const next = new Set(prev);
         visibleIds.forEach((id) => next.add(id));
         return Array.from(next);
      });
   }, [visibleIds]);

   const clearSelection = useCallback(() => setSelectedIds([]), []);

   const handleBulkDeleteConfirm = async () => {
      if (selectedIds.length === 0 || !selectedBatch) return;
      setBulkDeleting(true);
      try {
         const { deleted, requested } = await bulkRemoveQuestionsFromClass(
            selectedBatch.slug,
            topicSlug,
            classSlug,
            selectedIds
         );
         showSuccess(
            'Bulk Remove Complete',
            deleted === requested
               ? `Removed ${deleted} ${deleted === 1 ? 'question' : 'questions'} from this class.`
               : `Removed ${deleted} of ${requested} (some were already removed).`
         );
         setIsBulkDeleteOpen(false);
         setSelectedIds([]);
         lastFetchAssignedParams.current = { page: 0, limit: 0, search: '', topicSlug: '', classSlug: '' };
         fetchAssigned();
      } catch (err) {
         // Error is handled by API client interceptor.
      } finally {
         setBulkDeleting(false);
      }
   };

   const selectedQuestionRows = assignedQuestions
      .filter((row) => selectedIds.includes(row.question?.id ?? row.id));


   if (isLoadingContext || (loading && !classDetails)) {
      return <ClassDetailShimmer />;
   }

   if (!selectedBatch) {
      return (
         <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl">
            <BookOpen className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Batch Context</h3>
            <p className="text-muted-foreground text-sm max-w-sm">Please select a Global Batch from the top menu.</p>
         </div>
      );
   }

   return (
      <div className="flex flex-col mx-auto  w-full pb-12  -mt-4  ">

         {/* BACK NAVIGATION */}
         <Link
            href={`/admin/topics/${topicSlug}`}
            className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mb-6 w-fit"
         >
            <span>←</span> Back to Classes
         </Link>

         <ClassDetailHeader
            selectedBatch={selectedBatch}
            topicSlug={topicSlug}
            classSlug={classSlug}
            classDetails={classDetails}
            onAssignClick={() => setIsAssignOpen(true)}
         />

         {/* 🔥 FILTER BAR */}
         <ClassDetailFilter
            search={search}
            onSearchChange={(value) => { setSearch(value); }}
            assignedTotalCount={assignedTotalCount}
         />

         {/* Bulk-action toolbar — only when ≥1 question is selected. */}
         {selectedIds.length > 0 && (
            <div className="glass backdrop-blur-2xl mb-3 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 border border-primary/20">
               <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary font-semibold text-xs">
                     {selectedIds.length}
                  </span>
                  <span className="text-foreground font-medium">
                     {selectedIds.length === 1 ? 'question' : 'questions'} selected
                  </span>
               </div>

               <div className="flex items-center gap-2">
                  <Button
                     variant="outline"
                     onClick={clearSelection}
                     disabled={bulkDeleting}
                     className="h-9 rounded-xl px-3 text-xs border!"
                  >
                     <XIcon className="w-3.5 h-3.5 mr-1.5" />
                     Clear
                  </Button>
                  <Button
                     variant="destructive"
                     onClick={() => setIsBulkDeleteOpen(true)}
                     disabled={bulkDeleting}
                     className="h-9 rounded-xl px-4 text-xs font-semibold"
                  >
                     <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                     Remove Selected
                  </Button>
               </div>
            </div>
         )}

         {/* QUESTIONS TABLE */}
         <ClassDetailTable
            assignedQuestions={assignedQuestions}
            loading={loading}
            onEditType={handleOpenEditType}
            onRemoveQuestion={handleRemoveQuestion}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
         />

         <BulkDeleteModal
            isOpen={isBulkDeleteOpen}
            onClose={() => !bulkDeleting && setIsBulkDeleteOpen(false)}
            onConfirm={handleBulkDeleteConfirm}
            submitting={bulkDeleting}
            subjectLabel={{ singular: 'Question', plural: 'Questions' }}
            warningText="The selected questions will be detached from this class. Students will no longer see them in this class's assignments."
            confirmLabel={`Remove ${selectedIds.length}`}
            items={selectedQuestionRows.map((row) => {
               // The questions-for-class API returns the question fields
               // inline on the row (no `.question` wrapper) — the type
               // permits both shapes because older callers got wrapped
               // payloads. Cast through unknown so we can read either.
               const q = (row.question ?? row) as unknown as {
                  id: number;
                  question_name?: string;
                  platform?: string;
               };
               return {
                  key: q.id,
                  primary: q.question_name ?? 'Untitled question',
                  secondary: q.platform,
               };
            })}
         />

         {/* PAGINATION */}
         {assignedTotalCount > 0 && (
            <div >
               <Pagination
                  currentPage={assignedPage}
                  totalItems={assignedTotalCount}
                  limit={limit}
                  onPageChange={setAssignedPage}
                  onLimitChange={(newLimit: number) => {
                     setLimit(newLimit);
                     setAssignedPage(1);
                  }}
                  showLimitSelector={true}
                  loading={loading}
               />
            </div>
         )}

         <AssignQuestionsModal
            isOpen={isAssignOpen}
            onClose={() => setIsAssignOpen(false)}
            onSuccess={() => {
               lastFetchAssignedParams.current = { page: 0, limit: 0, search: '', topicSlug: '', classSlug: '' }; // Reset to force refetch
               fetchAssigned();
            }}
            batchSlug={selectedBatch!.slug}
            topicSlug={topicSlug}
            classSlug={classSlug}
            assignedQuestions={assignedQuestions}
         />

         <EditQuestionTypeModal
            isOpen={isEditTypeOpen}
            onClose={() => setIsEditTypeOpen(false)}
            onSuccess={() => {
               lastFetchAssignedParams.current = { page: 0, limit: 0, search: '', topicSlug: '', classSlug: '' }; // Reset to force refetch
               fetchAssigned();
            }}
            batchSlug={selectedBatch!.slug}
            topicSlug={topicSlug}
            classSlug={classSlug}
            question={editingQuestion}
         />

         {/* DELETE QUESTION MODAL */}
         <DeleteModal
            isOpen={isDeleteOpen}
            onClose={() => {
               setIsDeleteOpen(false);
               setDeletingQuestion(null);
            }}
            onConfirm={handleConfirmDelete}
            submitting={submitting}
            title="Remove Question"
            itemName={deletingQuestion?.question?.question_name || 'this question'}
            warningText="This will detach the question from this class. Students will no longer see this question in their class assignments."
         />
      </div>
   );
}

