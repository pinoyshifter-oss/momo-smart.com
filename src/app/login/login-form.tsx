"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { AlertIcon, ArrowRightIcon, LockIcon } from "~/app/_components/icons";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

/**
 * Email + password sign-in. The student portal (`audience="student"`) only
 * accepts student accounts and leaves out teacher registration.
 */
export function LoginForm({
  audience = "everyone",
}: {
  audience?: "everyone" | "student";
}) {
  const [state, formAction, pending] = useActionState(login, initialState);
  // Controlled so a failed attempt keeps the email; React resets uncontrolled
  // fields once a form action finishes.
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const student = audience === "student";

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">
        {student ? "Student sign in" : "Welcome back"}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {student
          ? "Use the email and password from your welcome email. Signing in for the first time? Enter your temporary password — you'll choose your own right after."
          : "Sign in with your school account to reach your courses, grading queue and assessments."}
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        {student && <input type="hidden" name="audience" value="student" />}

        {state.error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            <AlertIcon className="mt-px size-4 shrink-0" />
            {state.error}
          </p>
        )}

        <div>
          <label
            htmlFor={emailId}
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            {student ? "Email" : "School email"}
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={student ? "you@example.com" : "you@momosmart.edu"}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/12"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor={passwordId} className="text-sm font-semibold text-ink">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/12"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-navy-deep focus:ring-4 focus:ring-navy/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Signing in…" : "Sign in"}
          {!pending && (
            <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <LockIcon className="size-3.5" />
          Sessions last 12 hours and are signed on the server.
        </p>
      </form>

      {student ? (
        <p className="mt-6 text-center text-sm text-muted">
          Can&apos;t sign in? Ask your teacher to check your account.
        </p>
      ) : (
        <Link
          href="/register"
          className="border-line bg-surface text-ink hover:bg-canvas mt-6 flex w-full items-center justify-center rounded-xl border px-4 py-3 text-[15px] font-semibold transition"
        >
          New teacher? Register here
        </Link>
      )}
    </div>
  );
}
