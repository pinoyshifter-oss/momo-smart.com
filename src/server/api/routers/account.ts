import { TRPCError } from "@trpc/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  teacherProcedure,
} from "~/server/api/trpc";
import { sendStudentCredentials } from "~/server/email/student-credentials";
import {
  onSchoolDomain,
  studentEmailRule,
  studentNumber,
  studentNumberPrefix,
  temporaryPassword,
} from "~/server/lib/credentials";
import { assertCredentialsEditable } from "~/server/lib/demo-guard";
import { assertSeatAvailable, enrollInSection } from "~/server/lib/enrollment";
import { assertTeachesSection } from "~/server/lib/permissions";
import { uniqueViolation } from "~/server/lib/prisma-errors";

export const accountRouter = createTRPCRouter({
  /** Whether the caller still has to replace a temporary password. */
  passwordStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { mustChangePassword: true },
    });
    return { mustChangePassword: user?.mustChangePassword ?? false };
  }),

  /** Replaces the caller's password after checking the current one. */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z
          .string()
          .min(1, "Enter your current password.")
          .max(72),
        newPassword: z
          .string()
          .min(8, "Use at least 8 characters for your new password.")
          // bcrypt ignores everything past 72 bytes.
          .max(72, "Keep your password under 72 characters."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { email: true, passwordHash: true },
      });
      const valid =
        user?.passwordHash &&
        (await compare(input.currentPassword, user.passwordHash));
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your current password is incorrect.",
        });
      }
      assertCredentialsEditable(user?.email);
      if (input.currentPassword === input.newPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose a password different from your current one.",
        });
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          passwordHash: await hash(input.newPassword, 10),
          mustChangePassword: false,
        },
      });
      return { ok: true };
    }),

  /**
   * Creates a student account on the school's email domain, enrols it in one
   * of the teacher's sections and emails the student their ID and temporary
   * password. A student who already has an account is simply enrolled.
   */
  createStudent: teacherProcedure
    .input(
      z.object({
        name: z
          .string()
          .trim()
          .min(2, "Enter the student's full name.")
          .max(120, "Keep the name under 120 characters."),
        email: z
          .string()
          .trim()
          .toLowerCase()
          .email("Enter the student's school email address."),
        gradeLevel: z
          .number()
          .int()
          .min(1, "Pick a grade level.")
          .max(12, "Pick a grade level."),
        sectionId: z.string().min(1, "Pick a section."),
        homeroom: z
          .string()
          .trim()
          .max(40, "Keep the homeroom under 40 characters.")
          .transform((value) => value || null),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertTeachesSection(ctx.db, ctx.session.user, input.sectionId);

      const [staff, section] = await Promise.all([
        ctx.db.user.findUniqueOrThrow({
          where: { id: ctx.session.user.id },
          select: {
            email: true,
            name: true,
            title: true,
            teacherProfile: {
              select: { organization: { select: { name: true } } },
            },
          },
        }),
        ctx.db.section.findUniqueOrThrow({
          where: { id: input.sectionId },
          select: { code: true, course: { select: { name: true } } },
        }),
      ]);

      const rule = studentEmailRule(staff.email);
      if (rule.kind === "unknown") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Student accounts use your school's email domain. Sign in with your school email address to enroll students.",
        });
      }
      if (rule.kind === "school" && !onSchoolDomain(input.email, rule.domain)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Use the student's school email — it must end in @${rule.domain}.`,
        });
      }

      const sectionName = `${section.course.name} — ${section.code}`;

      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: {
          name: true,
          studentProfile: {
            select: {
              id: true,
              studentNumber: true,
              enrollments: {
                where: { sectionId: input.sectionId, status: "ACTIVE" },
                select: { id: true },
              },
            },
          },
        },
      });

      if (existing) {
        if (!existing.studentProfile) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That email belongs to a staff account, not a student.",
          });
        }
        if (existing.studentProfile.enrollments.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `${existing.name ?? input.email} is already enrolled in ${sectionName}.`,
          });
        }
        await enrollInSection(
          ctx.db,
          input.sectionId,
          existing.studentProfile.id,
        );
        return {
          kind: "EXISTING" as const,
          name: existing.name ?? input.name,
          email: input.email,
          studentNumber: existing.studentProfile.studentNumber,
          sectionName,
        };
      }

      // Checked before creating the account, so a full section never leaves
      // an orphaned login behind.
      await assertSeatAvailable(ctx.db, input.sectionId);

      const password = temporaryPassword();
      const passwordHash = await hash(password, 10);
      const prefix = studentNumberPrefix(
        staff.teacherProfile?.organization?.name,
      );

      // Student IDs are random, so a collision is retried rather than shown.
      const createAccount = async () => {
        for (let attempt = 0; ; attempt++) {
          const number = studentNumber(prefix);
          try {
            await ctx.db.user.create({
              data: {
                name: input.name,
                email: input.email,
                role: "STUDENT",
                passwordHash,
                mustChangePassword: true,
                studentProfile: {
                  create: {
                    studentNumber: number,
                    gradeLevel: input.gradeLevel,
                    homeroom: input.homeroom,
                    enrollments: { create: { sectionId: input.sectionId } },
                  },
                },
              },
              select: { id: true },
            });
            return number;
          } catch (error) {
            const target = uniqueViolation(error);
            if (target?.includes("studentNumber") && attempt < 4) continue;
            if (target?.includes("email")) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "An account with this email already exists.",
              });
            }
            throw error;
          }
        }
      };
      const number = await createAccount();

      const delivery = await sendStudentCredentials({
        to: input.email,
        studentName: input.name,
        studentNumber: number,
        temporaryPassword: password,
        teacherName:
          [staff.title, staff.name].filter(Boolean).join(" ") ||
          "Your teacher",
        sectionName,
        schoolName: staff.teacherProfile?.organization?.name,
      });

      return {
        kind: "CREATED" as const,
        name: input.name,
        email: input.email,
        studentNumber: number,
        sectionName,
        emailed: delivery.ok,
        emailError: delivery.ok ? null : delivery.reason,
        // Only handed back when the email didn't go out, so the teacher can
        // pass it on in person.
        temporaryPassword: delivery.ok ? null : password,
      };
    }),
});
