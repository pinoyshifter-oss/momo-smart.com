"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useRef, useState } from "react";

import { api } from "@convex/_generated/api";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  UsersIcon,
} from "~/app/_components/icons";
import { Avatar } from "~/app/_components/ui";
import {
  clockTime,
  dayLabel,
  displayName,
  ROLE_STYLE,
  templatesFor,
  type InboxThread,
  type Viewer,
} from "./shared";

const MAX_LENGTH = 20_000;

/** One conversation, live from Convex, with the composer underneath. */
export function ThreadView({
  summary,
  viewer,
  onBack,
  onShowDetails,
}: {
  summary: InboxThread;
  viewer: Viewer;
  onBack: () => void;
  onShowDetails: () => void;
}) {
  const thread = useQuery(api.messaging.thread, {
    conversationId: summary.id,
  });
  const markRead = useMutation(api.messaging.markRead);
  const endRef = useRef<HTMLLIElement>(null);

  const primary = summary.others[0];
  const group = summary.others.length > 1;
  const title = group
    ? (summary.subject ?? summary.others.map((o) => o.name).join(", "))
    : primary
      ? displayName(primary)
      : "Just you";

  const messages = thread?.messages ?? [];
  const latest = messages.at(-1);
  const me = thread?.members.find((m) => m.userId === viewer.id);

  // Reading the thread marks it read, including messages that arrive while open.
  useEffect(() => {
    if (
      latest &&
      me &&
      latest.sentAt > me.lastReadAt &&
      document.visibilityState === "visible"
    ) {
      void markRead({ conversationId: summary.id });
    }
  }, [latest, me, markRead, summary.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const members = new Map(thread?.members.map((m) => [m.userId, m]));
  const others = thread?.members.filter((m) => m.userId !== viewer.id) ?? [];
  const lastMine = [...messages]
    .reverse()
    .find((m) => m.senderId === viewer.id);

  let previousDay = "";
  let previousSender = "";

  return (
    <>
      <header className="border-line flex items-center gap-3 border-b px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="text-muted hover:bg-canvas hover:text-ink -ml-1 rounded-lg p-1.5 transition lg:hidden"
        >
          <ChevronRightIcon className="size-5 rotate-180" />
        </button>
        {group ? (
          <span className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-full">
            <UsersIcon className="size-4" />
          </span>
        ) : (
          <Avatar name={primary?.name} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate text-base font-bold">{title}</p>
          <p className="text-muted truncate text-xs">
            {[
              group
                ? `${summary.others.length + 1} members`
                : primary?.subtitle,
              summary.subject,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onShowDetails}
          className="border-line text-ink hover:bg-canvas shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition 2xl:hidden"
        >
          Details
        </button>
      </header>

      <ol
        className="bg-canvas/40 min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-5 sm:px-6"
        aria-live="polite"
        aria-busy={thread === undefined}
      >
        {thread === undefined ? (
          <li className="text-muted py-10 text-center text-sm">
            Loading conversation…
          </li>
        ) : messages.length === 0 ? (
          <li className="text-muted py-10 text-center text-sm">
            No messages yet.
          </li>
        ) : (
          messages.map((message) => {
            const day = new Date(message.sentAt).toDateString();
            const newDay = day !== previousDay;
            const newSender = newDay || message.senderId !== previousSender;
            previousDay = day;
            previousSender = message.senderId;

            const mine = message.senderId === viewer.id;
            const sender = members.get(message.senderId);
            const read =
              others.length > 0 &&
              others.every((o) => o.lastReadAt >= message.sentAt);

            return (
              <li key={message.id}>
                {newDay && (
                  <p className="my-4 text-center">
                    <span className="bg-brand-soft text-navy inline-block rounded-full px-3 py-1 text-xs font-semibold">
                      {dayLabel(message.sentAt)}
                    </span>
                  </p>
                )}
                <div
                  className={`flex gap-2.5 ${mine ? "justify-end" : ""} ${newSender ? "mt-4" : "mt-1"}`}
                >
                  {!mine && (
                    <span className="w-8 shrink-0">
                      {newSender && <Avatar name={sender?.name} size="sm" />}
                    </span>
                  )}
                  <div
                    className={`flex max-w-[85%] flex-col sm:max-w-[72%] ${mine ? "items-end" : "items-start"}`}
                  >
                    {newSender && (
                      <p className="text-muted mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                        {mine ? (
                          <span className="font-semibold">You</span>
                        ) : (
                          <>
                            <span className="text-ink font-bold">
                              {sender ? displayName(sender) : "Former member"}
                            </span>
                            {sender && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ROLE_STYLE[sender.role].pill}`}
                              >
                                {sender.role === "ADMIN"
                                  ? "Staff"
                                  : sender.role === "TEACHER"
                                    ? "Teacher"
                                    : "Student"}
                              </span>
                            )}
                          </>
                        )}
                        <span>{clockTime(message.sentAt)}</span>
                      </p>
                    )}
                    <p
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                        mine
                          ? "bg-navy rounded-tr-md text-white"
                          : "border-line bg-surface text-ink rounded-tl-md border"
                      }`}
                    >
                      {message.body}
                    </p>
                    {mine && message.id === lastMine?.id && (
                      <p className="text-muted mt-1 inline-flex items-center gap-1 text-[11px]">
                        {read && (
                          <CheckCircleIcon className="size-3.5 text-teal-600" />
                        )}
                        {read ? "Read" : "Delivered"}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })
        )}
        <li ref={endRef} aria-hidden="true" />
      </ol>

      <Composer
        key={summary.id}
        conversationId={summary.id}
        viewer={viewer}
        recipient={group ? undefined : primary}
        placeholder={`Write a message to ${title}…`}
      />
    </>
  );
}

function Composer({
  conversationId,
  viewer,
  recipient,
  placeholder,
}: {
  conversationId: InboxThread["id"];
  viewer: Viewer;
  recipient: InboxThread["others"][number] | undefined;
  placeholder: string;
}) {
  const send = useMutation(api.messaging.send);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await send({ conversationId, body: text });
      setBody("");
    } catch (caught) {
      setError(
        caught instanceof ConvexError
          ? String(caught.data)
          : "Couldn't send that. Check your connection and try again.",
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const insert = (text: string) => {
    setBody((current) =>
      current.trim() ? `${current.trimEnd()}\n${text}` : text,
    );
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="border-line border-t px-4 py-3 sm:px-5"
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-muted shrink-0 text-[11px] font-bold tracking-wide uppercase">
          Quick templates
        </span>
        {templatesFor(viewer.role, recipient).map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => insert(template.text)}
            className="border-line text-navy hover:bg-brand-soft shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition"
          >
            + {template.label}
          </button>
        ))}
      </div>

      <div className="border-line focus-within:border-brand focus-within:ring-brand/10 rounded-2xl border transition focus-within:ring-4">
        <label htmlFor={`composer-${conversationId}`} className="sr-only">
          Message
        </label>
        <textarea
          id={`composer-${conversationId}`}
          ref={inputRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void submit();
            }
          }}
          rows={3}
          maxLength={MAX_LENGTH}
          placeholder={placeholder}
          className="text-ink placeholder:text-muted block w-full resize-none rounded-t-2xl bg-transparent px-4 py-3 text-sm outline-none"
        />
        <div className="border-line flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5">
          <p className="text-muted text-[11px]">
            Enter to send • Shift + Enter for a new line
          </p>
          <button
            type="submit"
            disabled={sending || body.trim().length === 0}
            className="bg-navy hover:bg-navy-deep rounded-xl px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send Message"}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}
