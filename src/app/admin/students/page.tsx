"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdminStore } from '@/store/adminStore';
import {
  getAdminStudents,
  createAdminStudent,
  updateAdminStudent,
  deleteAdminStudent
} from '@/services/admin.service';
import { AdminStudent } from '@/types/student/index.types';
import { ApiError } from '@/types/admin/index.types';
import { Users } from 'lucide-react';
import StudentsHeader from '@/components/admin/students/StudentsHeader';
import StudentsFilter from '@/components/admin/students/StudentsFilter';
import StudentsTable from '@/components/admin/students/StudentsTable';
import StudentsModals from '@/components/admin/students/StudentsModals';
import StudentsSkeleton from '@/components/admin/students/StudentsSkeleton';
import { createStudentSchema, updateStudentSchema, CreateStudentInput, UpdateStudentInput } from '@/schemas/student.schema';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { showSuccess } from '@/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function AdminStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBatch, isLoadingContext } = useAdminStore();

  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // URL State
  const [sSearch, setSSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Debounced values
  const debouncedSearch = useDebouncedValue(sSearch, 500);
  const debouncedPage = useDebouncedValue(page, 300);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isDownloadReportOpen, setIsDownloadReportOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);

  // Confirm-clear modal state. Triggered when an admin saves the edit form
  // with leetcode_id and/or gfg_id cleared on a student that previously had
  // them. We pause the submit, show a warning (because clearing those IDs
  // forces the student back to /onboarding on next login), and only commit
  // the change if the admin confirms.
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [pendingEditValues, setPendingEditValues] = useState<UpdateStudentInput | null>(null);
  const [clearingFields, setClearingFields] = useState<{ leetcode: boolean; gfg: boolean }>({
    leetcode: false,
    gfg: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // React Hook Form for Create
  const createForm = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      name: '',
      email: '',
      username: undefined,
      password: undefined,
      enrollment_id: '',
      batch_id: selectedBatch?.id || 0,
      leetcode_id: '',
      gfg_id: '',
    },
  });

  // React Hook Form for Edit
  const editForm = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: {
      name: '',
      email: '',
      username: undefined,
      enrollment_id: '',
      leetcode_id: '',
      gfg_id: '',
    },
  });

  // Pagination
  const [limit, setLimit] = useState(10);
  const debouncedLimit = useDebouncedValue(limit, 300);

  // Refs for preventing double API calls
  const isFetchingStudents = useRef(false);
  const lastFetchStudentsParams = useRef<{ batchSlug?: string; page: number; limit: number; search: string }>({
    page: 1,
    limit: 10,
    search: ''
  });
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (page > 1) params.set('page', page.toString());
    router.replace(`/admin/students?${params.toString()}`);
  }, [debouncedSearch, page, router]);

  const fetchStudents = useCallback(async () => {
    if (!selectedBatch) return;

    // Skip if already fetching
    if (isFetchingStudents.current) {
      return;
    }

    // Check if same params were already used
    const currentParams = { batchSlug: selectedBatch.slug, page: debouncedPage, limit: debouncedLimit, search: debouncedSearch };
    const sameParams =
      lastFetchStudentsParams.current.batchSlug === selectedBatch.slug &&
      lastFetchStudentsParams.current.page === debouncedPage &&
      lastFetchStudentsParams.current.limit === debouncedLimit &&
      lastFetchStudentsParams.current.search === debouncedSearch;

    if (sameParams) {
      return;
    }

    isFetchingStudents.current = true;
    lastFetchStudentsParams.current = currentParams;
    setLoading(true);
    try {
      const p: { page: number; limit: number; batchSlug: string; search?: string } = { page: debouncedPage, limit: debouncedLimit, batchSlug: selectedBatch.slug };
      if (debouncedSearch) p.search = debouncedSearch;

      const res = await getAdminStudents(p);
      setStudents(res.students);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err) {
      // Error is handled by API client interceptor
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
      isFetchingStudents.current = false;
    }
  }, [debouncedSearch, debouncedPage, debouncedLimit, selectedBatch]);

  useEffect(() => {
    updateUrl();
    if (!isLoadingContext) {
      fetchStudents();
    }
  }, [updateUrl, fetchStudents, isLoadingContext]);

  // Whenever context changes, naturally reset pagination
  useEffect(() => {
    setPage(1);
  }, [selectedBatch?.id]);

  // Form Handlers with Zod validation
  const handleCreateSubmit = async (values: CreateStudentInput) => {
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        batch_id: selectedBatch?.id,
        password: values.password || undefined,
        leetcode_id: values.leetcode_id || undefined,
        gfg_id: values.gfg_id || undefined,
      };
      await createAdminStudent(payload);
      showSuccess('Student Added', `${values.name} was added to the batch.`);
      setIsCreateOpen(false);
      resetForms();
      lastFetchStudentsParams.current = { page: 0, limit: 0, search: '' };
      fetchStudents();
    } catch (err: unknown) {
      // Error is handled by API client interceptor (shows error toast).
    } finally {
      setSubmitting(false);
    }
  };

  // Actual edit commit — separated so it can be called from both the normal
  // submit path AND from the confirm-clear dialog after the admin confirms.
  const commitEdit = async (values: UpdateStudentInput) => {
    if (!selectedStudent) return;
    setFormError('');
    setSubmitting(true);
    try {
      // Important: distinguish three cases for LeetCode/GFG IDs:
      //   - field undefined   → user didn't touch it       → send undefined (Prisma skips)
      //   - field is ""       → user explicitly cleared it → send null     (Prisma sets NULL)
      //   - field has content → user set/edited            → send the value
      //
      // The previous `values.leetcode_id || undefined` collapsed empty
      // strings to undefined, which Prisma treats as "skip this column".
      // That meant clearing an ID silently no-op'd on the database —
      // exactly the bug we hit. Use the helper below to preserve the
      // admin's explicit clear intent.
      const normalizeOptionalId = (raw: string | undefined | null) => {
        if (raw === undefined) return undefined;
        const trimmed = (raw ?? '').trim();
        return trimmed === '' ? null : trimmed;
      };

      const payload = {
        ...values,
        leetcode_id: normalizeOptionalId(values.leetcode_id),
        gfg_id: normalizeOptionalId(values.gfg_id),
      } as UpdateStudentInput;
      await updateAdminStudent(selectedStudent.id, payload);
      showSuccess('Student Updated', `${values.name || selectedStudent.name}'s details were saved.`);
      setIsEditOpen(false);
      setIsConfirmClearOpen(false);
      setPendingEditValues(null);
      resetForms();
      lastFetchStudentsParams.current = { page: 0, limit: 0, search: '' };
      fetchStudents();
    } catch (err: unknown) {
      // Error is handled by API client interceptor (shows error toast).
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: UpdateStudentInput) => {
    if (!selectedStudent) return;

    // Detect "clearing" intent: a field that previously had a value is
    // being saved as empty/undefined. Only LeetCode and GFG IDs are gated
    // by the confirm dialog because removing them forces the student back
    // to onboarding on next login — non-obvious consequence the admin
    // should knowingly accept.
    const clearingLeetcode =
      !!selectedStudent.leetcode_id &&
      (!values.leetcode_id || values.leetcode_id.trim() === '');
    const clearingGfg =
      !!selectedStudent.gfg_id &&
      (!values.gfg_id || values.gfg_id.trim() === '');

    if (clearingLeetcode || clearingGfg) {
      setPendingEditValues(values);
      setClearingFields({ leetcode: clearingLeetcode, gfg: clearingGfg });
      setIsConfirmClearOpen(true);
      return;
    }

    await commitEdit(values);
  };

  const handleConfirmClear = () => {
    if (pendingEditValues) {
      void commitEdit(pendingEditValues);
    }
  };

  const handleCancelClear = () => {
    setIsConfirmClearOpen(false);
    setPendingEditValues(null);
    setClearingFields({ leetcode: false, gfg: false });
  };

  const handleDeleteSubmit = async () => {
    if (!selectedStudent) return;
    setFormError(''); setSubmitting(true);
    try {
      await deleteAdminStudent(selectedStudent.id);
      showSuccess('Student Deleted', `${selectedStudent.name} was removed.`);
      setIsDeleteOpen(false);
      resetForms();
      lastFetchStudentsParams.current = { page: 0, limit: 0, search: '' }; // Reset to force refetch
      fetchStudents();
    } catch (err: unknown) {
      // Error is handled by API client interceptor (shows error toast).
    } finally {
      setSubmitting(false);
    }
  };

  const resetForms = () => {
    createForm.reset({
      name: '',
      email: '',
      username: undefined,
      password: undefined,
      enrollment_id: '',
      batch_id: selectedBatch?.id || 0,
      leetcode_id: '',
      gfg_id: '',
    });
    editForm.reset({
      name: '',
      email: '',
      username: undefined,
      enrollment_id: '',
      leetcode_id: '',
      gfg_id: '',
    });
    setFormError('');
  };

  const handleBulkUploadSuccess = (result: { success: number; failed: number }) => {
    // Show success message or refresh data
    lastFetchStudentsParams.current = { page: 0, limit: 0, search: '' }; // Reset to force refetch
    fetchStudents();
  };

  const openEdit = (s: AdminStudent) => {
    setSelectedStudent(s);
    editForm.reset({
      name: s.name,
      email: s.email,
      username: s.username || undefined,
      enrollment_id: s.enrollment_id || '',
      leetcode_id: s.leetcode_id || '',
      gfg_id: s.gfg_id || '',
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const openDelete = (s: AdminStudent) => {
    setSelectedStudent(s);
    setIsDeleteOpen(true);
  };

  if (isLoadingContext) return <StudentsSkeleton />;

  if (!selectedBatch) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl">
        <Users className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Batch Context</h3>
        <p className="text-muted-foreground text-sm max-w-sm">Please select a Batch to view its enrolled students.</p>
      </div>
    );
  }

  return (
     <div className="flex flex-col mx-auto max-w-[1400px] w-full px-4 sm:px-6 lg:px-8 pb-12">
      <StudentsHeader totalRecords={totalRecords} selectedBatch={selectedBatch} />
      
      <StudentsFilter
        sSearch={sSearch}
        setSSearch={setSSearch}
        setIsCreateOpen={setIsCreateOpen}
        setIsBulkUploadOpen={setIsBulkUploadOpen}
        setIsDownloadReportOpen={setIsDownloadReportOpen}
        resetForms={resetForms}
        setPage={setPage}
      />

      <StudentsTable
        students={students}
        loading={loading}
        page={page}
        limit={limit}
        totalPages={totalPages}
        totalRecords={totalRecords}
        setPage={setPage}
        setLimit={setLimit}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <StudentsModals
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        isEditOpen={isEditOpen}
        setIsEditOpen={setIsEditOpen}
        isDeleteOpen={isDeleteOpen}
        setIsDeleteOpen={setIsDeleteOpen}
        isBulkUploadOpen={isBulkUploadOpen}
        setIsBulkUploadOpen={setIsBulkUploadOpen}
        isDownloadReportOpen={isDownloadReportOpen}
        setIsDownloadReportOpen={setIsDownloadReportOpen}
        selectedStudent={selectedStudent}
        formError={formError}
        setFormError={setFormError}
        submitting={submitting}
        createForm={createForm}
        editForm={editForm}
        handleCreateSubmit={handleCreateSubmit}
        handleEditSubmit={handleEditSubmit}
        handleDeleteSubmit={handleDeleteSubmit}
        handleBulkUploadSuccess={handleBulkUploadSuccess}
        selectedBatch={selectedBatch}
      />

      {/*
        Confirm-clear dialog. Fires only when the admin's edit-form save
        would blank out a previously-set LeetCode or GFG ID. Reminds the
        admin that doing so forces the student back to /onboarding on
        next login, so they can opt out (Cancel) or proceed (Yes, Remove).
      */}
      <Dialog
        open={isConfirmClearOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelClear();
        }}
      >
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 py-5 border-b border-yellow-500/20 bg-yellow-500/5">
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
              Remove platform ID?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              You're about to clear&nbsp;
              {clearingFields.leetcode && clearingFields.gfg
                ? 'the LeetCode and GFG IDs'
                : clearingFields.leetcode
                ? 'the LeetCode ID'
                : 'the GFG ID'}
              &nbsp;for <span className="font-semibold text-foreground">{selectedStudent?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-3">
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200">
              <p className="font-medium mb-1">What will happen:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-200/90">
                <li>The student's progress sync from that platform will stop.</li>
                <li>
                  On their next login they'll be redirected to the
                  onboarding flow to re-enter the missing ID
                  {clearingFields.leetcode && clearingFields.gfg ? 's' : ''}.
                </li>
                <li>Their existing solved-problem history stays intact.</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              If this was a mistake (e.g. you only meant to fix a typo), pick&nbsp;
              <span className="font-semibold">Cancel</span> and type the corrected ID instead.
            </p>
          </div>

          <DialogFooter className="border-t border-border/40 px-6 py-4 flex gap-2">
            <Button
              type="button"
              onClick={handleCancelClear}
              disabled={submitting}
              className="h-10 flex-1 sm:flex-none text-secondary! bg-secondary-foreground!"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmClear}
              disabled={submitting}
              className="h-10 flex-1 sm:flex-none font-semibold bg-yellow-500 text-black hover:bg-yellow-400 transition-all"
            >
              {submitting ? 'Removing...' : 'Yes, Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


