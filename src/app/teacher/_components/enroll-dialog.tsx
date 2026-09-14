"use client";

import { startTransition, useActionState, useRef, useState } from "react";

import {
  AlertIcon,
  CheckCircleIcon,
  UserPlusIcon,
} from "~/app/_components/icons";
import type { StudentEmailRule } from "~/server/lib/credentials";
import {
  createStudent,
  type CreateStudentResult,
  type CreateStudentState,
} from "../actions";

type SectionOption = { id: string; label: string };

const FIELD =
  "border-line bg-surface text-ink placeholder:text-muted/70 focus:border-brand focus:ring-brand/10 w-full rounded-lg border px-3 py-2.5 text-sm transition outline-none focus:ring-4";
const LABEL = "text-ink mb-1.5 block text-xs font-bold";
const GRADES = [7, 8, 9, 10, 11, 12];

/**
 * The dashboard's Enroll button: opens a dialog that creates a student
 * account, enrols it and emails the student their sign-in details.
 */
export function EnrollStudentDialog({
  sections,
  emailRule,
  defaultSectionId,
  label = "Enroll",
  className,
}: {
  sections: SectionOption[];
  emailRule: StudentEmailRule;
  defaultSectionId?: string;
  label?: string;
  className: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Bumped on close, so every opening starts from a blank form.
  const [round, setRound] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={className}
      >
        <UserPlusIcon className="size-4" />
        {label}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="enroll-student-title"
        onClose={() => setRound((value) => value + 1)}
        className="bg-surface m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/50"
      >
        <EnrollStudentForm
          key={round}
          sections={sections}
          emailRule={emailRule}
          defaultSectionId={defaultSectionId}
          onClose={() => dialog.current?.close()}
          onAgain={() => setRound((value) => value + 1)}
        />
      </dialog>
    </>
  );
}

function EnrollStudentForm({
  sections,
  emailRule,
  defaultSectionId,
  onClose,
  onAgain,
}: {
  sections: SectionOption[];
  emailRule: StudentEmailRule;
  defaultSectionId?: string;
  onClose: () => void;
  onAgain: () => void;
}) {
  const [state, action, pending] = useActionState<CreateStudentState, FormData>(
    createStudent,
    null,
  );

  if (state && "result" in state) {
    return (
      <EnrollResult result={state.result} onClose={onClose} onAgain={onAgain} />
    );
  }

  const canEnroll = emailRule.kind !== "unknown" && sections.length > 0;

  return (
    <form
      // Submitted by hand rather than through `action`, which would reset the
      // fields after a rejected attempt and make the teacher retype them.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Header onClose={onClose} />

      {emailRule.kind === "unknown" ? (
        <p className="m-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Student accounts use your school&apos;s email domain. Sign in with
          your school email address to enroll students.
        </p>
      ) : sections.length === 0 ? (
        <p className="text-muted m-5 text-sm">
          You have no sections this term yet.{" "}
          <a
            href="/teacher/settings"
            className="text-brand font-semibold hover:underline"
          >
            Add a section in Class Settings
          </a>{" "}
          first, then enroll students into it.
        </p>
      ) : (
        <div className="space-y-4 px-5 py-5">
          <div>
            <label htmlFor="enroll-name" className={LABEL}>
              Full name
            </label>
            <input
              id="enroll-name"
              name="name"
              required
              autoComplete="off"
              placeholder="Maya Lin"
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor="enroll-email" className={LABEL}>
              {emailRule.kind === "school" ? "School email" : "Email"}
            </label>
            <input
              id="enroll-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder={
                emailRule.kind === "school"
                  ? `firstname.lastname@${emailRule.domain}`
                  : "student@example.com"
              }
              className={FIELD}
            />
            <p className="text-muted mt-1 text-[11px]">
              {emailRule.kind === "school"
                ? `Must be an @${emailRule.domain} address (or a subdomain of it).`
                : "Test mode: any email address is accepted."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="enroll-grade" className={LABEL}>
                Grade level
              </label>
              <select
                id="enroll-grade"
                name="gradeLevel"
                required
                defaultValue=""
                className={FIELD}
              >
                <option value="" disabled>
                  Select grade
                </option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="enroll-homeroom" className={LABEL}>
                Homeroom <span className="text-muted font-medium">(optional)</span>
              </label>
              <input
                id="enroll-homeroom"
                name="homeroom"
                autoComplete="off"
                placeholder="11-B"
                className={FIELD}
              />
            </div>
          </div>

          <div>
            <label htmlFor="enroll-section" className={LABEL}>
              Enroll in section
            </label>
            <select
              id="enroll-section"
              name="sectionId"
              required
              defaultValue={defaultSectionId ?? sections[0]?.id}
              className={FIELD}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <p className="bg-brand-soft/70 text-navy rounded-lg px-3 py-2.5 text-xs leading-relaxed">
            A student ID and a temporary password are generated automatically
            and emailed to the student. They&apos;ll choose their own password
            when they first sign in.
          </p>

          {state?.error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700"
            >
              <AlertIcon className="mt-px size-4 shrink-0" />
              {state.error}
            </p>
          )}
        </div>
      )}

      <div className="border-line flex justify-end gap-2 border-t px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="border-line text-ink hover:bg-canvas rounded-lg border px-4 py-2.5 text-sm font-semibold transition"
        >
          Cancel
        </button>
        {canEnroll && (
          <button
            type="submit"
            disabled={pending}
            className="bg-brand hover:bg-brand/90 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          >
            {pending ? "Creating account…" : "Create & enroll"}
          </button>
        )}
      </div>
    </form>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-line flex items-start justify-between gap-3 border-b px-5 py-4">
      <div>
        <h2 id="enroll-student-title" className="text-ink text-lg font-bold">
          Enroll a student
        </h2>
        <p className="text-muted mt-0.5 text-xs">
          Creates the student&apos;s account and adds them to your section.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="text-muted hover:bg-canvas hover:text-ink -mr-1 rounded-lg px-2 py-1 text-lg leading-none transition"
      >
        ×
      </button>
    </div>
  );
}

function EnrollResult({
  result,
  onClose,
  onAgain,
}: {
  result: CreateStudentResult;
  onClose: () => void;
  onAgain: () => void;
}) {
  const created = result.kind === "CREATED";

  return (
    <div>
      <div className="px-5 pt-6 pb-5">
        <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircleIcon className="size-5" />
        </span>
        <h2 id="enroll-student-title" className="text-ink mt-3 text-lg font-bold">
          {created ? "Student account created" : "Student enrolled"}
        </h2>
        <p className="text-muted mt-1 text-sm">
          {result.name} is now enrolled in {result.sectionName}.
          {!created && " They already had an account, so their password is unchanged."}
        </p>

        <dl className="border-line bg-canvas divide-line mt-4 divide-y rounded-xl border">
          <Detail label="Student ID" value={result.studentNumber} mono />
          <Detail label="Email" value={result.email} />
          {created && result.temporaryPassword && (
            <Detail
              label="Temporary password"
              value={result.temporaryPassword}
              mono
            />
          )}
        </dl>

        {created &&
          (result.emailed ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
              Sign-in details were emailed to {result.email}.
            </p>
          ) : (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800"
            >
              <span className="font-bold">
                The email wasn&apos;t sent ({result.emailError}).
              </span>{" "}
              Share these details with the student privately — the temporary
              password won&apos;t be shown again.
            </p>
          ))}
      </div>

      <div className="border-line flex justify-end gap-2 border-t px-5 py-4">
        <button
          type="button"
          onClick={onAgain}
          className="border-line text-ink hover:bg-canvas rounded-lg border px-4 py-2.5 text-sm font-semibold transition"
        >
          Enroll another
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-navy hover:bg-navy-deep rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <dt className="text-muted w-36 shrink-0 text-xs">{label}</dt>
      <dd
        className={`text-ink min-w-0 flex-1 truncate text-sm font-bold ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="text-brand shrink-0 text-xs font-semibold hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
