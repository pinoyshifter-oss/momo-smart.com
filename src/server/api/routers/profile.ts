import { TRPCError } from "@trpc/server";
import { compare } from "bcryptjs";
import { z } from "zod";

import { MAX_PHOTO_LENGTH, TEACHER_TITLES } from "~/app/register/registration";
import {
  createTRPCRouter,
  protectedProcedure,
  teacherProcedure,
} from "~/server/api/trpc";
import { assertCredentialsEditable } from "~/server/lib/demo-guard";
import { uniqueViolation } from "~/server/lib/prisma-errors";

/** An optional free-text field; blank input is stored as `null`. */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

const TITLES: readonly string[] = TEACHER_TITLES;

export const profileRouter = createTRPCRouter({
  /** Saves the teacher's Profile Settings form. */
  updateTeacher: teacherProcedure
    .input(
      z.object({
        title: z
          .string()
          .refine(
            (value) => value === "" || TITLES.includes(value),
            "Pick a title from the list.",
          )
          .transform((value) => value || null),
        name: z
          .string()
          .trim()
          .min(2, "Enter your full name.")
          .max(120, "Keep your name under 120 characters."),
        // Optional here: teachers added before registration asked for it
        // shouldn't be blocked from saving the rest of their profile.
        subject: optionalText(80, "Keep the subject under 80 characters."),
        phone: optionalText(
          40,
          "Keep the phone number under 40 characters.",
        ).refine(
          (value) => value === null || /^\+?[\d\s().-]{6,}$/.test(value),
          "Enter a valid phone number.",
        ),
        officeLocation: optionalText(80, "Keep the room under 80 characters."),
        bio: optionalText(500, "Keep your bio under 500 characters."),
        /** "keep" leaves the photo alone, "" removes it, else a new JPEG. */
        photo: z
          .string()
          .max(MAX_PHOTO_LENGTH, "That photo is too large. Choose a smaller image.")
          .refine(
            (value) =>
              value === "keep" ||
              value === "" ||
              /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value),
            "That photo could not be read. Choose a JPEG, PNG or WebP image.",
          )
          .transform((value) =>
            value === "keep" ? undefined : value === "" ? null : value,
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This account has no teacher profile.",
        });
      }

      const { title, name, photo, ...profile } = input;
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          title,
          name,
          teacherProfile: { update: { ...profile, photoUrl: photo } },
        },
        select: { id: true },
      });
      return { ok: true };
    }),

  /** Changes the sign-in email after confirming the current password. */
  changeEmail: protectedProcedure
    .input(
      z.object({
        email: z
          .string()
          .trim()
          .toLowerCase()
          .email("Enter a valid email address."),
        currentPassword: z
          .string()
          .min(1, "Enter your current password to confirm.")
          .max(72),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { email: true, passwordHash: true },
      });
      if (
        !user?.passwordHash ||
        !(await compare(input.currentPassword, user.passwordHash))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your current password is incorrect.",
        });
      }
      assertCredentialsEditable(user.email);
      if (user.email === input.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That's already your sign-in email.",
        });
      }

      try {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { email: input.email, emailVerified: null },
        });
      } catch (error) {
        if (uniqueViolation(error)?.includes("email")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Another account already uses that email.",
          });
        }
        throw error;
      }
      return { email: input.email };
    }),
});
