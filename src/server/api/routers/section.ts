import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, teacherProcedure } from "~/server/api/trpc";
import { assertTeachesSection } from "~/server/lib/permissions";
import { uniqueViolation } from "~/server/lib/prisma-errors";
import type {
  CourseLevel,
  DayOfWeek,
  PrismaClient,
} from "../../../../generated/prisma";

const DAYS: readonly string[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const LEVELS: readonly string[] = ["REGULAR", "HONORS", "AP", "IB", "ELECTIVE"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Section details a teacher sets when adding or editing a section. */
const sectionShape = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter a section name, e.g. Sec 1.")
    .max(20, "Keep the section name under 20 characters."),
  period: z.number().int().min(1, "Pick a period.").max(12, "Pick a period."),
  room: z
    .string()
    .trim()
    .max(40, "Keep the room under 40 characters.")
    .transform((value) => value || null),
  capacity: z
    .number()
    .int()
    .min(1, "Allow at least 1 seat.")
    .max(200, "Keep seats at 200 or fewer."),
  days: z
    .array(
      z
        .string()
        .refine((day): day is DayOfWeek => DAYS.includes(day), "Pick valid days."),
    )
    .min(1, "Pick at least one day the class meets."),
  startTime: z.string().regex(TIME, "Enter a start time."),
  endTime: z.string().regex(TIME, "Enter an end time."),
});

/** "HH:mm" strings compare correctly as text. */
const endsAfterStart = (value: { startTime: string; endTime: string }) =>
  value.endTime > value.startTime;
const END_AFTER_START = {
  message: "The class must end after it starts.",
  path: ["endTime"],
};

const courseChoice = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("existing"),
    courseId: z.string().min(1, "Pick a course."),
  }),
  z.object({
    kind: z.literal("new"),
    name: z
      .string()
      .trim()
      .min(2, "Enter the course name.")
      .max(120, "Keep the course name under 120 characters."),
    level: z
      .string()
      .refine(
        (level): level is CourseLevel => LEVELS.includes(level),
        "Pick a course level.",
      ),
    department: z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal("existing"),
        id: z.string().min(1, "Pick a department."),
      }),
      z.object({
        kind: z.literal("new"),
        name: z
          .string()
          .trim()
          .min(2, "Enter the department name.")
          .max(80, "Keep the department name under 80 characters."),
      }),
    ]),
  }),
]);

type NewCourse = Extract<z.infer<typeof courseChoice>, { kind: "new" }>;

/** "Marine Biology" → "MARINE-BIOLOGY", trimmed to `max` characters. */
const codeFrom = (name: string, max: number) =>
  name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");

/** "Claude Test Dept" → "CTD"; falls back to the first letters. */
const departmentCodeFrom = (name: string) => {
  const initials = name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return initials.length >= 2
    ? initials.slice(0, 6)
    : codeFrom(name, 6) || "DEPT";
};

/** Reuses a department with the same name, or creates one. */
async function findOrCreateDepartment(db: PrismaClient, name: string) {
  const existing = await db.department.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const base = departmentCodeFrom(name);
  for (let attempt = 0; ; attempt++) {
    try {
      const department = await db.department.create({
        data: { name, code: attempt === 0 ? base : `${base}${attempt + 1}` },
        select: { id: true },
      });
      return department.id;
    } catch (error) {
      if (uniqueViolation(error)?.includes("code") && attempt < 20) continue;
      throw error;
    }
  }
}

/** Creates a course with a generated, unique code such as "MARINE-BIOLOGY". */
async function createCourse(db: PrismaClient, course: NewCourse) {
  let departmentId: string;
  if (course.department.kind === "existing") {
    const department = await db.department.findUnique({
      where: { id: course.department.id },
      select: { id: true },
    });
    if (!department) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "That department no longer exists.",
      });
    }
    departmentId = department.id;
  } else {
    departmentId = await findOrCreateDepartment(db, course.department.name);
  }

  const base = codeFrom(course.name, 16) || "COURSE";
  for (let attempt = 0; ; attempt++) {
    try {
      const created = await db.course.create({
        data: {
          code: attempt === 0 ? base : `${base}-${attempt + 1}`,
          name: course.name,
          level: course.level,
          departmentId,
        },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (uniqueViolation(error)?.includes("code") && attempt < 20) continue;
      throw error;
    }
  }
}

const duplicateSection = (code: string) =>
  new TRPCError({
    code: "CONFLICT",
    message: `You already have ${code} for this course this term.`,
  });

/**
 * Sections a teacher runs themselves: add, edit and delete, so a newly
 * registered teacher can set up a class and start enrolling students.
 */
export const sectionRouter = createTRPCRouter({
  /** Everything the Add section form needs to offer. */
  setupOptions: teacherProcedure.query(async ({ ctx }) => {
    const [term, departments, courses] = await Promise.all([
      ctx.db.term.findFirst({
        where: { isCurrent: true },
        select: { id: true, name: true },
      }),
      ctx.db.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      ctx.db.course.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          level: true,
          departmentId: true,
        },
      }),
    ]);
    return { term, departments, courses };
  }),

  createMine: teacherProcedure
    .input(
      sectionShape
        .extend({ course: courseChoice })
        .refine(endsAfterStart, END_AFTER_START),
    )
    .mutation(async ({ ctx, input }) => {
      const teacherId = ctx.teacherId;
      if (!teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This account has no teacher profile.",
        });
      }

      const term = await ctx.db.term.findFirst({
        where: { isCurrent: true },
        select: { id: true },
      });
      if (!term) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No current term is set up yet, so sections can't be added.",
        });
      }

      let courseId: string;
      if (input.course.kind === "existing") {
        const course = await ctx.db.course.findUnique({
          where: { id: input.course.courseId },
          select: { id: true },
        });
        if (!course) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "That course no longer exists.",
          });
        }
        courseId = course.id;
      } else {
        courseId = await createCourse(ctx.db, input.course);
      }

      const { code, period, room, capacity, days, startTime, endTime } = input;
      try {
        const section = await ctx.db.section.create({
          data: {
            code,
            period,
            room,
            capacity,
            courseId,
            termId: term.id,
            teacherId,
            meetings: {
              create: days.map((dayOfWeek) => ({
                dayOfWeek,
                startTime,
                endTime,
                room,
              })),
            },
          },
          select: {
            id: true,
            code: true,
            course: { select: { name: true, departmentId: true } },
          },
        });

        // A self-registered teacher has no department yet; adopt the course's.
        await ctx.db.teacherProfile.updateMany({
          where: { id: teacherId, departmentId: null },
          data: { departmentId: section.course.departmentId },
        });

        return {
          id: section.id,
          name: `${section.course.name} — ${section.code}`,
        };
      } catch (error) {
        if (uniqueViolation(error)?.includes("code")) {
          throw duplicateSection(code);
        }
        throw error;
      }
    }),

  updateMine: teacherProcedure
    .input(
      sectionShape
        .extend({ sectionId: z.string().min(1) })
        .refine(endsAfterStart, END_AFTER_START),
    )
    .mutation(async ({ ctx, input }) => {
      await assertTeachesSection(ctx.db, ctx.session.user, input.sectionId);

      const active = await ctx.db.enrollment.count({
        where: { sectionId: input.sectionId, status: "ACTIVE" },
      });
      if (input.capacity < active) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This section has ${active} students, so it needs at least ${active} seats.`,
        });
      }

      const { sectionId, days, startTime, endTime, ...details } = input;
      try {
        await ctx.db.$transaction([
          ctx.db.section.update({ where: { id: sectionId }, data: details }),
          ctx.db.sectionMeeting.deleteMany({ where: { sectionId } }),
          ctx.db.sectionMeeting.createMany({
            data: days.map((dayOfWeek) => ({
              sectionId,
              dayOfWeek,
              startTime,
              endTime,
              room: details.room,
            })),
          }),
        ]);
      } catch (error) {
        if (uniqueViolation(error)?.includes("code")) {
          throw duplicateSection(input.code);
        }
        throw error;
      }
      return { ok: true };
    }),

  /**
   * Deletes a section with no current students and no coursework or
   * attendance. Dropped enrollments go with it.
   */
  deleteMine: teacherProcedure
    .input(z.object({ sectionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertTeachesSection(ctx.db, ctx.session.user, input.sectionId);

      const { _count: counts } = await ctx.db.section.findUniqueOrThrow({
        where: { id: input.sectionId },
        select: {
          _count: {
            select: {
              enrollments: { where: { status: "ACTIVE" } },
              assignments: true,
              assessments: true,
              attendanceSessions: true,
            },
          },
        },
      });
      if (counts.enrollments > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Remove all students from this section before deleting it.",
        });
      }
      if (
        counts.assignments + counts.assessments + counts.attendanceSessions >
        0
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This section already has assignments or attendance records, so it can't be deleted.",
        });
      }

      await ctx.db.section.delete({ where: { id: input.sectionId } });
      return { ok: true };
    }),
});
