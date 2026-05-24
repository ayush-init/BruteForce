"use client";

import React from 'react';
import Link from "next/link";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { FolderEdit, Trash2, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from '@/components/Pagination';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminStudent } from '@/types/student/index.types';

interface StudentsTableProps {
  students: AdminStudent[];
  loading: boolean;
  page: number;
  limit: number;
  totalPages: number;
  totalRecords: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  onEdit: (student: AdminStudent) => void;
  onDelete: (student: AdminStudent) => void;
  // Selection — controlled by the parent page so the bulk-delete toolbar
  // (which lives outside this component) stays in sync.
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
}

export default function StudentsTable({
  students,
  loading,
  page,
  limit,
  totalPages,
  totalRecords,
  setPage,
  setLimit,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: StudentsTableProps) {
  const selectedSet = new Set(selectedIds);
  const allOnPageSelected =
    students.length > 0 && students.every((s) => selectedSet.has(s.id));
  const someOnPageSelected =
    students.some((s) => selectedSet.has(s.id)) && !allOnPageSelected;
  // Indeterminate has to be set imperatively — React doesn't expose it as a prop.
  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someOnPageSelected;
    }
  }, [someOnPageSelected]);

  return (
    <div className="glass backdrop-blur-2xl px-3 mb-5 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          {/* HEADER */}
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border/40">
              <TableHead className="w-10">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={onToggleSelectAll}
                  disabled={loading || students.length === 0}
                  aria-label="Select all students on this page"
                  className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Username</TableHead>
              <TableHead className="text-center">Solved</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {/* BODY */}
          <TableBody>
            {loading ? (
              // Loading Skeleton Rows
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={`skeleton-${i}`} className="border-b border-border/20">
                    <TableCell>
                      <Skeleton className="w-4 h-4 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-6 w-16 mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-6">
                    <DotLottieReact src="/Empty.json" loop autoplay className="w-40 h-40" />
                    <p className="text-muted-foreground text-sm">No students found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  data-selected={selectedSet.has(student.id) ? 'true' : undefined}
                  className="border-b border-border/20 hover:bg-muted/30 transition data-[selected=true]:bg-primary/5"
                >
                  {/* SELECT */}
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(student.id)}
                      onChange={() => onToggleSelect(student.id)}
                      aria-label={`Select ${student.name}`}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </TableCell>

                  {/* STUDENT */}
                  <TableCell>
                    <Link
                      href={`/profile/${student.username}`}
                      target="_blank"
                      className="flex items-center gap-3"
                    >
                      <Avatar
                        name={student.name}
                        profileImageUrl={student.profile_image_url}
                        username={student.username}
                        size="sm"
                      />

                      <div className="flex flex-col">
                        <span className="font-medium hover:text-primary transition flex items-center gap-1">
                          {student.name}
                          <ExternalLink className="w-3 h-3 opacity-40 hover:opacity-100" />
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {student.email}
                        </span>
                      </div>
                    </Link>
                  </TableCell>

                  {/* USERNAME */}
                  <TableCell className="text-sm text-muted-foreground">
                    @{student.username}
                  </TableCell>

                  {/* SOLVED */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Award className="w-4 h-4 text-logo/70" />
                      <span className="font-semibold text-foreground">
                        {student.totalSolved || 0}
                      </span>
                    </div>
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-70 hover:opacity-100 transition">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                        className="h-8 w-8 rounded-lg hover:bg-primary/10"
                      >
                        <FolderEdit className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(student);
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="p-4 border-t border-border/40">
        <Pagination
          currentPage={page}
          totalItems={totalRecords}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          showLimitSelector={true}
          loading={loading}
        />
      </div>
    </div>
  );
}
