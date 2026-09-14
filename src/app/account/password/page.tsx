import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoMark } from "~/app/_components/brand";
import { logout } from "~/app/login/actions";
import { auth } from "~/server/auth";
import { homeForRole } from "~/server/auth/home";
import { api } from "~/trpc/server";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = {
  title: "Change password",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Change-password screen for any signed-in user. Students created with a
 * temporary password are sent here until they choose their own.
 */
export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { mustChangePassword } = await api.account.passwordStatus();

  return (
    <main className="bg-canvas flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <LogoMark className="size-10" />
          <span className="text-navy text-xl font-extrabold tracking-tight">
            Smart Momo
          </span>
        </div>

        <section className="border-line bg-surface shadow-card rounded-2xl border p-6 sm:p-8">
          <h1 className="text-ink text-2xl font-extrabold tracking-tight">
            {mustChangePassword ? "Set your password" : "Change password"}
          </h1>
          <p className="text-muted mt-2 text-sm">
            {mustChangePassword
              ? "You signed in with a temporary password. Choose your own to continue."
              : "Enter your current password, then choose a new one."}
          </p>
          <PasswordForm temporary={mustChangePassword} />
        </section>

        <div className="mt-4 flex items-center justify-center gap-5 text-sm">
          {!mustChangePassword && (
            <Link
              href={homeForRole(session.user.role)}
              className="text-brand font-semibold hover:underline"
            >
              Back to dashboard
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="text-muted hover:text-ink font-semibold transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
