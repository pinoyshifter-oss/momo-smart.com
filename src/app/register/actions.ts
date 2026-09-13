"use server";

import { randomBytes } from "node:crypto";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn } from "~/server/auth";
import { homeForRole } from "~/server/auth/home";
import { db } from "~/server/db";
import { Prisma } from "../../../generated/prisma";
import {
  MAX_PHOTO_LENGTH,
  TEACHER_TITLES,
  type RegistrationState,
} from "./registration";

/** An optional free-text field; blank input is stored as `null`. */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

const organizationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), id: z.string().min(1).max(40) }),
  z.object({
    kind: z.literal("new"),
    name: z
      .string()
      .trim()
      .min(3, "Enter the full name of your school or organization.")
      .max(160, "Keep the school name under 160 characters.")
      .transform((value) => value.replace(/\s+/g, " ")),
    city: optionalText(80, "Keep the city under 80 characters."),
  }),
]);

const registrationSchema = z.object({
  organization: organizationSchema,
  title: z
    .union([z.enum(TEACHER_TITLES), z.literal("")])
    .transform((value) => value || null),
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(120, "Keep your name under 120 characters."),
  subject: z
    .string()
    .trim()
    .min(2, "Enter the subject you teach.")
    .max(80, "Keep the subject under 80 characters."),
  phone: optionalText(40, "Keep the phone number under 40 characters.").refine(
    (value) => value === null || /^\+?[\d\s().-]{6,}$/.test(value),
    "Enter a valid phone number.",
  ),
  officeLocation: optionalText(80, "Keep the room under 80 characters."),
  bio: optionalText(500, "Keep your bio under 500 characters."),
  photo: z
    .string()
    .max(MAX_PHOTO_LENGTH, "That photo is too large. Choose a smaller image.")
    .refine(
      (value) =>
        value === "" ||
        /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value),
      "That photo could not be read. Choose a JPEG, PNG or WebP image.",
    )
    .transform((value) => value || null),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters for your password.")
    // bcrypt ignores everything past 72 bytes.
    .max(72, "Keep your password under 72 characters."),
});

/** Which wizard step owns each field, so errors send the teacher back there. */
const STEP_OF: Record<string, RegistrationState["step"]> = {
  organization: "school",
  email: "account",
  password: "account",
};

/** "St. Mary's  School" + "Cebu" → "st mary s school|cebu" */
const normalise = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const uniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002"
    ? String(error.meta?.target)
    : null;

/**
 * Creates a teacher account, their profile and — when they added one — their
 * school, then signs them in. A successful registration redirects to the
 * teacher dashboard and never returns.
 */
export async function registerTeacher(
  input: unknown,
): Promise<RegistrationState> {
  // Honeypot: real visitors never see this field.
  if (
    typeof input === "object" &&
    input !== null &&
    "website" in input &&
    input.website
  ) {
    return { error: "We could not create your account. Please try again." };
  }

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: issue?.message ?? "Check your details.",
      step: STEP_OF[String(issue?.path[0])] ?? "profile",
    };
  }

  const { organization, email, password, photo, ...profile } = parsed.data;

  if (organization.kind === "existing") {
    const found = await db.organization.findUnique({
      where: { id: organization.id },
      select: { id: true },
    });
    if (!found) {
      return {
        error: "That school is no longer listed. Search again or add it.",
        step: "school",
      };
    }
  }

  const emailTaken = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (emailTaken) {
    return {
      error: "An account with this email already exists. Sign in instead.",
      step: "account",
    };
  }

  const passwordHash = await hash(password, 10);

  // An added school that already exists under the same normalised name and
  // city is joined rather than duplicated.
  const organizationLink =
    organization.kind === "existing"
      ? { connect: { id: organization.id } }
      : (() => {
          const slug = `${normalise(organization.name)}|${normalise(organization.city ?? "")}`;
          return {
            connectOrCreate: {
              where: { slug },
              create: {
                name: organization.name,
                city: organization.city,
                slug,
              },
            },
          };
        })();

  // The employee number is random, so a collision is retried rather than
  // surfaced; any other failure is the teacher's to see.
  for (let attempt = 0; ; attempt++) {
    try {
      await db.user.create({
        data: {
          name: profile.name,
          title: profile.title,
          email,
          passwordHash,
          role: "TEACHER",
          teacherProfile: {
            create: {
              employeeNumber: `T-${randomBytes(4).toString("hex").toUpperCase()}`,
              subject: profile.subject,
              phone: profile.phone,
              officeLocation: profile.officeLocation,
              bio: profile.bio,
              photoUrl: photo,
              organization: organizationLink,
            },
          },
        },
        select: { id: true },
      });
      break;
    } catch (error) {
      const target = uniqueViolation(error);
      if (target?.includes("employeeNumber") && attempt < 2) continue;
      if (target?.includes("email")) {
        return {
          error: "An account with this email already exists. Sign in instead.",
          step: "account",
        };
      }
      console.error("teacher registration failed", error);
      return { error: "We couldn't create your account. Please try again." };
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: homeForRole("TEACHER"),
    });
  } catch (error) {
    // A successful sign-in throws NEXT_REDIRECT, which must bubble up. The
    // account exists by now, so any other failure falls back to the sign-in
    // page rather than inviting a second registration.
    if (error instanceof AuthError) redirect("/login");
    throw error;
  }

  return { error: null };
}
