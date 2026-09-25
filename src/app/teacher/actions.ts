"use server";

import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { api } from "~/trpc/server";

/** A readable message from a failed tRPC call, including input validation. */
function messageOf(error: TRPCError): string {
  if (error.cause instanceof ZodError) {
    return error.cause.issues[0]?.message ?? "Check the details and try again.";
  }
  return error.message;
}

/**
 * The form message for any failed call. Unexpected errors (database, network)
 * are logged and reported instead of rethrown: a rethrown error is hidden in
 * production, leaving the form with no message at all.
 */
function failure(action: string, error: unknown): string {
  if (error instanceof TRPCError) return messageOf(error);
  console.error(`${action} failed`, error);
  return "Something went wrong on our side, so nothing was saved. Please try again.";
}

export type CreateStudentResult = Awaited<
  ReturnType<typeof api.account.createStudent>
>;

export type CreateStudentState =
  | { error: string }
  | { result: CreateStudentResult }
  | null;

/**
 * Creates and enrols a student from the Enroll dialog, emailing them their
 * student ID and temporary password.
 */
export async function createStudent(
  _previous: CreateStudentState,
  formData: FormData,
): Promise<CreateStudentState> {
  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  try {
    const result = await api.account.createStudent({
      name: field("name"),
      email: field("email"),
      gradeLevel: Number(field("gradeLevel")) || 0,
      sectionId: field("sectionId"),
      homeroom: field("homeroom"),
    });
    revalidatePath("/teacher", "layout");
    return { result };
  } catch (error) {
    return { error: failure("createStudent", error) };
  }
}

export type EnrollState = { error?: string; enrolled?: string } | null;

/**
 * Enrols a student, found by exact student ID or school email, in one of the
 * teacher's sections. Returns a message for the form instead of throwing.
 */
export async function enrollStudent(
  _previous: EnrollState,
  formData: FormData,
): Promise<EnrollState> {
  const sectionId = formData.get("sectionId");
  const identifier = formData.get("identifier");
  if (typeof sectionId !== "string" || sectionId.length === 0) {
    return { error: "Pick a section first." };
  }
  if (typeof identifier !== "string" || identifier.trim().length === 0) {
    return { error: "Enter a student ID or email." };
  }

  try {
    const student = await api.course.findStudent({ identifier });
    if (!student) {
      return { error: `No student matches “${identifier.trim()}”.` };
    }
    await api.course.enrollStudent({ sectionId, studentId: student.id });
    revalidatePath("/teacher", "layout");
    return { enrolled: student.user.name ?? student.studentNumber };
  } catch (error) {
    return { error: failure("enrollStudent", error) };
  }
}

/** Removes a student from the section roster (re-enrolling restores them). */
export async function dropStudent(formData: FormData) {
  const sectionId = formData.get("sectionId");
  const studentId = formData.get("studentId");
  if (typeof sectionId !== "string" || typeof studentId !== "string") return;

  await api.course.dropStudent({ sectionId, studentId });
  revalidatePath("/teacher", "layout");
}

/**
 * Opens the attendance roster for a section's meeting today, pre-filling every
 * enrolled student as present. Backed by `attendance.openSession`, so all the
 * teacher-owns-this-section checks still apply.
 */
export async function takeAttendance(formData: FormData) {
  const sectionId = formData.get("sectionId");
  if (typeof sectionId !== "string" || sectionId.length === 0) return;

  await api.attendance.openSession({ sectionId });
  revalidatePath("/teacher");
}

/** Marks the open session as submitted for the day. */
export async function submitAttendance(formData: FormData) {
  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || sessionId.length === 0) return;

  await api.attendance.submitSession({ sessionId });
  revalidatePath("/teacher");
}

export type SaveState = { error: string } | { saved: string } | null;

const textField = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

/** Saves the Profile Settings form. */
export async function updateProfile(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await api.profile.updateTeacher({
      title: textField(formData, "title"),
      name: textField(formData, "name"),
      subject: textField(formData, "subject"),
      phone: textField(formData, "phone"),
      officeLocation: textField(formData, "officeLocation"),
      bio: textField(formData, "bio"),
      photo: textField(formData, "photo"),
    });
  } catch (error) {
    return { error: failure("updateProfile", error) };
  }
  revalidatePath("/teacher", "layout");
  return { saved: "Profile saved." };
}

/** Changes the sign-in email from Profile Settings. */
export async function changeEmail(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    const { email } = await api.profile.changeEmail({
      email: textField(formData, "email"),
      currentPassword: textField(formData, "currentPassword"),
    });
    revalidatePath("/teacher", "layout");
    return { saved: `You now sign in with ${email}.` };
  } catch (error) {
    return { error: failure("changeEmail", error) };
  }
}

/** Adds a section, or updates one when the form carries its id. */
export async function saveSection(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const field = (name: string) => textField(formData, name);
  const sectionId = field("sectionId");
  const details = {
    code: field("code"),
    period: Number(field("period")) || 0,
    room: field("room"),
    capacity: Number(field("capacity")) || 0,
    days: formData
      .getAll("days")
      .filter((day): day is string => typeof day === "string"),
    startTime: field("startTime"),
    endTime: field("endTime"),
  };

  try {
    if (sectionId) {
      await api.section.updateMine({ sectionId, ...details });
    } else {
      const courseId = field("courseId");
      const departmentId = field("departmentId");
      await api.section.createMine({
        ...details,
        course:
          courseId === "__new"
            ? {
                kind: "new" as const,
                name: field("courseName"),
                level: field("courseLevel"),
                department:
                  departmentId === "__new"
                    ? { kind: "new" as const, name: field("departmentName") }
                    : { kind: "existing" as const, id: departmentId },
              }
            : { kind: "existing" as const, courseId },
      });
    }
  } catch (error) {
    return { error: failure("saveSection", error) };
  }

  revalidatePath("/teacher", "layout");
  return { saved: sectionId ? "Section updated." : "Section added." };
}

/** Deletes an empty section from Class Settings. */
export async function deleteSection(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await api.section.deleteMine({
      sectionId: textField(formData, "sectionId"),
    });
  } catch (error) {
    return { error: failure("deleteSection", error) };
  }
  revalidatePath("/teacher", "layout");
  return { saved: "Section deleted." };
}
