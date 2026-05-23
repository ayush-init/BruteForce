/**
 * Student Service - Core student data management
 * Handles student CRUD operations, authentication, and profile updates
 * Provides database operations for student lifecycle management
 */

import prisma from '@/lib/server/config/prisma';
import bcrypt from "bcryptjs";
import { generateUsername } from '@/lib/server/utils/usernameGenerator';
import { Prisma } from "@prisma/client";
import { HTTP_STATUS } from '@/lib/server/utils/errorMapper';
import { ApiError } from '@/lib/server/utils/ApiError';
import { CacheInvalidation } from '@/lib/server/utils/cacheInvalidation';
import { StudentData, StudentUpdateData, PrismaKnownError } from '@/lib/server/types/common.types';
import type { StudentResponseData } from '@/lib/server/types/student.types';
import redis from '@/lib/server/config/redis';
import { CACHE_TTL } from '@/lib/server/config/cache.config';
import { buildCacheKey, setWithTTL, deleteByPattern, safeGet } from '@/lib/server/utils/redisUtils';

export const createStudentService = async (data: StudentData) => {
    try {

        const {
            name,
            email,
            username,
            password,
            enrollment_id,
            batch_id,
            leetcode_id,
            gfg_id
        } = data;

        // Only require name and email, username will be generated if not provided
        if (!name || !email) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Name and email are required");
        }

        // Generate username if not provided or empty
        let finalUsername = username;
        if (!finalUsername || finalUsername === "") {
            const usernameResult = await generateUsername(name, enrollment_id);
            finalUsername = usernameResult.finalUsername;
        }

        // ─── Pre-flight duplicate checks ────────────────────────────────────────
        // We do these explicitly (rather than relying on Prisma's P2002 catch)
        // so we can fetch the EXISTING student's identifying details and tell
        // the admin exactly which student already owns the conflicting value.
        // A generic "email already exists" toast forces them to go hunt for
        // the duplicate; naming the student saves them that trip.
        // The frontend mapper for these error codes has `useBackendMessage:
        // true`, so the dynamic message below is what reaches the toast.
        const emailDupe = await prisma.student.findUnique({
            where: { email },
            select: { name: true, enrollment_id: true },
        });
        if (emailDupe) {
            const detail = emailDupe.enrollment_id
                ? ` (enrollment ID: ${emailDupe.enrollment_id})`
                : '';
            throw new ApiError(
                HTTP_STATUS.CONFLICT,
                `This email is already used by "${emailDupe.name}"${detail}`,
                [],
                'EMAIL_EXISTS'
            );
        }

        const usernameDupe = await prisma.student.findUnique({
            where: { username: finalUsername },
            select: { name: true, email: true },
        });
        if (usernameDupe) {
            throw new ApiError(
                HTTP_STATUS.CONFLICT,
                `This username is already used by "${usernameDupe.name}" (${usernameDupe.email})`,
                [],
                'USERNAME_EXISTS'
            );
        }

        if (enrollment_id) {
            const enrollmentDupe = await prisma.student.findUnique({
                where: { enrollment_id },
                select: { name: true, email: true },
            });
            if (enrollmentDupe) {
                throw new ApiError(
                    HTTP_STATUS.CONFLICT,
                    `This enrollment ID is already used by "${enrollmentDupe.name}" (${enrollmentDupe.email})`,
                    [],
                    'ENROLLMENT_ID_EXISTS'
                );
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        // batch exist check karo
        const batch = await prisma.batch.findUnique({
            where: { id: batch_id },
            select: {
                id: true,
                city_id: true
            }
        });

        if (!batch) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Batch not found");
        }

        let password_hash = null;

        if (password) {
            password_hash = await bcrypt.hash(password, 10);
        }

        const student = await prisma.student.create({
            data: {
                name,
                email,
                username: finalUsername,
                password_hash,
                enrollment_id,
                batch_id,
                city_id: batch.city_id, // city automatically batch se
                leetcode_id,
                gfg_id
            }
        });

        return student;

    } catch (error: unknown) {

        // ApiError thrown by pre-flight checks above — let it bubble unchanged.
        if (error instanceof ApiError) throw error;

        if (error instanceof Prisma.PrismaClientKnownRequestError) {

            if (error.code === "P2002") {
                // Fallback for any unique field we didn't pre-flight-check
                // (e.g. google_id) or for the rare race where two concurrent
                // creates pass the pre-flight check simultaneously.
                const field = error.meta?.target as string[] | undefined;

                if (field?.includes("google_id")) {
                    throw new ApiError(
                        HTTP_STATUS.CONFLICT,
                        "Google account already linked to another student",
                        [],
                        "DUPLICATE_ENTRY"
                    );
                }

                throw new ApiError(
                    HTTP_STATUS.CONFLICT,
                    `Duplicate value${field?.length ? ` for field: ${field.join(', ')}` : ''}`,
                    [],
                    "DUPLICATE_ENTRY"
                );
            }

            if (error.code === "P2003") {
                throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid batch reference");
            }
        }

        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create student");
    }
};

export const updateStudentDetailsService = async (id: number, body: StudentUpdateData) => {
    try {

        const student = await prisma.student.findUnique({
            where: { id }
        });

        if (!student) {
            throw new ApiError(400, "Student not found");
        }

        const updateData: StudentUpdateData = { ...body };

        const updatedStudent = await prisma.student.update({
            where: { id },
            data: updateData
        });

        // Invalidate caches when student profile data changes
        await CacheInvalidation.invalidateAllLeaderboards();
        
        // Invalidate student profile cache (sweeps /me and current public profile)
        await CacheInvalidation.invalidateStudentProfile(id);
        
        // Invalidate public profile cache specifically for old username if username changed
        if (updateData.username && updateData.username !== student.username && student.username) {
          await CacheInvalidation.invalidateStudentProfile(id, student.username);
        }
        
        // Invalidate heatmap cache (pattern delete — was buggy as redis.del with glob)
        await deleteByPattern(`student:heatmap:${id}:*`);

        // If batch changed, clear batch-dependent caches
        if (updateData.batch_id && updateData.batch_id !== student.batch_id) {
          await CacheInvalidation.invalidateStudent(id);
        }

        return updatedStudent;

    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
            }
            if (error.code === "P2002") {
                throw new ApiError(HTTP_STATUS.CONFLICT, "Email, Username or Enrollment ID already exists");
            }
            if (error.code === "P2003") {
                throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid city or batch reference");
            }
        }
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update student");
    }
};

export const deleteStudentDetailsService = async (id: number) => {
    try {

        const student = await prisma.student.findUnique({
            where: { id }
        });

        if (!student) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
        }

        await prisma.student.delete({
            where: { id }
        });

        // Full cache invalidation for the deleted student
        await CacheInvalidation.invalidateStudent(id);

        return true;

    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
            }
        }
        throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete student");
    }
};

export const getCurrentStudentService = async (studentId: number): Promise<StudentResponseData> => {
  // Generate stable deterministic cache key
  const cacheKey = buildCacheKey(`student:me:${studentId}`, {});

  // 1. Try cache first
  const cached = await safeGet(cacheKey);
  if (cached) {
    return JSON.parse(cached) as StudentResponseData;
  }
  

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      username: true,
      city: {
        select: {
          id: true,
          city_name: true
        }
      },
      batch: {
        select: {
          id: true,
          batch_name: true,
          year: true
        }
      },
      email: true,
      profile_image_url: true,
      leetcode_id: true,
      gfg_id: true
    }
  });

  if (!student) {
    throw new ApiError(404, "Student not found", [], "STUDENT_NOT_FOUND");
  }

  // Cache result with optimized TTL
  const serializedResult = JSON.stringify(student);
  await setWithTTL(cacheKey, serializedResult, CACHE_TTL.studentProfile);
  

  return student;
};
