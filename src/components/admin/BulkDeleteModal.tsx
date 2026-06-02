"use client";

import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle, AlertCircle } from 'lucide-react';

export interface BulkDeleteItem {
   /** Stable key for React (any unique primitive). */
   key: string | number;
   /** Main line of the row — e.g. class name, question name. */
   primary: string;
   /** Optional secondary line — e.g. date, platform, etc. */
   secondary?: string;
   /**
    * Marks this row as un-deletable for some reason the admin needs to fix
    * first (e.g. "class has assigned questions"). Blocked items get
    * highlighted in the preview list, the confirm button is disabled while
    * any blocked items remain, and the modal exposes a "deselect blocked"
    * helper so the admin can resolve them in one click instead of going
    * back to the table and unchecking each one manually.
    */
   blocked?: boolean;
   /** One-line reason shown next to a blocked row. */
   blockReason?: string;
}

interface BulkDeleteModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
   submitting: boolean;
   /**
    * Pre-pluralised label used everywhere in the modal: {"Class","Classes"},
    * {"Question","Questions"}. We don't try to pluralise inside the
    * component — passing both keeps the copy 100% consistent with what the
    * caller wants and avoids weird edge cases ("Class"/"Classs").
    */
   subjectLabel: { singular: string; plural: string };
   items: BulkDeleteItem[];
   /**
    * One-sentence warning shown under the title. Should describe what gets
    * permanently lost (e.g. "Selected classes and their assignments will be
    * permanently removed.") — keep it specific so the admin can recognise
    * the wrong action.
    */
   warningText: string;
   /**
    * Optional confirm-button override. Default: "Delete {N}" where N counts
    * only the *deletable* items (blocked ones are excluded so the count
    * matches what will actually happen).
    */
   confirmLabel?: string;
   /**
    * If true, render the destructive color on the modal title. Defaults to
    * true.
    */
   destructive?: boolean;
   /**
    * Optional handler wired to a "Deselect blocked" footer button. Shown
    * automatically whenever the items list contains any blocked rows.
    * Without this, the admin can still see why deletion is blocked but
    * has to dismiss the modal and unselect manually.
    */
   onDeselectBlocked?: () => void;
}

/**
 * Reusable bulk-delete confirmation modal.
 *
 * Two display modes:
 *   - Normal: every item is deletable → Delete button enabled, shows
 *     {N}-count, summary copy reads as "Delete N X?".
 *   - Blocked: at least one item carries `blocked: true` → that row is
 *     surfaced with a warning style + reason, the Delete button is
 *     disabled, and (if `onDeselectBlocked` is passed) a helper button
 *     appears so the admin can drop all blockers in one click and
 *     proceed.
 *
 * Up to 5 items show in the preview; the rest collapse to "…and N more".
 * Enter confirms — matches the admin's keyboard-friendly delete flow.
 */
export default function BulkDeleteModal({
   isOpen,
   onClose,
   onConfirm,
   submitting,
   subjectLabel,
   items,
   warningText,
   confirmLabel,
   destructive = true,
   onDeselectBlocked,
}: BulkDeleteModalProps) {
   const total = items.length;
   const blockedItems = items.filter((i) => i.blocked);
   const deletableItems = items.filter((i) => !i.blocked);
   const blockedCount = blockedItems.length;
   const deletableCount = deletableItems.length;
   const hasBlocked = blockedCount > 0;

   const titleLabel = total === 1 ? subjectLabel.singular : subjectLabel.plural;
   const blockedLabel = blockedCount === 1 ? subjectLabel.singular.toLowerCase() : subjectLabel.plural.toLowerCase();

   const handleConfirm = useCallback(() => {
      if (!submitting && deletableCount > 0 && !hasBlocked) onConfirm();
   }, [submitting, deletableCount, hasBlocked, onConfirm]);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (!isOpen) return;
         if (e.key === 'Enter' && !submitting && deletableCount > 0 && !hasBlocked) {
            handleConfirm();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, submitting, deletableCount, hasBlocked, handleConfirm]);

   // Show blocked items first so they're impossible to miss. Cap the
   // preview at 5 total so the dialog height stays sane on large selections.
   const previewLimit = 5;
   const previewOrdered = [...blockedItems, ...deletableItems];
   const preview = previewOrdered.slice(0, previewLimit);
   const overflow = total - preview.length;

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[500px] rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-6">
            <DialogHeader className="space-y-1">
               <DialogTitle
                  className={`text-xl font-semibold flex items-center gap-2 ${destructive ? 'text-destructive' : 'text-foreground'}`}
               >
                  <AlertTriangle className="w-5 h-5" />
                  Delete {total} {titleLabel}?
               </DialogTitle>
               <DialogDescription className="text-sm text-muted-foreground">
                  {warningText}
               </DialogDescription>
            </DialogHeader>

            {hasBlocked && (
               // Banner uses theme tokens (muted/destructive/foreground)
               // instead of a hard-coded amber/yellow stack — those defaults
               // don't follow the user's CSS variables and the light theme
               // was getting washed-out, low-contrast text. With theme
               // tokens the colors adapt automatically between modes.
               <div className="mt-4 rounded-2xl border border-border bg-muted/50 px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div className="space-y-1">
                     <p className="text-sm font-medium text-foreground">
                        {blockedCount} {blockedLabel} can&apos;t be deleted
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Resolve the highlighted {blockedLabel} below, or remove {blockedCount === 1 ? 'it' : 'them'} from the selection to delete the rest.
                     </p>
                  </div>
               </div>
            )}

            <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 space-y-2 max-h-[260px] overflow-y-auto">
               {preview.map((item) => {
                  const blocked = !!item.blocked;
                  return (
                     <div
                        key={item.key}
                        className={`flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors ${blocked ? 'bg-background/60 border border-border ring-1 ring-destructive/15' : ''}`}
                     >
                        <div
                           className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${blocked ? 'bg-destructive/10' : 'bg-destructive/10'}`}
                        >
                           {blocked ? (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                           ) : (
                              <Trash2 className="w-4 h-4 text-destructive" />
                           )}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-sm font-medium text-foreground truncate">{item.primary}</p>
                           {blocked && item.blockReason ? (
                              <p className="text-xs text-destructive/80 truncate">
                                 {item.blockReason}
                              </p>
                           ) : item.secondary ? (
                              <p className="text-xs text-muted-foreground truncate">{item.secondary}</p>
                           ) : null}
                        </div>
                     </div>
                  );
               })}
               {overflow > 0 && (
                  <p className="text-xs text-muted-foreground pt-1 pl-1">
                     …and {overflow} more
                  </p>
               )}
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-border/60 flex flex-wrap justify-end gap-3">
               <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-2xl px-5"
               >
                  Cancel
               </Button>
               {hasBlocked && onDeselectBlocked && (
                  // Primary-tinted outline so it reads as the recommended
                  // "do this to fix" action without competing with the
                  // destructive Delete button next to it. Theme tokens so
                  // it carries across light and dark.
                  <Button
                     type="button"
                     variant="outline"
                     onClick={onDeselectBlocked}
                     disabled={submitting}
                     className="rounded-2xl px-5 border-logo/40 bg-logo/5 text-foreground hover:bg-logo/10 hover:border-logo/60"
                  >
                     Deselect blocked ({blockedCount})
                  </Button>
               )}
               <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={submitting || deletableCount === 0 || hasBlocked}
                  className="rounded-2xl px-6 shadow-sm hover:shadow-md transition"
                  title={hasBlocked ? "Resolve or deselect blocked items first" : undefined}
               >
                  {submitting
                     ? "Deleting..."
                     : (confirmLabel ?? `Delete ${deletableCount}`)}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
