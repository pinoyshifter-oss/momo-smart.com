import type { FunctionReturnType } from "convex/server";

import type { api } from "@convex/_generated/api";
import type { RouterOutputs } from "~/trpc/react";

export type InboxThread = FunctionReturnType<
  typeof api.messaging.inbox
>[number];
export type ThreadData = FunctionReturnType<typeof api.messaging.thread>;
export type Member = InboxThread["others"][number];
export type Contact = RouterOutputs["messaging"]["contacts"][number];
export type Role = Member["role"];
export type Viewer = { id: string; name: string; role: Role };

export const ROLE_STYLE: Record<
  Role,
  { label: string; pill: string; dot: string }
> = {
  TEACHER: {
    label: "Teachers",
    pill: "bg-brand-soft text-brand",
    dot: "bg-brand",
  },
  ADMIN: {
    label: "Admin & Staff",
    pill: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  STUDENT: {
    label: "Students",
    pill: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
};

export const ROLE_ORDER: Role[] = ["TEACHER", "ADMIN", "STUDENT"];

/** "Dr. Aris Chen" */
export const displayName = (person: { name: string; title: string | null }) =>
  [person.title, person.name].filter(Boolean).join(" ");

/** How to greet someone: "Dr. Chen" for staff, "Alex" for a student. */
export function greetingName(person: {
  name: string;
  title: string | null;
  role: Role;
}): string {
  const parts = person.name.split(" ");
  if (person.role === "STUDENT") return parts[0] ?? person.name;
  return person.title ? `${person.title} ${parts.at(-1)}` : person.name;
}

export const clockTime = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);

/** Inbox timestamps: "10:42 AM", "Yesterday", "Tue", "Oct 24". */
export function listTime(ms: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / 86_400_000);
  if (days <= 0) return clockTime(ms);
  if (days === 1) return "Yesterday";
  if (days < 7) {
    return new Date(ms).toLocaleDateString("en-US", { weekday: "short" });
  }
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Thread day separators: "Today, October 25, 2024". */
export function dayLabel(ms: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / 86_400_000);
  const date = new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  if (days === 0) return `Today, ${date}`;
  if (days === 1) return `Yesterday, ${date}`;
  return new Date(ms).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export type Template = { label: string; text: string };

/** Openers for the composer's quick templates. */
export function templatesFor(
  viewer: Role,
  recipient: Member | undefined,
): Template[] {
  const hi = recipient ? `Hi ${greetingName(recipient)}, ` : "Hi, ";
  if (viewer === "STUDENT") {
    return [
      {
        label: "Request office hours",
        text: `${hi}could I stop by your office hours this week to go over `,
      },
      {
        label: "Question about feedback",
        text: `${hi}I had a question about the feedback on `,
      },
      {
        label: "Ask for an extension",
        text: `${hi}would a short extension be possible on `,
      },
    ];
  }
  return [
    {
      label: "Check in",
      text: `${hi}just checking in on how things are going with `,
    },
    { label: "Missing work", text: `${hi}I'm still waiting on your work for ` },
    {
      label: "Office hours invite",
      text: `${hi}come by my office hours this week and we can work through `,
    },
  ];
}
