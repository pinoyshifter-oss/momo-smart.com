import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  studentProcedure,
  teacherProcedure,
} from "~/server/api/trpc";
import {
  addDays,
  atTime,
  dayOfWeekOf,
  endOfDay,
  isOddRotationDay,
  startOfDay,
  toDateOnly,
} from "~/server/lib/dates";
import { assertTeachesSection } from "~/server/lib/permissions";
import { starsAvailable } from "~/server/lib/stars";
import type { CalendarEventType, Prisma } from "../../../../generated/prisma";

/** The longest range the student schedule expands at once (a month grid is 42 days). */
const MAX_SCHEDULE_DAYS = 62;

type ScheduleKind = "class" | "due" | "exam" | "event";

/** One dated item on the student calendar, whatever it came from. */
type ScheduleEntry = {
  id: string;
  kind: ScheduleKind;
  title: string;
  courseName: string | null;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  location: string | null;
  /** Teacher for a class, description for an event. */
  detail: string | null;
  /** Points possible, for deadlines only. */
  points: number | null;
  stars: number;
  /** A deadline the student has already handed in (or been excused from). */
  done: boolean;
  href: string | null;
};

const EVENT_KIND: Record<CalendarEventType, ScheduleKind> = {
  CLASS: "class",
  EXAM: "exam",
  ASSIGNMENT_DUE: "due",
  OFFICE_HOURS: "event",
  SCHOOL_EVENT: "event",
  ADMIN_DEADLINE: "event",
};

export const calendarRouter = createTRPCRouter({
  /**
   * Unified agenda for a date range: scheduled events, class meetings and
   * assignment deadlines for whichever sections the caller belongs to.
   */
  agenda: protectedProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const sectionFilter: Prisma.SectionWhereInput =
        user.role === "TEACHER"
          ? { teacherId: user.teacherId ?? "" }
          : user.role === "STUDENT"
            ? {
                enrollments: {
                  some: { studentId: user.studentId ?? "", status: "ACTIVE" },
                },
              }
            : {};

      const from = startOfDay(input.from);
      const to = endOfDay(input.to);

      const [events, assignments] = await Promise.all([
        ctx.db.calendarEvent.findMany({
          where: {
            startAt: { gte: from, lte: to },
            OR: [{ sectionId: null }, { section: sectionFilter }],
          },
          orderBy: { startAt: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            startAt: true,
            endAt: true,
            allDay: true,
            location: true,
            section: {
              select: {
                id: true,
                code: true,
                course: { select: { name: true } },
              },
            },
          },
        }),
        ctx.db.assignment.findMany({
          where: {
            publishedAt: { not: null },
            dueAt: { gte: from, lte: to },
            section: sectionFilter,
          },
          orderBy: { dueAt: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            dueAt: true,
            pointsPossible: true,
            section: {
              select: {
                id: true,
                code: true,
                course: { select: { name: true } },
              },
            },
          },
        }),
      ]);

      return {
        events,
        deadlines: assignments.map((assignment) => ({
          ...assignment,
          type: "ASSIGNMENT_DUE" as const,
        })),
      };
    }),

  /** Class meetings for one weekday — the period timetable. */
  timetable: protectedProcedure
    .input(z.object({ date: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const date = input.date ?? new Date();
      const user = ctx.session.user;

      return ctx.db.sectionMeeting.findMany({
        where: {
          dayOfWeek: dayOfWeekOf(date),
          section: {
            term: { isCurrent: true },
            ...(user.role === "TEACHER"
              ? { teacherId: user.teacherId ?? "" }
              : user.role === "STUDENT"
                ? {
                    enrollments: {
                      some: {
                        studentId: user.studentId ?? "",
                        status: "ACTIVE",
                      },
                    },
                  }
                : {}),
          },
        },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          dayOfWeek: true,
          rotation: true,
          startTime: true,
          endTime: true,
          room: true,
          section: {
            select: {
              id: true,
              code: true,
              period: true,
              room: true,
              course: {
                select: { id: true, name: true, code: true, colorToken: true },
              },
              teacher: {
                select: { user: { select: { name: true, title: true } } },
              },
            },
          },
        },
      });
    }),

  /**
   * The student calendar for a date range: weekly class meetings expanded
   * into dated sessions, assignment and exam deadlines with the student's own
   * submission state, and section or school-wide events. Administrative
   * deadlines are staff business and left out.
   */
  studentSchedule: studentProcedure
    .input(
      z
        .object({ from: z.date(), to: z.date() })
        .refine(
          ({ from, to }) =>
            to >= from &&
            to.getTime() - from.getTime() <=
              MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000,
          { message: `Ask for at most ${MAX_SCHEDULE_DAYS} days at a time.` },
        ),
    )
    .query(async ({ ctx, input }) => {
      const from = startOfDay(input.from);
      const to = endOfDay(input.to);
      const mySections: Prisma.SectionWhereInput = {
        enrollments: { some: { studentId: ctx.studentId, status: "ACTIVE" } },
      };

      const [events, assignments, meetings] = await Promise.all([
        ctx.db.calendarEvent.findMany({
          where: {
            startAt: { gte: from, lte: to },
            type: { not: "ADMIN_DEADLINE" },
            OR: [{ sectionId: null }, { section: mySections }],
          },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            startAt: true,
            endAt: true,
            allDay: true,
            location: true,
            section: { select: { course: { select: { name: true } } } },
          },
        }),
        ctx.db.assignment.findMany({
          where: {
            publishedAt: { not: null },
            dueAt: { gte: from, lte: to },
            section: mySections,
          },
          select: {
            id: true,
            title: true,
            type: true,
            pointsPossible: true,
            dueAt: true,
            section: { select: { course: { select: { name: true } } } },
            submissions: {
              where: { studentId: ctx.studentId },
              orderBy: { attempt: "desc" },
              take: 1,
              select: { status: true },
            },
          },
        }),
        ctx.db.sectionMeeting.findMany({
          where: { section: { ...mySections, term: { isCurrent: true } } },
          orderBy: { startTime: "asc" },
          select: {
            id: true,
            dayOfWeek: true,
            rotation: true,
            startTime: true,
            endTime: true,
            room: true,
            section: {
              select: {
                room: true,
                course: { select: { name: true } },
                teacher: {
                  select: { user: { select: { name: true, title: true } } },
                },
                term: { select: { startDate: true, endDate: true } },
              },
            },
          },
        }),
      ]);

      const entries: ScheduleEntry[] = [];

      for (
        let day = startOfDay(from);
        day.getTime() <= to.getTime();
        day = addDays(day, 1)
      ) {
        const weekday = dayOfWeekOf(day);
        for (const meeting of meetings) {
          const { term, teacher } = meeting.section;
          if (meeting.dayOfWeek !== weekday) continue;
          if (day < startOfDay(term.startDate) || day > term.endDate) continue;
          if (
            meeting.rotation !== "ALL" &&
            (meeting.rotation === "ODD") !==
              isOddRotationDay(term.startDate, day)
          ) {
            continue;
          }
          entries.push({
            id: `class-${meeting.id}-${day.getTime()}`,
            kind: "class",
            title: meeting.section.course.name,
            courseName: meeting.section.course.name,
            startAt: atTime(day, meeting.startTime),
            endAt: atTime(day, meeting.endTime),
            allDay: false,
            location: meeting.room ?? meeting.section.room,
            detail:
              [teacher.user.title, teacher.user.name]
                .filter(Boolean)
                .join(" ") || null,
            points: null,
            stars: 0,
            done: false,
            href: "/student/courses",
          });
        }
      }

      for (const { submissions, ...assignment } of assignments) {
        const status = submissions[0]?.status;
        entries.push({
          id: `due-${assignment.id}`,
          kind:
            assignment.type === "EXAM" || assignment.type === "QUIZ"
              ? "exam"
              : "due",
          title: assignment.title,
          courseName: assignment.section.course.name,
          startAt: assignment.dueAt,
          endAt: null,
          allDay: false,
          location: null,
          detail: null,
          points: assignment.pointsPossible,
          stars: starsAvailable(assignment),
          done:
            status === "SUBMITTED" ||
            status === "GRADED" ||
            status === "EXCUSED",
          href: `/student/assignments?assignment=${assignment.id}`,
        });
      }

      for (const event of events) {
        entries.push({
          id: `event-${event.id}`,
          kind: EVENT_KIND[event.type],
          title: event.title,
          courseName: event.section?.course.name ?? null,
          startAt: event.startAt,
          endAt: event.endAt,
          allDay: event.allDay,
          location: event.location,
          detail: event.description,
          points: null,
          stars: 0,
          done: false,
          href: null,
        });
      }

      return entries.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    }),

  /** Today's office hours held by the student's own teachers. */
  studentOfficeHours: studentProcedure.query(async ({ ctx }) => {
    const now = new Date();

    return ctx.db.officeHour.findMany({
      where: {
        dayOfWeek: dayOfWeekOf(now),
        teacher: {
          sections: {
            some: {
              term: { isCurrent: true },
              enrollments: {
                some: { studentId: ctx.studentId, status: "ACTIVE" },
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        mode: true,
        location: true,
        meetingUrl: true,
        capacity: true,
        label: true,
        teacher: {
          select: {
            user: { select: { name: true, title: true } },
            department: { select: { name: true } },
          },
        },
        _count: {
          select: {
            bookings: { where: { date: toDateOnly(now), status: "RESERVED" } },
          },
        },
      },
    });
  }),

  createEvent: teacherProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        type: z.enum([
          "CLASS",
          "EXAM",
          "ASSIGNMENT_DUE",
          "OFFICE_HOURS",
          "SCHOOL_EVENT",
          "ADMIN_DEADLINE",
        ]),
        startAt: z.date(),
        endAt: z.date().optional(),
        allDay: z.boolean().default(false),
        location: z.string().max(120).optional(),
        sectionId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.sectionId) {
        await assertTeachesSection(ctx.db, ctx.session.user, input.sectionId);
      } else if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can create school-wide events.",
        });
      }

      return ctx.db.calendarEvent.create({
        data: { ...input, createdById: ctx.session.user.id },
      });
    }),

  deleteEvent: teacherProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.calendarEvent.findUnique({
        where: { id: input.eventId },
        select: { createdById: true, sectionId: true },
      });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }
      if (event.sectionId) {
        await assertTeachesSection(ctx.db, ctx.session.user, event.sectionId);
      } else if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your event." });
      }
      return ctx.db.calendarEvent.delete({ where: { id: input.eventId } });
    }),

  // --- Office hours ---------------------------------------------------------

  /** Office-hour slots for a teacher, with remaining capacity on each date. */
  officeHours: protectedProcedure
    .input(z.object({ teacherId: z.string(), date: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const date = toDateOnly(input.date ?? new Date());

      const slots = await ctx.db.officeHour.findMany({
        where: { teacherId: input.teacherId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          mode: true,
          location: true,
          meetingUrl: true,
          capacity: true,
          label: true,
          _count: {
            select: { bookings: { where: { date, status: "RESERVED" } } },
          },
          bookings: {
            where: { date, studentId: ctx.session.user.studentId ?? "" },
            select: { id: true, status: true, topic: true },
          },
        },
      });

      return slots.map(({ _count, bookings, ...slot }) => ({
        ...slot,
        reserved: _count.bookings,
        seatsLeft: Math.max(0, slot.capacity - _count.bookings),
        myBooking: bookings[0] ?? null,
      }));
    }),

  bookOfficeHour: studentProcedure
    .input(
      z.object({
        officeHourId: z.string(),
        date: z.date(),
        topic: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const date = toDateOnly(input.date);
      const slot = await ctx.db.officeHour.findUnique({
        where: { id: input.officeHourId },
        select: {
          id: true,
          capacity: true,
          dayOfWeek: true,
          _count: {
            select: { bookings: { where: { date, status: "RESERVED" } } },
          },
        },
      });
      if (!slot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Office hour not found.",
        });
      }
      if (dayOfWeekOf(input.date) !== slot.dayOfWeek) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That slot does not run on the chosen date.",
        });
      }
      if (slot._count.bookings >= slot.capacity) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That slot is full.",
        });
      }

      return ctx.db.officeHourBooking.upsert({
        where: {
          officeHourId_studentId_date: {
            officeHourId: input.officeHourId,
            studentId: ctx.studentId,
            date,
          },
        },
        create: {
          officeHourId: input.officeHourId,
          studentId: ctx.studentId,
          date,
          topic: input.topic,
        },
        update: { status: "RESERVED", topic: input.topic },
      });
    }),

  cancelOfficeHour: studentProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.officeHourBooking.updateMany({
        where: { id: input.bookingId, studentId: ctx.studentId },
        data: { status: "CANCELLED" },
      });
      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found.",
        });
      }
      return { ok: true };
    }),

  setOfficeHours: teacherProcedure
    .input(
      z.object({
        slots: z
          .array(
            z.object({
              dayOfWeek: z.enum([
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
                "SUNDAY",
              ]),
              startTime: z.string().regex(/^\d{2}:\d{2}$/),
              endTime: z.string().regex(/^\d{2}:\d{2}$/),
              mode: z
                .enum(["IN_PERSON", "VIRTUAL", "HYBRID"])
                .default("IN_PERSON"),
              location: z.string().max(120).optional(),
              meetingUrl: z.string().url().optional(),
              capacity: z.number().int().min(1).max(50).default(6),
              label: z.string().max(120).optional(),
            }),
          )
          .max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No teacher profile on this account.",
        });
      }
      const teacherId = ctx.teacherId;

      // Replace the schedule wholesale; existing bookings cascade away with it.
      await ctx.db.officeHour.deleteMany({ where: { teacherId } });
      await ctx.db.officeHour.createMany({
        data: input.slots.map((slot) => ({ ...slot, teacherId })),
      });

      return ctx.db.officeHour.findMany({ where: { teacherId } });
    }),
});
