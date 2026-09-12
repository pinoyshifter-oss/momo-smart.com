"use client";

import { useState } from "react";

import { PlusCircleIcon, SearchIcon, UsersIcon } from "~/app/_components/icons";
import { Avatar } from "~/app/_components/ui";
import {
  displayName,
  listTime,
  ROLE_ORDER,
  ROLE_STYLE,
  type InboxThread,
  type Role,
  type Viewer,
} from "./shared";

type Filter = "all" | "unread" | Role;

export function Inbox({
  threads,
  viewer,
  activeId,
  onSelect,
  onCompose,
  className,
}: {
  threads: InboxThread[] | undefined;
  viewer: Viewer;
  activeId: string | null;
  onSelect: (id: string) => void;
  onCompose: () => void;
  className: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const all = threads ?? [];
  const unreadTotal = all.reduce((sum, thread) => sum + thread.unread, 0);
  const rolesPresent = ROLE_ORDER.filter((role) =>
    all.some((thread) => thread.others.some((o) => o.role === role)),
  );

  const query = search.trim().toLowerCase();
  const shown = all.filter((thread) => {
    if (filter === "unread" && thread.unread === 0) return false;
    if (
      filter !== "all" &&
      filter !== "unread" &&
      !thread.others.some((o) => o.role === filter)
    ) {
      return false;
    }
    if (!query) return true;
    return [
      thread.subject,
      thread.lastMessagePreview,
      ...thread.others.flatMap((o) => [o.name, o.title, o.subtitle]),
    ].some((value) => value?.toLowerCase().includes(query));
  });

  const chips: Array<{ id: Filter; label: string; dot?: string }> = [
    { id: "all", label: "All" },
    ...(unreadTotal > 0
      ? [{ id: "unread" as const, label: `Unread (${unreadTotal})` }]
      : []),
    ...rolesPresent.map((role) => ({
      id: role,
      label: ROLE_STYLE[role].label,
      dot: ROLE_STYLE[role].dot,
    })),
  ];

  return (
    <div className={`border-line min-h-0 flex-col lg:border-r ${className}`}>
      <div className="border-line border-b px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-navy flex items-center gap-2 text-xl font-extrabold tracking-tight whitespace-nowrap">
              Messages Hub
              {unreadTotal > 0 && (
                <span className="bg-brand rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
                  {unreadTotal}
                </span>
              )}
            </h1>
            <p className="text-muted mt-0.5 text-xs">
              {viewer.role === "STUDENT"
                ? "Your teachers and school staff"
                : "Your students and school staff"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCompose}
            aria-label="New message"
            className="bg-navy hover:bg-navy-deep inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition"
          >
            <PlusCircleIcon className="size-4" />
            New
          </button>
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Filter conversations</span>
          <SearchIcon className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by name, subject, or role…"
            className="border-line bg-canvas text-ink placeholder:text-muted focus:border-brand focus:bg-surface focus:ring-brand/10 w-full rounded-xl border py-2 pr-3 pl-9 text-sm transition outline-none focus:ring-4"
          />
        </label>

        <div
          role="group"
          aria-label="Filter by type"
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {chips.map((chip) => {
            const active = chip.id === filter;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? "bg-navy text-white"
                    : "bg-canvas text-ink hover:bg-brand-soft"
                }`}
              >
                {chip.dot && (
                  <span
                    className={`size-1.5 rounded-full ${active ? "bg-white" : chip.dot}`}
                  />
                )}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Conversations">
        {threads === undefined ? (
          Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="border-line flex gap-3 border-b px-5 py-4">
              <span className="bg-canvas size-9 shrink-0 animate-pulse rounded-full" />
              <span className="flex-1 space-y-2">
                <span className="bg-canvas block h-3 w-2/3 animate-pulse rounded" />
                <span className="bg-canvas block h-3 w-full animate-pulse rounded" />
              </span>
            </li>
          ))
        ) : shown.length === 0 ? (
          <li className="text-muted px-5 py-10 text-center text-sm">
            {all.length === 0
              ? "No conversations yet. Start one with New Message."
              : "No conversations match."}
          </li>
        ) : (
          shown.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              viewer={viewer}
              active={thread.id === activeId}
              onSelect={onSelect}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function ThreadRow({
  thread,
  viewer,
  active,
  onSelect,
}: {
  thread: InboxThread;
  viewer: Viewer;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const primary = thread.others[0];
  const group = thread.others.length > 1;
  const unread = thread.unread > 0;
  const title = group
    ? (thread.subject ?? thread.others.map((o) => o.name).join(", "))
    : primary
      ? displayName(primary)
      : "Just you";

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(thread.id)}
        aria-current={active ? "true" : undefined}
        className={`border-line relative flex w-full gap-3 border-b px-5 py-4 text-left transition ${
          active ? "bg-brand-soft/70" : "hover:bg-canvas"
        }`}
      >
        {active && <span className="bg-navy absolute inset-y-0 left-0 w-1" />}
        {group ? (
          <span className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-full">
            <UsersIcon className="size-4" />
          </span>
        ) : (
          <Avatar name={primary?.name} />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={`text-ink truncate text-sm ${unread ? "font-extrabold" : "font-bold"}`}
            >
              {title}
            </span>
            <span
              className={`shrink-0 text-[11px] ${unread ? "text-brand font-bold" : "text-muted"}`}
            >
              {listTime(thread.lastMessageAt)}
            </span>
          </span>
          <span
            className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              group
                ? "bg-slate-100 text-slate-600"
                : ROLE_STYLE[primary?.role ?? "STUDENT"].pill
            }`}
          >
            {group
              ? `Group • ${thread.others.length + 1} members`
              : (primary?.subtitle ??
                ROLE_STYLE[primary?.role ?? "STUDENT"].label)}
          </span>
          {thread.subject && !group && (
            <span className="text-ink/80 mt-1 block truncate text-xs font-semibold">
              {thread.subject}
            </span>
          )}
          <span className="mt-0.5 flex items-center gap-2">
            <span
              className={`line-clamp-1 flex-1 text-xs ${unread ? "text-ink" : "text-muted"}`}
            >
              {thread.lastSenderId === viewer.id && "You: "}
              {thread.lastMessagePreview ?? "No messages yet"}
            </span>
            {unread && (
              <span className="bg-brand shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white">
                {thread.unread}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}
