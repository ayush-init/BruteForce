import { z } from "zod";

/**
 * Create Student Schema (Admin creates student)
 * POST /api/admin/students
 */
export const createStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  username: z.string().max(50).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  enrollment_id: z.string().min(1, "Enrollment ID is required"),
  batch_id: z.number().int().positive("Batch ID is required"),
  leetcode_id: z.string().optional(),
  gfg_id: z.string().optional(),
});

/**
 * Update Student Schema
 * PATCH /api/admin/students/:id
 */
export const updateStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Invalid email format").toLowerCase().trim().optional(),
  username: z.string().max(50).optional(),
  enrollment_id: z.string().optional(),
  leetcode_id: z.string().optional(),
  gfg_id: z.string().optional(),
});

/**
 * Bulk Delete Students Schema
 * POST /api/admin/students/bulk-delete
 * Capped at 500 to keep the transaction reasonable and prevent abuse.
 */
export const bulkDeleteStudentsSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, "At least one student ID is required")
    .max(500, "Cannot delete more than 500 students at once"),
});

/**
 * Update Student Profile Schema (Student updates own profile)
 * PUT /api/students/me
 */
export const updateProfileSchema = z.object({
  leetcode_id: z.string().optional(),
  gfg_id: z.string().optional(),
  github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
});

/**
 * Update Username Schema
 * PATCH /api/students/username
 */
export const updateUsernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
});

/**
 * Student ID Param Schema
 * For routes with :id param
 */
export const studentIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number").transform(Number),
});

/**
 * Student Query Schema (for listing students)
 * GET /api/admin/students
 */
export const studentQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Number(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? Number(val) : 10)),
  search: z.string().max(100).optional(),
  batch_id: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
});

// Type exports
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;
