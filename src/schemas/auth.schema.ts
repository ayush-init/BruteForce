import { z } from "zod";

/**
 * Student Registration Schema
 * For StudentRegistrationForm component
 */
export const registerStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  batch_id: z.number().int().positive("Batch is required"),
  enrollment_id: z.string().optional(),
  leetcode_id: z.string().optional(),
  gfg_id: z.string().optional(),
});

/**
 * Student Login Schema
 * For login page
 */
export const loginStudentSchema = z
  .object({
    email: z.string().email("Invalid email format").toLowerCase().trim().optional(),
    username: z.string().min(3, "Username must be at least 3 characters").max(50).toLowerCase().trim().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.email || data.username, {
    message: "Enter a valid email or username (min 3 chars)",
    path: ["email"],
  });

/**
 * Admin Login Schema
 * For admin login form
 */
export const loginAdminSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

/**
 * Forgot Password Schema
 * For forgot password form
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

/**
 * Verify OTP Schema
 * For OTP verification modal
 */
export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

/**
 * Reset Password Schema
 * For reset password modal
 */
export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Type exports
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type LoginStudentInput = z.infer<typeof loginStudentSchema>;
export type LoginAdminInput = z.infer<typeof loginAdminSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type { ResetPasswordInput as ResetPasswordFormInput };
