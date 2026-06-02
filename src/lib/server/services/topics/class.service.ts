import slugify from "slugify";
import prisma from '@/lib/server/config/prisma';
import { ApiError } from '@/lib/server/utils/ApiError';
import { S3Service } from '@/lib/server/services/storage/s3.service';
import { CreateClassInput, UpdateClassInput, DeleteClassInput } from '@/lib/server/types/topic.types';
import { CacheInvalidation } from '@/lib/server/utils/cacheInvalidation';

export const createClassInTopicService = async ({
  batchId,
  topicSlug,
  class_name,
  description,
  pdf_url,
  pdf_file,
  duration_minutes,
  class_date,
}: CreateClassInput) => {


  if (!topicSlug) {
    throw new ApiError(400, "Invalid topic slug");
  }

  if (!class_name) {
    throw new ApiError(400, "Class name is required");
  }

  // 1 Find Topic
  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
  });


  if (!topic) {
    throw new ApiError(400, `Topic not found with slug: ${topicSlug}`);
  }

  // Handle PDF upload (either URL or file)
  let finalPdfUrl: string | null = pdf_url || null;
  let uploadedPdfKey: string | null = null;

  if (pdf_file) {
    try {
      // Get batch and topic names for meaningful URL
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { batch_name: true }
      });

      if (!batch) {
        throw new ApiError(400, "Batch not found");
      }

      // Generate meaningful filename: batch-name/topic-name/class-name.pdf
      const cleanBatchName = slugify(batch.batch_name, { lower: true, strict: true });
      const cleanTopicName = slugify(topic.topic_name, { lower: true, strict: true });
      const cleanClassName = slugify(class_name, { lower: true, strict: true });
      
      const fileName = `${cleanBatchName}/${cleanTopicName}/${cleanClassName}.pdf`;
      
      // Upload to S3 with custom folder structure
      const uploadResult = await S3Service.uploadFile(pdf_file, 'class-pdfs', fileName);
      finalPdfUrl = uploadResult.url;
      uploadedPdfKey = uploadResult.key;
      
    } catch (uploadError) {
      throw new ApiError(400, "Failed to upload PDF to S3");
    }
  }

  // 2 Check duplicate inside same topic + batch (unique across both)
  const duplicateName = await prisma.class.findFirst({
    where: {
      topic_id: topic.id,
      batch_id: batchId,
      class_name,
    },
  });

  if (duplicateName) {
    throw new ApiError(400, 
                "Class with same name already exists in this topic"
              );
  }

  // 3 Generate slug unique across topic + batch
  const baseSlug = slugify(class_name, {
    lower: true,
    strict: true,
  });

  let finalSlug = baseSlug;
  let counter = 1;

  while (
    await prisma.class.findFirst({
      where: {
        topic_id: topic.id,    // Same topic
        batch_id: batchId,     // Same batch  
        slug: finalSlug,       // Same slug
      },
    })
  ) {
    finalSlug = `${baseSlug}-${counter++}`;
  }

  // 4 Create class
  let processedDate = null;
  let processedDuration = null;
  
  if (class_date) {
    try {
      processedDate = new Date(class_date);
      
      // Validate date
      if (isNaN(processedDate.getTime())) {
        throw new ApiError(400, "Invalid date format");
      }
      
    } catch (error) {
      throw new ApiError(400, "Invalid date format. Use valid date string");
    }
  }

  // Convert duration_minutes to number if it's a string
  if (duration_minutes) {
    processedDuration = typeof duration_minutes === 'string' ? parseInt(duration_minutes, 10) : duration_minutes;
    if (isNaN(processedDuration)) {
      throw new ApiError(400, "Invalid duration value");
    }
  }

  try {
    const newClass = await prisma.class.create({
      data: {
        class_name,
        slug: finalSlug,
        description,
        pdf_url: finalPdfUrl,
        duration_minutes: processedDuration,
        class_date: processedDate,
        topic_id: topic.id,
        batch_id: batchId,
      },
    });

    // Invalidate batch caches related to class syllabus/topics
    await CacheInvalidation.invalidateTopicsForBatch(batchId);
    await CacheInvalidation.invalidateTopicOverviewsForBatch(batchId);
    await CacheInvalidation.invalidateClassProgressForBatch(batchId);

    return newClass;
  } catch (dbError: any) {
    // If database creation fails, clean up uploaded PDF
    if (uploadedPdfKey) {
      try {
        await S3Service.deleteFile(uploadedPdfKey);
      } catch (cleanupError) {
        console.error("Failed to cleanup PDF after database error:", cleanupError);
      }
    }

    if (dbError.code === "P2002") {
      throw new ApiError(400, "Class with this name already exists in this topic");
    }

    throw new ApiError(400, "Failed to create class");
  }
};

export const updateClassService = async ({
  batchId,
  topicSlug,
  classSlug,
  class_name,
  description,
  pdf_url,
  pdf_file,
  remove_pdf,
  duration_minutes,
  class_date,
}: UpdateClassInput) => {

  if (!classSlug) {
    throw new ApiError(400, "Invalid class slug");
  }

  if (!topicSlug) {
    throw new ApiError(400, "Invalid topic slug");
  }

  // Find topic first
  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
  });

  if (!topic) {
    throw new ApiError(400, "Topic not found");
  }

  const existingClass = await prisma.class.findFirst({
    where: {
      slug: classSlug,
      batch_id: batchId,
      topic_id: topic.id,
    },
  });

  if (!existingClass) {
    throw new ApiError(400, "Class not found in this topic and batch");
  }

  // Handle PDF operations (upload, delete, or update)
  let finalPdfUrl: string | null = existingClass.pdf_url;
  let uploadedPdfKey: string | null = null;
  let oldPdfKeyToDelete: string | null = null;

  // Check if existing PDF is from S3
  const isExistingS3Pdf = existingClass.pdf_url?.includes('amazonaws.com/class-pdfs/');
  
  if (remove_pdf && existingClass.pdf_url) {
    // Remove PDF entirely
    if (isExistingS3Pdf) {
      // Extract key from S3 URL for deletion
      const urlParts = existingClass.pdf_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      oldPdfKeyToDelete = `class-pdfs/${fileName}`;
    }
    finalPdfUrl = null;
  } else if (pdf_file) {
    // Upload new PDF
    try {
      // Get batch and topic names for meaningful URL
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { batch_name: true }
      });

      if (!batch) {
        throw new ApiError(400, "Batch not found");
      }

      // Generate meaningful filename
      const cleanBatchName = slugify(batch.batch_name, { lower: true, strict: true });
      const cleanTopicName = slugify(topic.topic_name, { lower: true, strict: true });
      const cleanClassName = slugify(class_name || existingClass.class_name, { lower: true, strict: true });
      
      const fileName = `${cleanBatchName}/${cleanTopicName}/${cleanClassName}.pdf`;
      
      // Upload new PDF to S3
      const uploadResult = await S3Service.uploadFile(pdf_file, 'class-pdfs', fileName);
      finalPdfUrl = uploadResult.url;
      uploadedPdfKey = uploadResult.key;
      
      // Mark old S3 PDF for deletion if it exists
      if (isExistingS3Pdf && existingClass.pdf_url) {
        const urlParts = existingClass.pdf_url.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        oldPdfKeyToDelete = `class-pdfs/${oldFileName}`;
      }
      
    } catch (uploadError) {
      throw new ApiError(400, "Failed to upload PDF to S3");
    }
  } else if (pdf_url !== undefined) {
    // Update with new URL (not a file upload)
    finalPdfUrl = pdf_url;
  }

  const finalClassName = class_name ?? existingClass.class_name;

  // Prevent duplicate name in same topic + batch
  const duplicate = await prisma.class.findFirst({
    where: {
      topic_id: existingClass.topic_id,
      batch_id: batchId,
      class_name: finalClassName,
      NOT: { id: existingClass.id },
    },
  });

  if (duplicate) {
    throw new ApiError(400, 
                "Class with same name already exists in this topic"
              );
  }

  let newSlug = existingClass.slug;

  if (class_name) {
    const baseSlug = slugify(class_name, {
      lower: true,
      strict: true,
    });

    newSlug = baseSlug;
    let counter = 1;

    while (
      await prisma.class.findFirst({
        where: {
          batch_id: batchId,
          slug: newSlug,
          NOT: { id: existingClass.id },
        },
      })
    ) {
      newSlug = `${baseSlug}-${counter++}`;
    }
  }

  // Convert duration_minutes to number if it's a string
  let processedDuration: number | null = null;
  if (duration_minutes) {
    processedDuration = typeof duration_minutes === 'string' ? parseInt(duration_minutes, 10) : duration_minutes as number;
    if (isNaN(processedDuration)) {
      throw new ApiError(400, "Invalid duration value");
    }
  }

  try {
    const updatedClass = await prisma.class.update({
      where: { id: existingClass.id },
      data: {
        class_name: finalClassName,
        slug: newSlug,
        description: description ?? existingClass.description,
        pdf_url: finalPdfUrl,
        duration_minutes: processedDuration ?? existingClass.duration_minutes,
        class_date: class_date
          ? new Date(class_date)
          : existingClass.class_date,
      },
    });

    // Clean up old PDF from S3 if update was successful
    if (oldPdfKeyToDelete) {
      try {
        await S3Service.deleteFile(oldPdfKeyToDelete);
        } catch (cleanupError) {
        console.error("Failed to cleanup old PDF from S3:", cleanupError);
      }
    }

    // Invalidate caches
    await CacheInvalidation.invalidateTopicsForBatch(batchId);
    await CacheInvalidation.invalidateTopicOverviewsForBatch(batchId);
    await CacheInvalidation.invalidateClassProgressForBatch(batchId);

    return updatedClass;

  } catch (dbError: any) {
    // If database update fails, clean up newly uploaded PDF
    if (uploadedPdfKey) {
      try {
        await S3Service.deleteFile(uploadedPdfKey);
        } catch (cleanupError) {
        console.error("Failed to cleanup new PDF after database error:", cleanupError);
      }
    }

    throw new ApiError(400, "Failed to update class");
  }
};

/**
 * Bulk-delete classes within a single topic.
 *
 * Mirrors the single-delete rules (you can't delete a class that still has
 * assigned questions) but reports per-class outcomes so the admin can see
 * which ones were skipped and why instead of getting a single all-or-nothing
 * error. Returns:
 *   {
 *     requested: number,        // how many slugs the admin sent
 *     deleted:   number,        // how many actually got removed
 *     skipped:   { slug, reason }[]   // per-class reason for everything else
 *   }
 *
 * S3-hosted PDFs are cleaned up best-effort after the DB delete — a failed
 * S3 cleanup must not roll back the deletion, since the class row is what
 * actually matters to the admin.
 */
export const bulkDeleteClassesService = async ({
  batchId,
  topicSlug,
  slugs,
}: {
  batchId: number;
  topicSlug: string;
  slugs: string[];
}) => {
  if (!topicSlug) {
    throw new ApiError(400, "Invalid topic slug");
  }

  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
    select: { id: true },
  });

  if (!topic) {
    throw new ApiError(400, "Topic not found");
  }

  const candidates = await prisma.class.findMany({
    where: {
      slug: { in: slugs },
      batch_id: batchId,
      topic_id: topic.id,
    },
    select: {
      id: true,
      slug: true,
      pdf_url: true,
      _count: { select: { questionVisibility: true } },
    },
  });

  const skipped: Array<{ slug: string; reason: string }> = [];
  const deletable: typeof candidates = [];

  for (const slug of slugs) {
    const c = candidates.find((x) => x.slug === slug);
    if (!c) {
      skipped.push({ slug, reason: "Not found in this topic and batch" });
      continue;
    }
    if (c._count.questionVisibility > 0) {
      skipped.push({ slug, reason: "Has assigned questions" });
      continue;
    }
    deletable.push(c);
  }

  // Collect S3 keys before the DB delete so we don't lose the URLs.
  const s3Keys: string[] = [];
  for (const c of deletable) {
    if (c.pdf_url?.includes("amazonaws.com/class-pdfs/")) {
      const parts = c.pdf_url.split("/");
      s3Keys.push(`class-pdfs/${parts[parts.length - 1]}`);
    }
  }

  let deletedCount = 0;
  if (deletable.length > 0) {
    const result = await prisma.class.deleteMany({
      where: { id: { in: deletable.map((c) => c.id) } },
    });
    deletedCount = result.count;
  }

  // Best-effort S3 cleanup. A failed delete here is logged but does not
  // surface as an error — the source-of-truth (DB) is already updated.
  if (s3Keys.length > 0) {
    await Promise.all(
      s3Keys.map((k) =>
        S3Service.deleteFile(k).catch((err) =>
          console.error(`Failed to cleanup PDF ${k} from S3:`, err)
        )
      )
    );
  }

  if (deletedCount > 0) {
    await CacheInvalidation.invalidateTopicsForBatch(batchId);
    await CacheInvalidation.invalidateTopicOverviewsForBatch(batchId);
    await CacheInvalidation.invalidateClassProgressForBatch(batchId);
  }

  return {
    requested: slugs.length,
    deleted: deletedCount,
    skipped,
  };
};

export const deleteClassService = async ({
  batchId,
  topicSlug,
  classSlug,
}: DeleteClassInput) => {

  if (!topicSlug) {
    throw new ApiError(400, "Invalid topic slug");
  }

  // Find topic first
  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
  });

  if (!topic) {
    throw new ApiError(400, "Topic not found");
  }

  const existingClass = await prisma.class.findFirst({
    where: {
      slug: classSlug,
      batch_id: batchId,
      topic_id: topic.id,
    },
  });

  if (!existingClass) {
    throw new ApiError(400, "Class not found in this topic and batch");
  }

  const questionCount = await prisma.questionVisibility.count({
    where: { class_id: existingClass.id },
  });

  if (questionCount > 0) {
    throw new ApiError(400, 
                "Cannot delete class with assigned questions"
              );
  }

  // Check if PDF is from S3 and clean it up
  const isS3Pdf = existingClass.pdf_url?.includes('amazonaws.com/class-pdfs/');
  let pdfKeyToDelete: string | null = null;

  if (isS3Pdf && existingClass.pdf_url) {
    const urlParts = existingClass.pdf_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    pdfKeyToDelete = `class-pdfs/${fileName}`;
  }

  // Delete class from database
  await prisma.class.delete({
    where: { id: existingClass.id },
  });

  // Clean up PDF from S3 if it exists
  if (pdfKeyToDelete) {
    try {
      await S3Service.deleteFile(pdfKeyToDelete);
      } catch (cleanupError) {
      console.error("Failed to cleanup PDF from S3 after class deletion:", cleanupError);
    }
  }

  // Invalidate caches
  await CacheInvalidation.invalidateTopicsForBatch(batchId);
  await CacheInvalidation.invalidateTopicOverviewsForBatch(batchId);
  await CacheInvalidation.invalidateClassProgressForBatch(batchId);

  return true;
};
