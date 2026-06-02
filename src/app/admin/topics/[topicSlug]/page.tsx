"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminStore } from '@/store/adminStore';
import { apiClient } from '@/api';
import { bulkDeleteAdminClasses } from '@/services/admin.service';
import CreateClassModal from '@/components/admin/topics/topicSlug/CreateClassModal';
import EditClassModal from '@/components/admin/topics/topicSlug/EditClassModal';
import DeleteClassModal from '@/components/admin/topics/topicSlug/DeleteClassModal';
import DeletePdfModal from '@/components/admin/topics/topicSlug/DeletePdfModal';
import ClassHeader from '@/components/admin/topics/topicSlug/ClassHeader';
import ClassFilter from '@/components/admin/topics/topicSlug/ClassFilter';
import ClassTable from '@/components/admin/topics/topicSlug/ClassTable';
import BulkDeleteModal from '@/components/admin/BulkDeleteModal';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Trash2,
  X as XIcon,
} from 'lucide-react';
import { ClassesTableShimmer } from '@/components/admin/topics/topicSlug/ClassesTableShimmer';
import { Pagination } from '@/components/Pagination';
import { Class } from '@/types/admin/index.types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { showSuccess } from '@/ui/toast';

export default function AdminClassesPage() {
  const params = useParams();
  const topicSlug = decodeURIComponent(params.topicSlug as string);

  const { selectedBatch, isLoadingContext } = useAdminStore();
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [topicDetails, setTopicDetails] = useState<{ topic_name: string; photo_url?: string; description?: string } | null>(null);

  // Debounced values
  const debouncedSearch = useDebouncedValue(search, 500);
  const debouncedPage = useDebouncedValue(page, 300);
  const debouncedLimit = useDebouncedValue(limit, 300);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeletePdfOpen, setIsDeletePdfOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Bulk-delete selection. Tracked by slug because that's what the API uses
  // (ids would be cleaner but the route is slug-keyed and changing it would
  // ripple). Cleared on any context change so we never carry stale picks
  // across batches/topics/pages.
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const isFetching = useRef(false);
  const lastFetchParams = useRef<{ topicSlug?: string; page: number; limit: number; search: string }>({
    page: 1,
    limit: 20,
    search: ''
  });

  const router = useRouter();
  const fetchClasses = async () => {
    if (!selectedBatch) return;

    // Skip if already fetching
    if (isFetching.current) {
      return;
    }

    // Check if same params were already used
    const currentParams = { topicSlug, page: debouncedPage, limit: debouncedLimit, search: debouncedSearch };
    const sameParams =
      lastFetchParams.current.topicSlug === topicSlug &&
      lastFetchParams.current.page === debouncedPage &&
      lastFetchParams.current.limit === debouncedLimit &&
      lastFetchParams.current.search === debouncedSearch;

    if (sameParams) {
      return;
    }

    isFetching.current = true;
    lastFetchParams.current = currentParams;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: debouncedPage.toString(),
        limit: debouncedLimit.toString(),
        ...(debouncedSearch && { search: debouncedSearch })
      });
      const response = await apiClient.get(`/api/admin/${selectedBatch.slug}/topics/${topicSlug}/classes?${params}`);
      setClassesList(response.data.data || []);
      setTotalRecords(response.data.pagination?.total || 0);
      setTopicDetails(response.data.topic || null);
    } catch (err) {
      // Error is handled by API client interceptor
      console.error("Failed to fetch classes", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 when search changes
  }, [debouncedSearch]);

  useEffect(() => {
    fetchClasses();
  }, [selectedBatch, topicSlug, debouncedPage, debouncedLimit, debouncedSearch]);

  const openEdit = (cls: Class) => {
    setSelectedClass(cls);
    setIsEditOpen(true);
  };

  const openDelete = (cls: Class) => {
    setSelectedClass(cls);
    setIsDeleteOpen(true);
  };

  const openDeletePdf = () => {
    setIsDeletePdfOpen(true);
  };

  // Reset selection on any context change — the admin can't see stale
  // selections to deselect them.
  useEffect(() => {
    setSelectedSlugs([]);
  }, [selectedBatch?.id, topicSlug, debouncedSearch, debouncedPage, debouncedLimit]);

  const toggleSelect = useCallback((slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  // Select-all toggles based on whether every visible row is selected.
  // Uses the same filtered-list logic the table uses so the header
  // checkbox behaviour matches what the admin sees.
  const visibleSlugs = classesList
    .filter((c) => c.class_name.toLowerCase().includes(search.toLowerCase()))
    .map((c) => c.slug);
  const toggleSelectAll = useCallback(() => {
    setSelectedSlugs((prev) => {
      const allSelected =
        visibleSlugs.length > 0 && visibleSlugs.every((s) => prev.includes(s));
      if (allSelected) {
        const visibleSet = new Set(visibleSlugs);
        return prev.filter((s) => !visibleSet.has(s));
      }
      // Merge so selections from other filter views aren't lost.
      const next = new Set(prev);
      visibleSlugs.forEach((s) => next.add(s));
      return Array.from(next);
    });
  }, [visibleSlugs]);

  const clearSelection = useCallback(() => setSelectedSlugs([]), []);

  // A class is blocked from bulk-delete if it has any assigned questions
  // attached — same rule the server enforces. We surface this in the modal
  // up-front so the admin can resolve it before clicking Delete instead of
  // discovering a "skipped" toast after the fact.
  const isBlocked = (cls: Class) => (cls.questionCount ?? 0) > 0;

  // Items shown in the bulk-delete preview — pulled from the current page
  // because selectedSlugs can include rows scrolled out of view.
  const selectedClasses = classesList.filter((c) => selectedSlugs.includes(c.slug));
  const blockedSlugs = selectedClasses.filter(isBlocked).map((c) => c.slug);

  const handleDeselectBlocked = useCallback(() => {
    const blockedSet = new Set(blockedSlugs);
    setSelectedSlugs((prev) => prev.filter((s) => !blockedSet.has(s)));
  }, [blockedSlugs]);

  const handleBulkDeleteConfirm = async () => {
    if (selectedSlugs.length === 0 || !selectedBatch) return;
    // Belt-and-braces: the modal already disables the button when any
    // selected class is blocked, but a second guard here prevents the
    // request being sent if state is somehow out of sync.
    if (blockedSlugs.length > 0) return;
    setBulkDeleting(true);
    try {
      const { deleted, requested } = await bulkDeleteAdminClasses(
        selectedBatch.slug,
        topicSlug,
        selectedSlugs
      );
      showSuccess(
        'Bulk Delete Complete',
        deleted === requested
          ? `Removed ${deleted} ${deleted === 1 ? 'class' : 'classes'}.`
          : `Removed ${deleted} of ${requested} classes.`
      );
      setIsBulkDeleteOpen(false);
      setSelectedSlugs([]);
      lastFetchParams.current = { page: 0, limit: 0, search: '' };
      fetchClasses();
    } catch (err) {
      // Error is handled by API client interceptor (shows error toast).
    } finally {
      setBulkDeleting(false);
    }
  };


  if (isLoadingContext) {
    return <ClassesTableShimmer />;
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
    <div className="flex flex-col  w-full pb-10  -mt-4 ">

      <ClassHeader
        selectedBatch={selectedBatch}
        topicSlug={topicSlug}
        topicDetails={topicDetails}
        onAddClick={() => setIsCreateOpen(true)}
      />

      <ClassFilter
        search={search}
        onSearchChange={setSearch}
        totalRecords={totalRecords}
      />

      {/*
        Bulk-action toolbar — appears only when at least one class is
        selected. Sits between filter and table so it never competes with
        the always-on Add button up top.
      */}
      {selectedSlugs.length > 0 && (
        <div className="glass backdrop-blur-2xl mb-3 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 border border-primary/20">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary font-semibold text-xs">
              {selectedSlugs.length}
            </span>
            <span className="text-foreground font-medium">
              {selectedSlugs.length === 1 ? 'class' : 'classes'} selected
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
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <ClassTable
        classesList={classesList}
        loading={loading}
        search={search}
        topicSlug={topicSlug}
        onEdit={openEdit}
        onDelete={openDelete}
        onViewQuestions={(cls) => router.push(`/admin/topics/${topicSlug}/classes/${cls.slug}`)}
        selectedSlugs={selectedSlugs}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
      />

      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => !bulkDeleting && setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        submitting={bulkDeleting}
        subjectLabel={{ singular: 'Class', plural: 'Classes' }}
        warningText="Selected classes will be permanently removed along with any attached PDFs. Classes that still have assigned questions can't be deleted."
        onDeselectBlocked={handleDeselectBlocked}
        items={selectedClasses.map((c) => {
          const blocked = isBlocked(c);
          const qc = c.questionCount ?? 0;
          return {
            key: c.slug,
            primary: c.class_name,
            secondary: c.class_date
              ? new Date(c.class_date).toLocaleDateString()
              : undefined,
            blocked,
            blockReason: blocked
              ? `Has ${qc} assigned ${qc === 1 ? 'question' : 'questions'} — remove them first or deselect this class.`
              : undefined,
          };
        })}
      />

      {/* PAGINATION */}
      <Pagination
        currentPage={page}
        totalItems={totalRecords}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit: number) => {
          setLimit(newLimit);
          setPage(1);
        }}
        showLimitSelector={true}
        loading={loading}
      />

      <CreateClassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          lastFetchParams.current = { page: 0, limit: 0, search: '' }; // Reset to force refetch
          fetchClasses();
        }}
        batchSlug={selectedBatch!.slug}
        topicSlug={topicSlug}
      />

      <EditClassModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          lastFetchParams.current = { page: 0, limit: 0, search: '' }; // Reset to force refetch
          fetchClasses();
        }}
        batchSlug={selectedBatch!.slug}
        topicSlug={topicSlug}
        classData={selectedClass}
      />

      <DeleteClassModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={() => {
          lastFetchParams.current = { page: 0, limit: 0, search: '' }; // Reset to force refetch
          fetchClasses();
        }}
        batchSlug={selectedBatch!.slug}
        topicSlug={topicSlug}
        classData={selectedClass}
      />

      <DeletePdfModal
        isOpen={isDeletePdfOpen}
        onClose={() => {
          setIsDeletePdfOpen(false);
          setIsEditOpen(false);
        }}
        onSuccess={() => {
          setIsEditOpen(false);
          lastFetchParams.current = { page: 0, limit: 0, search: '' }; // Reset to force refetch
          fetchClasses();
        }}
        batchSlug={selectedBatch!.slug}
        topicSlug={topicSlug}
        classSlug={selectedClass?.slug || ''}
      />
    </div>
  );
}

