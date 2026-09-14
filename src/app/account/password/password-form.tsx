"use client";

import { useActionState } from "react";

import { changePassword, type PasswordState } from "../actions";

const FIELD =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/12";
const LABEL = "mb-1.5 block text-sm font-semibold text-ink";

export function PasswordForm({ temporary }: { temporary: boolean }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    changePassword,
    null,
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="current-password" className={LABEL}>
          {temporary ? "Temporary password" : "Current password"}
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="new-password" className={LABEL}>
          New password
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={FIELD}
        />
        <p className="text-muted mt-1 text-xs">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className={LABEL}>
          Confirm new password
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={FIELD}
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-navy hover:bg-navy-deep w-full rounded-xl px-4 py-3.5 text-[15px] font-semibold text-white transition disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
