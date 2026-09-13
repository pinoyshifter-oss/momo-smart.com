import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Wordmark } from "~/app/_components/brand";
import { CheckIcon } from "~/app/_components/icons";
import { auth } from "~/server/auth";
import { homeForRole } from "~/server/auth/home";
import { TeacherOnboarding } from "./_components/teacher-onboarding";

export const metadata: Metadata = {
  title: "Teacher registration",
  description:
    "Create your Smart Momo teacher account: find or add your school, set up your profile and open your command center.",
};

const STEPS = [
  "Find your school — or add it if it isn't listed yet",
  "Set up your profile with a photo, name and subject",
  "Choose your sign-in email and password",
];

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect(homeForRole(session.user.role));

  return (
    <main className="bg-canvas min-h-screen lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
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
          <Wordmark label="Learning Management" tone="dark" />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white">
            Bring your classroom to Smart Momo.
          </h2>
          <ol className="mt-8 space-y-3.5">
            {STEPS.map((step) => (
              <li key={step} className="flex items-start gap-3 text-white/80">
                <span className="bg-brand/30 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white">
                  <CheckIcon className="size-3.5" />
                </span>
                <span className="text-[15px]">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative text-xs text-white/45">
          Smart Momo LMS · Teacher registration
        </p>
      </aside>

      <section className="flex min-h-screen flex-col px-5 py-10 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between lg:hidden">
          <Wordmark label="Learning Management" />
        </div>

        <div className="flex flex-1 items-start justify-center py-10 lg:items-center">
          <TeacherOnboarding />
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
