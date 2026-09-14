import { TRPCError } from "@trpc/server";

import type { PrismaClient } from "../../../generated/prisma";

/** Throws unless the section exists and still has an open seat. */
export async function assertSeatAvailable(db: PrismaClient, sectionId: string) {
  const section = await db.section.findUnique({
    where: { id: sectionId },
    select: {
      capacity: true,
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  });
  if (!section) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Section not found." });
  }
  if (section._count.enrollments >= section.capacity) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This section is at capacity.",
    });
  }
}

/** Adds a student to a section, or re-activates a dropped enrollment. */
export async function enrollInSection(
  db: PrismaClient,
  sectionId: string,
  studentId: string,
  seatNo?: number,
) {
  await assertSeatAvailable(db, sectionId);

  return db.enrollment.upsert({
    where: { sectionId_studentId: { sectionId, studentId } },
    create: { sectionId, studentId, seatNo },
    update: { status: "ACTIVE", droppedAt: null, seatNo },
  });
}
