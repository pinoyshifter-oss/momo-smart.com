"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useId, useState, useTransition } from "react";

import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
} from "~/app/_components/icons";
import { Avatar } from "~/app/_components/ui";
import { registerTeacher } from "../actions";
import {
  type OrganizationChoice,
  type RegistrationState,
} from "../registration";
import { ProfileStep, type ProfileValues } from "./profile-step";
import { SchoolStep } from "./school-step";
import { BACK, INPUT, LABEL, PRIMARY } from "./styles";

type Step = NonNullable<RegistrationState["step"]>;

const STEPS: { key: Step; label: string }[] = [
  { key: "school", label: "School" },
  { key: "profile", label: "Profile" },
  { key: "account", label: "Account" },
];

const HEADINGS: Record<Step, { title: string; body: string }> = {
  school: {
    title: "Where do you teach?",
    body: "Search for your school or organization. If it isn't listed yet, add it and colleagues can find it after you.",
  },
  profile: {
    title: "Set up your profile",
    body: "This is how students and colleagues will see you across Smart Momo.",
  },
  account: {
    title: "Create your sign-in",
    body: "You'll use this email and password to open your teacher dashboard.",
  },
};

/**
 * Three-step teacher onboarding. Everything stays in the browser until the
 * last step, so an abandoned registration leaves no account or school behind.
 */
export function TeacherOnboarding() {
  const [step, setStep] = useState<Step>("school");
  const [organization, setOrganization] = useState<OrganizationChoice | null>(
    null,
  );
  const [profile, setProfile] = useState<ProfileValues>({
    title: "",
    name: "",
    subject: "",
    phone: "",
    officeLocation: "",
    bio: "",
    photo: "",
  });
  const [account, setAccount] = useState({
    email: "",
    password: "",
    confirm: "",
  });
  const [website, setWebsite] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const id = useId();

  const current = STEPS.findIndex((entry) => entry.key === step);

  const goTo = (next: Step) => {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return goTo("school");
    if (account.password !== account.confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        // Resolves only on failure; success redirects to the dashboard.
        const result = await registerTeacher({
          organization,
          ...profile,
          email: account.email,
          password: account.password,
          website,
        });
        if (result.error) {
          setError(result.error);
          if (result.step) setStep(result.step);
        }
      } catch (error) {
        // Let Next's own redirect through.
        unstable_rethrow(error);
        // Most often the app was updated while this page was open, so the
        // page's reference to the action no longer exists on the server.
        setError(
          "Smart Momo was updated while you were registering. Refresh the page and try again.",
        );
      }
    });
  };

  const bindAccount = (name: keyof typeof account) => ({
    id: `${id}-${name}`,
    name,
    value: account[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setAccount((values) => ({ ...values, [name]: event.target.value })),
  });

  const displayName = [profile.title, profile.name].filter(Boolean).join(" ");

  return (
    <div className="w-full max-w-xl">
      {/* Progress */}
      <ol className="flex items-center gap-2" aria-label="Registration steps">
        {STEPS.map((entry, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={entry.key} className="flex flex-1 items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? "bg-brand text-white"
                    : active
                      ? "bg-navy text-white"
                      : "bg-line text-muted"
                }`}
              >
                {done ? <CheckIcon className="size-3.5" /> : index + 1}
              </span>
              <span
                className={`text-sm font-semibold ${active ? "text-ink" : "text-muted"}`}
              >
                {entry.label}
              </span>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 ${done ? "bg-brand" : "bg-line"}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-brand mt-8 text-xs font-bold tracking-[0.12em] uppercase">
        Teacher registration · Step {current + 1} of {STEPS.length}
      </p>
      <h1 className="text-ink mt-2 text-3xl font-extrabold tracking-tight">
        {HEADINGS[step].title}
      </h1>
      <p className="text-muted mt-2 text-[15px]">{HEADINGS[step].body}</p>

      {error && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          <AlertIcon className="mt-px size-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-6">
        {step === "school" && (
          <SchoolStep
            value={organization}
            onChange={setOrganization}
            onNext={() => goTo("profile")}
          />
        )}

        {step === "profile" && (
          <ProfileStep
            value={profile}
            onChange={setProfile}
            onBack={() => goTo("school")}
            onNext={() => goTo("account")}
          />
        )}

        {step === "account" && organization && (
          <form onSubmit={submit} className="relative space-y-4">
            {/* Review */}
            <div className="border-line bg-surface flex items-center gap-4 rounded-2xl border p-4">
              <Avatar name={profile.name} src={profile.photo} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate font-bold">{displayName}</p>
                <p className="text-muted truncate text-sm">
                  {profile.subject} · {organization.name}
                  {organization.kind === "new" && (
                    <span className="text-brand font-semibold"> (new)</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => goTo("profile")}
                className="text-brand shrink-0 text-xs font-semibold hover:underline"
              >
                Edit
              </button>
            </div>

            <div>
              <label htmlFor={`${id}-email`} className={LABEL}>
                Email
              </label>
              <input
                {...bindAccount("email")}
                type="email"
                autoComplete="email"
                required
                placeholder="you@yourschool.edu"
                className={INPUT}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label
                  htmlFor={`${id}-password`}
                  className="text-ink text-sm font-semibold"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-brand text-xs font-semibold hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                {...bindAccount("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                placeholder="At least 8 characters"
                className={INPUT}
              />
            </div>

            <div>
              <label htmlFor={`${id}-confirm`} className={LABEL}>
                Confirm password
              </label>
              <input
                {...bindAccount("confirm")}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                className={INPUT}
              />
            </div>

            {/* Honeypot — hidden from people and assistive tech, filled by bots. */}
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] size-px overflow-hidden"
            >
              <label>
                Website
                <input
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => goTo("profile")}
                disabled={pending}
                className={BACK}
              >
                Back
              </button>
              <button type="submit" disabled={pending} className={PRIMARY}>
                {pending ? "Creating your account…" : "Create account"}
                {!pending && (
                  <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
                )}
              </button>
            </div>

            <p className="text-muted flex items-center justify-center gap-1.5 text-xs">
              <LockIcon className="size-3.5" />
              You&apos;ll be signed in and taken to your teacher dashboard.
            </p>
          </form>
        )}
      </div>

      <p className="text-muted mt-8 text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
