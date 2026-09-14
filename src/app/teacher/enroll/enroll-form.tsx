"use client";

import { useActionState } from "react";

import { enrollStudent, type EnrollState } from "../actions";

export function EnrollForm({
  sectionId,
  full,
}: {
  sectionId: string;
  full: boolean;
}) {
  const [state, action, pending] = useActionState<EnrollState, FormData>(
    enrollStudent,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="sectionId" value={sectionId} />
      <label className="block">
        <span className="text-ink text-xs font-bold">Student ID or email</span>
        <input
          name="identifier"
          required
          autoComplete="off"
          placeholder="OHS-28491 or name@school.edu"
          disabled={full || pending}
          className="border-line bg-canvas text-ink placeholder:text-muted focus:border-brand focus:bg-surface focus:ring-brand/10 mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm transition outline-none focus:ring-4 disabled:opacity-60"
        />
      </label>

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
        >
          {state.error}
        </p>
      )}
      {state?.enrolled && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
        >
          {state.enrolled} was added to the roster.
        </p>
      )}

      <button
        type="submit"
        disabled={full || pending}
        className="bg-brand hover:bg-brand/90 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
      >
        {pending ? "Enrolling…" : "Enroll student"}
      </button>
      {full && (
        <p className="text-muted text-xs">This section is at capacity.</p>
      )}
    </form>
  );
}
