import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { Wordmark } from "~/app/_components/brand";
import { Avatar } from "~/app/_components/ui";
import { logout } from "~/app/login/actions";
import { auth } from "~/server/auth";
import { homeForRole } from "~/server/auth/home";

export const metadata: Metadata = {
  title: "Waitlist · Momo Smart",
  description: "Early-access requests from the public demo page.",
};

/**
 * The superadmin's only area. The procedures behind it check the role again,
 * so this guard is about sending people to the right place, not secrecy.
 */
export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPERADMIN") {
    redirect(homeForRole(session.user.role));
  }

  const name = session.user.name ?? "Superadmin";

  return (
    <div className="bg-canvas min-h-screen">
      <header className="border-line bg-surface/90 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Wordmark label="Superadmin" href="/superadmin" />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-ink text-sm font-bold">{name}</p>
              <p className="text-muted text-xs">{session.user.email}</p>
            </div>
            <Avatar name={name} />
            <form action={logout}>
              <button
                type="submit"
                className="border-line bg-surface text-ink hover:bg-canvas rounded-lg border px-3 py-2 text-xs font-semibold transition"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 lg:px-8">{children}</main>
    </div>
  );
}
