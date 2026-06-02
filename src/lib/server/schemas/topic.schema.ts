import { z } from "zod";

/**
 * Question Type enum for assignments
 */
export const QuestionTypeEnum = z.enum(["HOMEWORK", "CLASSWORK"]);

/**
 * Create Topic Schema
 * POST /api/admin/topics
 */
export const createTopicSchema = z.object({
  topic_name: z.string().min(1, "Topic name is required").max(150),
  photo: z.any().optional(),
});

/**
 * Update Topic Schema
 * PUT /api/admin/topics/:slug
 */
export const updateTopicSchema = z.object({
  topic_name: z.string().min(1, "Topic name is required").max(150).optional(),
  photo: z.any().optional(),
  removePhoto: z.boolean().optional(),
});

/**
 * Create Class Schema
 * POST /api/admin/topics/:topicSlug/classes
 */
export const createClassSchema = z.object({
  class_name: z.string().min(1, "Class name is required").max(50),
  duration_minutes: z.coerce.number().int().min(1).optional(),
  description: z.string().max(2000).optional(),
  pdf_url: z.string().url("Invalid PDF URL").optional().or(z.literal('')),
});

/**
 * Update Class Schema
 * PUT /api/admin/classes/:id
 */
export const updateClassSchema = z.object({
  class_name: z.string().min(1, "Class name is required").max(50).optional(),
  duration_minutes: z.coerce.number().int().min(1).optional(),
  description: z.string().max(2000).optional(),
  pdf_url: z.string().url("Invalid PDF URL").optional().or(z.literal('')),
});

/**
 * Assign Questions to Class Schema
 * POST /api/admin/assign-questions
 */
export const assignQuestionsSchema = z.object({
  question_ids: z.array(z.number().int().positive()).min(1, "At least one question is required"),
  class_id: z.number().int().positive("Class ID is required"),
  type: QuestionTypeEnum,
});

/**
 * Bulk Delete Classes Schema
 * POST /api/admin/:batchSlug/topics/:topicSlug/classes/bulk-delete
 * Capped at 100 — a single topic rarely holds more than a few dozen classes
 * and a tighter cap keeps the per-class S3 cleanup loop bounded.
 */
export const bulkDeleteClassesSchema = z.object({
  slugs: z
    .array(z.string().min(1))
    .min(1, "At least one class slug is required")
    .max(100, "Cannot delete more than 100 classes at once"),
});

/**
 * Bulk Remove Assigned Questions Schema
 * POST /api/admin/:batchSlug/topics/:topicSlug/classes/:classSlug/questions/bulk-delete
 */
export const bulkRemoveQuestionsFromClassSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, "At least one question ID is required")
    .max(200, "Cannot remove more than 200 questions at once"),
});

/**
 * Topic Slug Param Schema
 */
export const topicSlugParamSchema = z.object({
  topicSlug: z.string().min(1, "Topic slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
});

/**
 * Class ID Param Schema
 */
export const classIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number").transform(Number),
});

/**
 * Class Slug Param Schema
 */
export const classSlugParamSchema = z.object({
  topicSlug: z.string().min(1, "Topic slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  classSlug: z.string().min(1, "Class slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
});

// Type exports
type CreateTopicInput = z.infer<typeof createTopicSchema>;
type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
type CreateClassInput = z.infer<typeof createClassSchema>;
type UpdateClassInput = z.infer<typeof updateClassSchema>;
type AssignQuestionsInput = z.infer<typeof assignQuestionsSchema>;
