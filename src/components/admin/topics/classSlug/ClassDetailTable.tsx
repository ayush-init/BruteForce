"use client";

import React from 'react';
import { Trash2, ExternalLink, Pencil } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { LeetCodeIcon, GeeksforGeeksIcon } from '@/components/platform/PlatformIcons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassDetailTableProps } from '@/types/admin/classDetail.types';

function BadgeByLevel({ level }: { level: string }) {
   return <span className="px-2 py-0.5 rounded text-xs font-semibold text-muted-foreground">{level}</span>;
}

// Pulls the canonical question id out of an assigned-question row.
// Server returns either { question: {...}, ... } (newer) or the question
// inline (older). Both shapes carry `.id` so a single accessor works for
// both — typing it as `ClassAssignedQuestion` is enough because that
// interface admits both keys via the optional question field.
const getQuestionId = (row: import('@/types/admin/classDetail.types').ClassAssignedQuestion): number =>
   row.question?.id ?? row.id;

export default function ClassDetailTable({
   assignedQuestions,
   loading,
   onEditType,
   onRemoveQuestion,
   selectedIds,
   onToggleSelect,
   onToggleSelectAll,
}: ClassDetailTableProps) {
   const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
   const visibleIds = assignedQuestions.map(getQuestionId);
   const visibleCount = visibleIds.length;
   const selectedVisibleCount = visibleIds.filter((id) => selectedSet.has(id)).length;
   const allOnPageSelected = visibleCount > 0 && selectedVisibleCount === visibleCount;
   const someOnPageSelected = selectedVisibleCount > 0 && !allOnPageSelected;

   return (
      <div className="p-2 mb-5 rounded-2xl glass bg-linear-to-br from-background/80 to-background/40 backdrop-blur-3xl shadow-sm overflow-hidden">

         <div className="overflow-x-auto">
            <Table className="border-separate border-spacing-y-2">

               {/* HEADER */}
               <TableHeader>
                  <TableRow className="border-0">
                     <TableHead className="w-10 pl-3">
                        <Checkbox
                           checked={allOnPageSelected}
                           indeterminate={someOnPageSelected}
                           onChange={onToggleSelectAll}
                           disabled={loading || visibleCount === 0}
                           aria-label="Select all questions on this page"
                        />
                     </TableHead>
                     <TableHead className="text-muted-foreground font-medium text-xs tracking-wide">
                        Question Name
                     </TableHead>
                     <TableHead className="text-muted-foreground font-medium text-xs">
                        Platform
                     </TableHead>
                     <TableHead className="text-muted-foreground font-medium text-xs">
                        Difficulty
                     </TableHead>
                     <TableHead className="text-muted-foreground font-medium text-xs">
                        Type
                     </TableHead>
                     <TableHead className="text-muted-foreground font-medium text-xs">
                        Assigned Date
                     </TableHead>
                     <TableHead className="text-right text-muted-foreground font-medium text-xs">
                        Actions
                     </TableHead>
                  </TableRow>
               </TableHeader>

               {/* BODY */}
               <TableBody>
                  {loading ? (
                     // Loading Skeleton Rows
                     <>
                        {[1, 2, 3, 4, 5].map((i) => (
                           <TableRow key={`skeleton-${i}`} className="border-0">
                              <TableCell className="pl-3">
                                 <Skeleton className="w-[18px] h-[18px] rounded-md" />
                              </TableCell>
                              <TableCell className="py-3">
                                 <Skeleton className="h-5 w-48" />
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <Skeleton className="w-4 h-4" />
                                    <Skeleton className="h-4 w-20" />
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <Skeleton className="h-6 w-16" />
                              </TableCell>
                              <TableCell>
                                 <Skeleton className="h-6 w-20" />
                              </TableCell>
                              <TableCell>
                                 <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell className="text-right">
                                 <div className="flex items-center justify-end gap-1">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                 </div>
                              </TableCell>
                           </TableRow>
                        ))}
                     </>
                  ) : assignedQuestions.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={7} className="p-0 border-0 h-48">
                           <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground glass backdrop-blur-sm rounded-2xl p-10 m-4">
                              <DotLottieReact src="/Empty.json" loop autoplay className="w-40 h-40" />
                              <div className="font-semibold text-foreground mb-1">No questions found</div>
                              <div className="text-[13px]">No questions assigned to this class yet.</div>
                           </div>
                        </TableCell>
                     </TableRow>
                  ) : (
                     assignedQuestions.map((qObj: any) => {
                        const q = qObj.question || qObj;
                        const isSelected = selectedSet.has(q.id);

                        return (
                           <TableRow
                              key={q.id}
                              data-selected={isSelected ? 'true' : undefined}
                              className="hover:bg-accent/80 px-2 transition-all duration-200 data-[selected=true]:bg-primary/5"
                           >
                              <TableCell className="pl-3">
                                 <Checkbox
                                    checked={isSelected}
                                    onChange={() => onToggleSelect(q.id)}
                                    aria-label={`Select ${q.question_name}`}
                                 />
                              </TableCell>

                              {/* QUESTION */}
                              <TableCell className=" py-3">
                                 <a
                                    href={q.question_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className=" font-medium text-foreground hover:text-primary  transition-colors  flex items-center gap-1.5  "
                                 >
                                    {q.question_name}
                                    <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                                 </a>
                              </TableCell>

                              {/* PLATFORM */}
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    {q.platform?.toLowerCase().includes('leetcode') ? (
                                       <LeetCodeIcon className="w-4 h-4 text-leetcode" />
                                    ) : q.platform?.toLowerCase().includes('gfg') ? (
                                       <GeeksforGeeksIcon className="w-4 h-4 text-gfg" />
                                    ) : (
                                       <div className="w-4 h-4 bg-muted rounded" />
                                    )}
                                    <span className="text-xs font-semibold tracking-wide text-muted-foreground   py-1 rounded-full">
                                       {q.platform}
                                    </span>
                                 </div>
                              </TableCell>

                              {/* DIFFICULTY */}
                              <TableCell>
                                 <BadgeByLevel level={q.level} />
                              </TableCell>

                              {/* TYPE - from visibility */}
                              <TableCell>
                                 <button
                                    onClick={() => onEditType(qObj)}
                                    className={`text-xs px-2 py-1 rounded-full font-medium transition-colors hover:opacity-80 text-muted-foreground`}
                                 >
                                    {qObj.type === 'CLASSWORK' ? 'Classwork' : 'Homework'}
                                 </button>
                              </TableCell>

                              {/* DATE */}
                              <TableCell>
                                 <span className="text-xs text-muted-foreground">
                                    {q.created_at
                                       ? new Date(q.created_at).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                       })
                                       : 'N/A'}
                                 </span>
                              </TableCell>

                              {/* ACTION */}
                              <TableCell className="text-right rounded-r-xl">
                                 <div className="flex items-center justify-end gap-1">
                                    {/* EDIT TYPE BUTTON */}
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => onEditType(qObj)}
                                       className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                       title="Edit Type"
                                    >
                                       <Pencil className="w-4 h-4" />
                                    </Button>

                                    {/* DELETE BUTTON */}
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => onRemoveQuestion(q.id)}
                                       className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </TableCell>

                           </TableRow>
                        );
                     })
                  )}

               </TableBody>
            </Table>
         </div>
      </div>
   );
}
