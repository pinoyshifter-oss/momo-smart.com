import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Wordmark } from "~/app/_components/brand";
import { CheckIcon } from "~/app/_components/icons";
import { LoginForm } from "~/app/login/login-form";
import { auth } from "~/server/auth";
import { homeForRole } from "~/server/auth/home";

export const metadata: Metadata = {
  title: "Student sign in",
  description: "Sign in to your Smart Momo student account.",
  robots: { index: false, follow: false },
};

const HIGHLIGHTS = [
  "Assignments and due dates for every class",
  "Your scores, star points and attendance",
  "Lessons that pick up where you left off",
];

/**
 * The students' own sign-in page — linked from the welcome email. It lives
 * outside the student area's layout, which requires a signed-in student.
 */
export default async function StudentLoginPage() {
  const session = await auth();
  if (session?.user) redirect(homeForRole(session.user.role));

  return (
    <main className="bg-canvas min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel — hidden on small screens, where the form leads. */}
      <aside className="bg-navy-deep relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="bg-brand/25 absolute -top-32 -right-24 size-96 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-pumpkin/15 absolute -bottom-40 -left-24 size-96 rounded-full blur-3xl"
        />

        <div className="relative">
          <Wordmark label="Student Portal" tone="dark" />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white">
            Your classes, all in one place.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((highlight) => (
              <li
                key={highlight}
                className="flex items-start gap-3 text-white/80"
              >
                <span className="bg-brand/30 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white">
                  <CheckIcon className="size-3.5" />
                </span>
                <span className="text-[15px]">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/45">
          Smart Momo LMS · Student access
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex min-h-screen flex-col px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between lg:hidden">
          <Wordmark label="Student Portal" />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <LoginForm audience="student" />
        </div>

        <p className="text-muted text-center text-sm">
          <Link href="/" className="text-brand font-semibold hover:underline">
            ← Back to home
          </Link>
        </p>
      </section>
    </main>
  );
}
