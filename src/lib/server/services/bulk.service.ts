import csv from "csv-parser";
import { Readable } from "stream";
import bcryptjs from "bcryptjs";
import prisma from '@/lib/server/config/prisma';
import { generateBulkUsername } from '@/lib/server/utils/usernameGenerator';



export const bulkStudentUploadService = async (

  fileBuffer: Buffer,

  { batch_id, defaultPassword }: { batch_id: number; defaultPassword: string }

) => {



  const rows: any[] = [];



  const stream = Readable.from(fileBuffer);

  // Hash once up-front — bcrypt is expensive, and every uploaded student
  // shares the same default password anyway.
  const password_hash = await bcryptjs.hash(defaultPassword, 10);



  return new Promise((resolve, reject) => {



    stream

      .pipe(csv())

      .on("data", (data) => rows.push(data))

      .on("end", async () => {



        // batch check

        const batch = await prisma.batch.findUnique({

          where: { id: batch_id },

          select: { city_id: true }

        });



        if (!batch) {

          return reject("Batch not found");

        }



        const studentsData: any[] = [];

        let skippedCount = 0;



        for (const row of rows) {



          // Validate required fields from CSV

          if (!row.name || !row.email || !row.enrollment_id) {
            // Row missing required fields — counted in skippedCount, surfaced via response
            skippedCount++;
            continue;
          }



          // Phase 1: generate unique username with retry loop (up to 10 attempts)
          const username = await generateBulkUsername(row.name, row.enrollment_id);



          studentsData.push({

            name: row.name,

            email: row.email,

            username,

            enrollment_id: row.enrollment_id,

            password_hash,

            batch_id,

            city_id: batch.city_id,

            created_at: new Date(),

            updated_at: new Date()

          });

        }



        if (studentsData.length === 0) {

          resolve({

            inserted: 0,

            totalRows: rows.length,

            skipped: skippedCount,

            message: "No valid students to upload"

          });

          return;

        }



        const created = await prisma.student.createMany({

          data: studentsData,

          skipDuplicates: true

        });



        resolve({
          inserted: created.count,
          totalRows: rows.length,
          skipped: skippedCount + (studentsData.length - created.count),
          message: `Successfully uploaded ${created.count} students`
        });

      })

      .on("error", reject);

  });

};

export const publicBulkStudentUploadService = async (
  fileBuffer: Buffer,
  { batch_id, city_id }: { batch_id: number; city_id: number }
) => {
  const rows: any[] = [];
  const stream = Readable.from(fileBuffer);
  const defaultPassword = "bruteforce@123";
  const password_hash = await bcryptjs.hash(defaultPassword, 10);

  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {
        const studentsData: any[] = [];
        let skippedCount = 0;

        for (const row of rows) {
          // Validate required fields from CSV
          if (!row.name || !row.email || !row.enrollment_id) {
            // Row missing required fields — counted in skippedCount, surfaced via response
            skippedCount++;
            continue;
          }

          // Phase 1: generate unique username with retry loop (up to 10 attempts)
          const username = await generateBulkUsername(row.name, row.enrollment_id);

          studentsData.push({
            name: row.name,
            email: row.email,
            username,
            enrollment_id: row.enrollment_id,
            leetcode_id: row.leetcode_id || null,
            gfg_id: row.gfg_id || null,
            password_hash,
            batch_id,
            city_id,
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        if (studentsData.length === 0) {
          resolve({
            inserted: 0,
            totalRows: rows.length,
            skipped: skippedCount,
            message: "No valid students to upload"
          });
          return;
        }

        const created = await prisma.student.createMany({
          data: studentsData,
          skipDuplicates: true
        });

        resolve({
          inserted: created.count,
          totalRows: rows.length,
          skipped: skippedCount + (studentsData.length - created.count),
          message: `Successfully uploaded ${created.count} students`
        });
      })
      .on("error", reject);
  });
};