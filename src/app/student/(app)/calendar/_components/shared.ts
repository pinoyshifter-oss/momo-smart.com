import { clockOf } from "~/app/_components/format";
import { shortDate } from "~/app/student/(app)/_components/format";
import { addDays, startOfDay } from "~/server/lib/dates";
import type { RouterOutputs } from "~/trpc/react";

export type ScheduleEntry =
  RouterOutputs["calendar"]["studentSchedule"][number];
export type ScheduleKind = ScheduleEntry["kind"];
export type OfficeHours = RouterOutputs["calendar"]["studentOfficeHours"];

export type View = "month" | "week" | "day";
export type Filter = "all" | ScheduleKind;

export const VIEWS: Array<{ id: View; label: string }> = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

export const KINDS: ScheduleKind[] = ["class", "due", "exam", "event"];

/** Static class names per kind, so Tailwind can see them. */
export const KIND_STYLE: Record<
  ScheduleKind,
  { label: string; tag: string; chip: string; dot: string }
> = {
  class: {
    label: "Live Classes",
    tag: "Class",
    chip: "border-teal-200 bg-teal-50 text-teal-800",
    dot: "bg-teal-500",
  },
  due: {
    label: "Due Assignments",
    tag: "Due",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  exam: {
    label: "Exams & Quizzes",
    tag: "Assessment",
    chip: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
  event: {
    label: "School Events",
    tag: "Event",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (value: number) => String(value).padStart(2, "0");

/** "2024-10-24", in local time. */
export function dateParam(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateParam(value: string | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export const sameDay = (a: Date, b: Date) =>
  a.toDateString() === b.toDateString();

/** Monday on or before `date`. */
export function startOfWeek(date: Date): Date {
  return addDays(startOfDay(date), -((date.getDay() + 6) % 7));
}

/** Every day a view shows; a month view pads out to whole weeks. */
export function daysFor(view: View, anchor: Date): Date[] {
  let from: Date;
  let count: number;
  if (view === "month") {
    from = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const to = addDays(startOfWeek(last), 6);
    count = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  } else if (view === "week") {
    from = startOfWeek(anchor);
    count = 7;
  } else {
    from = startOfDay(anchor);
    count = 1;
  }
  return Array.from({ length: count }, (_, i) => addDays(from, i));
}

/** The anchor one step back (-1) or forward (+1) in the current view. */
export function stepped(view: View, anchor: Date, direction: 1 | -1): Date {
  if (view === "month") {
    return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
  }
  return addDays(anchor, view === "week" ? 7 * direction : direction);
}

export function rangeLabel(view: View, days: Date[], anchor: Date): string {
  if (view === "month") {
    return anchor.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
  if (view === "week") {
    const last = days[days.length - 1]!;
    return `${shortDate(days[0]!)} – ${shortDate(last)}, ${last.getFullYear()}`;
  }
  return anchor.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** A calendar link, leaving out the defaults (month view, every kind). */
export function calendarHref({
  view,
  date,
  filter,
}: {
  view: View;
  date: Date;
  filter: Filter;
}): string {
  const params = new URLSearchParams();
  if (view !== "month") params.set("view", view);
  params.set("date", dateParam(date));
  if (filter !== "all") params.set("filter", filter);
  return `/student/calendar?${params.toString()}`;
}

export function groupByDay(entries: ScheduleEntry[]) {
  const days = new Map<string, ScheduleEntry[]>();
  for (const entry of entries) {
    const key = entry.startAt.toDateString();
    days.set(key, [...(days.get(key) ?? []), entry]);
  }
  return days;
}

/** "09:00 AM – 10:30 AM", "Due 11:59 PM" or "All day". */
export function timeRange(entry: ScheduleEntry): string {
  if (entry.allDay) return "All day";
  if (entry.endAt) return `${clockOf(entry.startAt)} – ${clockOf(entry.endAt)}`;
  if (entry.points !== null) return `Due ${clockOf(entry.startAt)}`;
  return clockOf(entry.startAt);
}
