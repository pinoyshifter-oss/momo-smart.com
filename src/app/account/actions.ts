"use server";

import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { auth } from "~/server/auth";
import { homeForRole } from "~/server/auth/home";
import { api } from "~/trpc/server";

export type PasswordState = { error: string } | null;

/** Changes the signed-in user's password, then sends them home. */
export async function changePassword(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const newPassword = field("newPassword");

  if (newPassword !== field("confirmPassword")) {
    return { error: "The new passwords don't match." };
  }

  try {
    await api.account.changePassword({
      currentPassword: field("currentPassword"),
      newPassword,
    });
  } catch (error) {
    if (error instanceof TRPCError) {
      return {
        error:
          error.cause instanceof ZodError
            ? (error.cause.issues[0]?.message ?? "Check your password.")
            : error.message,
      };
    }
    throw error;
  }

  const session = await auth();
  redirect(homeForRole(session?.user.role));
}
