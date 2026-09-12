"use client";

import { useEffect, useId, useState } from "react";

import { SearchIcon } from "~/app/_components/icons";
import { Avatar } from "~/app/_components/ui";
import { api as trpc } from "~/trpc/react";
import {
  displayName,
  ROLE_STYLE,
  type Contact,
  type InboxThread,
} from "./shared";

const ROLE_TAG = { TEACHER: "Teacher", ADMIN: "Staff", STUDENT: "Student" };

/**
 * Pick someone you share a class with and send a first message. The server
 * checks the pairing against the school database before Convex sees it.
 */
export function NewMessageDialog({
  contacts,
  threads,
  onClose,
  onOpen,
}: {
  contacts: Contact[];
  threads: InboxThread[];
  onClose: () => void;
  onOpen: (conversationId: string) => void;
}) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Contact | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const start = trpc.messaging.start.useMutation({
    onSuccess: ({ conversationId }) => onOpen(conversationId),
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const matches = contacts.filter(
    (contact) =>
      !q ||
      [contact.name, contact.title, contact.subtitle, ...contact.courses].some(
        (value) => value?.toLowerCase().includes(q),
      ),
  );
  const existing = picked
    ? threads.find(
        (thread) =>
          thread.others.length === 1 &&
          thread.others[0]?.userId === picked.userId,
      )
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="bg-ink/40 absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface shadow-card relative flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl"
      >
        <div className="border-line flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 id={titleId} className="text-ink text-base font-bold">
            {picked ? `Message ${displayName(picked)}` : "New Message"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink text-xs font-semibold"
          >
            Cancel
          </button>
        </div>

        {picked ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!body.trim()) return;
              start.mutate({
                recipientIds: [picked.userId],
                subject: subject.trim() || undefined,
                body: body.trim(),
              });
            }}
            className="space-y-4 overflow-y-auto p-5"
          >
            <div className="bg-canvas flex items-center gap-3 rounded-xl px-3 py-2.5">
              <Avatar name={picked.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-sm font-bold">
                  {displayName(picked)}
                </p>
                <p className="text-muted truncate text-xs">{picked.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="text-brand text-xs font-semibold hover:underline"
              >
                Change
              </button>
            </div>

            {existing && (
              <div className="bg-brand-soft/60 text-ink flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs">
                <span>You already have a conversation with this person.</span>
                <button
                  type="button"
                  onClick={() => onOpen(existing.id)}
                  className="text-brand font-bold hover:underline"
                >
                  Open it
                </button>
              </div>
            )}

            <label className="block">
              <span className="text-ink text-xs font-semibold">
                Subject{" "}
                <span className="text-muted font-normal">(optional)</span>
              </span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={200}
                placeholder="e.g. Lab 4 write-up question"
                className="border-line bg-canvas text-ink placeholder:text-muted focus:border-brand focus:bg-surface focus:ring-brand/10 mt-1 w-full rounded-xl border px-3 py-2 text-sm transition outline-none focus:ring-4"
              />
            </label>
            <label className="block">
              <span className="text-ink text-xs font-semibold">Message</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                rows={5}
                maxLength={20_000}
                className="border-line bg-canvas text-ink placeholder:text-muted focus:border-brand focus:bg-surface focus:ring-brand/10 mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm transition outline-none focus:ring-4"
              />
            </label>

            {start.error && (
              <p role="alert" className="text-xs font-semibold text-rose-600">
                {start.error.message}
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={start.isPending || !body.trim()}
                className="bg-navy hover:bg-navy-deep rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {start.isPending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="border-line border-b px-5 py-3">
              <label className="relative block">
                <span className="sr-only">Search people</span>
                <SearchIcon className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  // The dialog opens on request, so focusing its search is expected.
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, course or role…"
                  className="border-line bg-canvas text-ink placeholder:text-muted focus:border-brand focus:bg-surface focus:ring-brand/10 w-full rounded-xl border py-2 pr-3 pl-9 text-sm transition outline-none focus:ring-4"
                />
              </label>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {matches.length === 0 ? (
                <li className="text-muted px-3 py-8 text-center text-sm">
                  {contacts.length === 0
                    ? "There's no one you can message yet."
                    : "No one matches."}
                </li>
              ) : (
                matches.map((contact) => (
                  <li key={contact.userId}>
                    <button
                      type="button"
                      onClick={() => setPicked(contact)}
                      className="hover:bg-canvas flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                    >
                      <Avatar name={contact.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block truncate text-sm font-bold">
                          {displayName(contact)}
                        </span>
                        <span className="text-muted block truncate text-xs">
                          {contact.courses.length > 0
                            ? contact.courses.join(", ")
                            : contact.subtitle}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ROLE_STYLE[contact.role].pill}`}
                      >
                        {ROLE_TAG[contact.role]}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
