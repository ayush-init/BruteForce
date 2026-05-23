"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfiniteScrollDropdown } from "@/components/ui/InfiniteScrollDropdown";
import { AlertTriangle, Plus, Save } from "lucide-react";
import { createAdminQuestion } from "@/services/admin.service";
import { createQuestionSchema } from "@/schemas/question.schema";
import { z } from "zod";

interface CreateQuestionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateQuestion({
  open,
  onOpenChange,
  onSuccess,
}: CreateQuestionProps) {
  type FormData = z.infer<typeof createQuestionSchema>;

  // NOTE: `platform` is intentionally omitted from defaults — it's auto-detected
  // on the server from the question_link URL (leetcode.com → LEETCODE,
  // geeksforgeeks.org → GFG, anything else → OTHER). See detectPlatform()
  // in src/lib/server/services/questions/question-utils.service.ts.
  const form = useForm<FormData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      question_name: "",
      question_link: "",
      topic_id: 0,
      level: "MEDIUM",
    },
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  useEffect(() => {
    if (open) {
      form.reset({
        question_name: "",
        question_link: "",
        topic_id: 0,
        level: "MEDIUM",
      });
      setError("");
    }
  }, [open, form]);

  const handleSubmit = async (values: FormData) => {
    setLoading(true);
    setError("");

    try {
      await createAdminQuestion(values);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create question");
    } finally {
      setLoading(false);
    }
  };

  const formErrors = form.formState.errors;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-1rem)] sm:max-w-[520px] max-h-[95vh] p-0! overflow-hidden! flex flex-col rounded-2xl">

        {/* HEADER */}
        <DialogHeader className="px-6 py-5 bg-muted/30 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-1 text-xl font-semibold">

            Add <span className="text-primary" >Question</span>
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground">
            Add a new problem to the global question bank.
          </DialogDescription>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-hidden flex flex-col">

          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-hidden flex flex-col">

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">

              {/* BASIC INFO */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border/50 bg-muted/20 space-y-5">

              {/* Title */}
              <h3 className="text-sm font-semibold text-muted-foreground">
                Basic Information
              </h3>

              {/* Question Title */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">
                  Question Title
                </Label>

                <Input
                  className={`h-11 sm:h-12 w-full rounded-md border border-border/60 bg-background/60 
      focus-visible:ring-2 focus-visible:ring-logo/40 transition ${formErrors.question_name ? "border-red-500" : ""
                    }`}
                  {...form.register("question_name")}
                  placeholder="e.g. Two Sum"
                  disabled={loading}
                />

                {formErrors.question_name && (
                  <p className="text-xs text-red-400">
                    {formErrors.question_name.message}
                  </p>
                )}
              </div>

              {/* Question Link */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">
                  Question Link
                </Label>

                <Input
                  className={`h-11 sm:h-12 w-full rounded-md border border-border/60 bg-background/60 
      focus-visible:ring-2 focus-visible:ring-logo/40 transition ${formErrors.question_link ? "border-red-500" : ""
                    }`}
                  {...form.register("question_link")}
                  placeholder="https://leetcode.com/..."
                  type="url"
                  disabled={loading}
                />

                {formErrors.question_link && (
                  <p className="text-xs text-red-400">
                    {formErrors.question_link.message}
                  </p>
                )}
              </div>

            </div>

            {/* CONFIG */}
            <div className="p-5 rounded-2xl border border-border/50 bg-muted/20 space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground">
                Configuration
              </h3>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Topic
                </Label>
                <InfiniteScrollDropdown
                  value={form.watch('topic_id')?.toString() || ""}
                  onValueChange={(value) => {
                    form.setValue('topic_id', parseInt(value) || 0);
                    form.trigger('topic_id');
                  }}
                  placeholder="Select topic"
                  searchPlaceholder="Search topics..."
                  className="h-11"
                  returnId={true}
                />
                {formErrors.topic_id && (
                  <p className="text-xs text-red-400">{formErrors.topic_id.message}</p>
                )}
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Difficulty
                </Label>
                <div className="flex gap-2 bg-muted/30 p-1 rounded-2xl border border-border/50">
                  {["EASY", "MEDIUM", "HARD"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        form.setValue('level', lvl as "EASY" | "MEDIUM" | "HARD");
                        form.trigger('level');
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded transition-all ${form.watch('level') === lvl
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted"
                        }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform field intentionally removed — auto-detected on
                  the server from the question_link URL. */}
            </div>
            </div>

            {/* FOOTER */}
            <DialogFooter className="p-4 sm:p-6 mb-0 bg-background shrink-0 border-t border-border/40 flex gap-3 items-center justify-end">

              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-11 rounded hover:bg-muted"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading || !form.formState.isValid}
                className="h-11 font-semibold rounded bg-primary text-black transition-all hover:scale-[1.02] active:scale-[0.97]"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Question
                  </>
                )}
              </Button>

            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
