import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { dayOfWeekOf } from "~/server/lib/dates";
import { startConversation } from "~/server/messaging/convex";
import type {
  Prisma,
  PrismaClient,
  UserRole,
} from "../../../../generated/prisma";

/**
 * The school-database side of messaging. Conversations and messages live in
 * Convex (`convex/`); this router answers what only Postgres knows — who a
 * person may message and what they share — and is the only way a
 * conversation is created, so Convex never trusts a browser about members.
 */

type Actor = {
  id: string;
  role: string;
  studentId: string | null;
  teacherId: string | null;
};

/**
 * A student may only message a teacher who teaches them; teachers may message
 * students on their roster. Anyone may message an administrator.
 */
async function assertMayMessage(
  db: PrismaClient,
  actor: Actor,
  recipientIds: string[],
) {
  if (actor.role === "ADMIN") return;

  const recipients = await db.user.findMany({
    where: { id: { in: recipientIds } },
    select: {
      id: true,
      role: true,
      studentProfile: { select: { id: true } },
      teacherProfile: { select: { id: true } },
    },
  });
  if (recipients.length !== recipientIds.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found." });
  }

  for (const recipient of recipients) {
    if (recipient.role === "ADMIN") continue;

    const studentId =
      actor.role === "STUDENT" ? actor.studentId : recipient.studentProfile?.id;
    const teacherId =
      actor.role === "TEACHER" ? actor.teacherId : recipient.teacherProfile?.id;

    const shared =
      studentId && teacherId
        ? await db.enrollment.findFirst({
            where: { studentId, status: "ACTIVE", section: { teacherId } },
            select: { id: true },
          })
        : null;
    if (!shared) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only message people you share a class with.",
      });
    }
  }
}

const personSelect = {
  id: true,
  name: true,
  title: true,
  role: true,
  studentProfile: { select: { gradeLevel: true } },
  teacherProfile: { select: { department: { select: { name: true } } } },
} satisfies Prisma.UserSelect;

/** "Teacher • Science Department", "Student • Gr. 11", "Admin & Staff" */
function subtitleFor(user: {
  role: UserRole;
  studentProfile: { gradeLevel: number } | null;
  teacherProfile: { department: { name: string } | null } | null;
}): string {
  if (user.role === "TEACHER") {
    const department = user.teacherProfile?.department?.name;
    return department ? `Teacher • ${department}` : "Teacher";
  }
  if (user.role === "STUDENT") {
    return user.studentProfile
      ? `Student • Gr. ${user.studentProfile.gradeLevel}`
      : "Student";
  }
  return "Admin & Staff";
}

const ROLE_ORDER: Record<UserRole, number> = {
  TEACHER: 0,
  STUDENT: 1,
  ADMIN: 2,
};

type Person = Prisma.UserGetPayload<{ select: typeof personSelect }>;

/** Everyone the caller shares a current class with, and the course it is. */
async function classmatesOf(
  db: PrismaClient,
  actor: Actor,
): Promise<Array<{ course: string; person: Person }>> {
  if (actor.role === "STUDENT") {
    const sections = await db.section.findMany({
      where: {
        term: { isCurrent: true },
        enrollments: {
          some: { studentId: actor.studentId ?? "", status: "ACTIVE" },
        },
      },
      orderBy: { period: "asc" },
      select: {
        course: { select: { name: true } },
        teacher: { select: { user: { select: personSelect } } },
      },
    });
    return sections.map((s) => ({
      course: s.course.name,
      person: s.teacher.user,
    }));
  }
  if (actor.role === "TEACHER") {
    const enrollments = await db.enrollment.findMany({
      where: {
        status: "ACTIVE",
        section: {
          term: { isCurrent: true },
          teacherId: actor.teacherId ?? "",
        },
      },
      select: {
        section: { select: { course: { select: { name: true } } } },
        student: { select: { user: { select: personSelect } } },
      },
    });
    return enrollments.map((e) => ({
      course: e.section.course.name,
      person: e.student.user,
    }));
  }
  return [];
}

export const messagingRouter = createTRPCRouter({
  /** People the caller may start a conversation with. */
  contacts: protectedProcedure.query(async ({ ctx }) => {
    const actor = ctx.session.user;
    const [linked, admins] = await Promise.all([
      classmatesOf(ctx.db, actor),
      ctx.db.user.findMany({
        where: { role: "ADMIN", isActive: true, id: { not: actor.id } },
        orderBy: { name: "asc" },
        select: personSelect,
      }),
    ]);

    const contacts = new Map<
      string,
      {
        userId: string;
        name: string;
        title: string | null;
        role: UserRole;
        subtitle: string;
        courses: string[];
      }
    >();
    const add = (person: Person, course: string | null) => {
      if (person.id === actor.id) return;
      const existing = contacts.get(person.id);
      if (existing) {
        if (course && !existing.courses.includes(course)) {
          existing.courses.push(course);
        }
        return;
      }
      contacts.set(person.id, {
        userId: person.id,
        name: person.name ?? "Unnamed",
        title: person.title,
        role: person.role,
        subtitle: subtitleFor(person),
        courses: course ? [course] : [],
      });
    };
    for (const { course, person } of linked) add(person, course);
    for (const admin of admins) add(admin, null);

    return [...contacts.values()].sort(
      (a, b) =>
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name),
    );
  }),

  /**
   * The "Recipient Details" panel: who someone is and the classes the two of
   * them share this term, with the student's standing in each.
   */
  dossier: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const actor = ctx.session.user;
      if (input.userId !== actor.id) {
        await assertMayMessage(ctx.db, actor, [input.userId]);
      }

      const person = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          ...personSelect,
          teacherProfile: {
            select: {
              id: true,
              officeLocation: true,
              department: { select: { name: true } },
              officeHours: {
                where: { dayOfWeek: dayOfWeekOf(new Date()) },
                orderBy: { startTime: "asc" },
                select: {
                  id: true,
                  startTime: true,
                  endTime: true,
                  mode: true,
                  location: true,
                  label: true,
                },
              },
            },
          },
          studentProfile: {
            select: { id: true, gradeLevel: true, studentNumber: true },
          },
        },
      });
      if (!person) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Person not found.",
        });
      }

      const pair =
        actor.role === "STUDENT" && person.teacherProfile
          ? { studentId: actor.studentId, teacherId: person.teacherProfile.id }
          : actor.role === "TEACHER" && person.studentProfile
            ? {
                studentId: person.studentProfile.id,
                teacherId: actor.teacherId,
              }
            : null;
      const shared =
        pair?.studentId && pair.teacherId
          ? await ctx.db.enrollment.findMany({
              where: {
                studentId: pair.studentId,
                status: "ACTIVE",
                section: {
                  teacherId: pair.teacherId,
                  term: { isCurrent: true },
                },
              },
              orderBy: { section: { period: "asc" } },
              select: {
                currentPercent: true,
                currentLetter: true,
                syllabusPercent: true,
                section: {
                  select: {
                    id: true,
                    period: true,
                    room: true,
                    course: { select: { name: true } },
                  },
                },
              },
            })
          : [];

      return {
        userId: person.id,
        name: person.name ?? "Unnamed",
        title: person.title,
        role: person.role,
        subtitle: subtitleFor(person),
        office: person.teacherProfile?.officeLocation ?? null,
        gradeLevel: person.studentProfile?.gradeLevel ?? null,
        studentNumber: person.studentProfile?.studentNumber ?? null,
        officeHoursToday: person.teacherProfile?.officeHours ?? [],
        sharedCourses: shared.map((enrollment) => ({
          sectionId: enrollment.section.id,
          courseName: enrollment.section.course.name,
          period: enrollment.section.period,
          room: enrollment.section.room,
          percent: enrollment.currentPercent,
          letter: enrollment.currentLetter,
          syllabusPercent: enrollment.syllabusPercent,
        })),
      };
    }),

  /** Opens a conversation in Convex once Postgres says the caller may. */
  start: protectedProcedure
    .input(
      z.object({
        recipientIds: z.array(z.string()).min(1).max(20),
        subject: z.string().trim().max(200).optional(),
        body: z.string().trim().min(1).max(20_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = ctx.session.user;
      const recipientIds = [...new Set(input.recipientIds)].filter(
        (id) => id !== actor.id,
      );
      if (recipientIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose someone to message.",
        });
      }
      await assertMayMessage(ctx.db, actor, recipientIds);

      const people = await ctx.db.user.findMany({
        where: { id: { in: [actor.id, ...recipientIds] } },
        select: personSelect,
      });

      const conversationId = await startConversation({
        senderId: actor.id,
        body: input.body,
        ...(input.subject ? { subject: input.subject } : {}),
        members: people.map((person) => ({
          userId: person.id,
          name: person.name ?? "Unnamed",
          role: person.role,
          subtitle: subtitleFor(person),
          ...(person.title ? { title: person.title } : {}),
        })),
      });
      return { conversationId };
    }),
});
