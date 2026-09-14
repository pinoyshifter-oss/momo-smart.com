import Link from "next/link";

import { CheckIcon, StarIcon } from "~/app/_components/icons";
import { Card, EmptyState } from "~/app/_components/ui";
import { points } from "~/app/student/(app)/_components/format";
import {
  calendarHref,
  KIND_STYLE,
  sameDay,
  timeRange,
  type Filter,
  type ScheduleEntry,
} from "./shared";

/** A week as one row per day, so long titles stay readable at any width. */
export function WeekView({
  days,
  today,
  byDay,
  filter,
}: {
  days: Date[];
  today: Date;
  byDay: Map<string, ScheduleEntry[]>;
  filter: Filter;
}) {
  return (
    <Card>
      <ul className="divide-line divide-y">
        {days.map((day) => {
          const items = byDay.get(day.toDateString()) ?? [];
          const isToday = sameDay(day, today);
          return (
            <li
              key={day.toDateString()}
              className={`flex flex-col gap-3 px-5 py-4 sm:flex-row ${isToday ? "bg-brand-soft/40" : ""}`}
            >
              <Link
                href={calendarHref({ view: "day", date: day, filter })}
                className="flex shrink-0 items-baseline gap-2 sm:w-24 sm:flex-col sm:gap-0"
              >
                <span
                  className={`text-[11px] font-bold tracking-wide uppercase ${isToday ? "text-brand" : "text-muted"}`}
                >
                  {isToday
                    ? "Today"
                    : day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-navy text-2xl font-extrabold">
                  {day.getDate()}
                </span>
              </Link>
              {items.length === 0 ? (
                <p className="text-muted self-center text-sm">
                  Nothing scheduled.
                </p>
              ) : (
                <ul className="grid min-w-0 flex-1 gap-2 lg:grid-cols-2">
                  {items.map((entry) => (
                    <li key={entry.id} className="min-w-0">
                      <EntryCard entry={entry} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function DayView({ entries }: { entries: ScheduleEntry[] }) {
  return (
    <Card className="p-5">
      {entries.length === 0 ? (
        <EmptyState>Nothing scheduled for this day.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <EntryCard entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function EntryCard({ entry }: { entry: ScheduleEntry }) {
  const style = KIND_STYLE[entry.kind];
  const meta = [
    entry.courseName !== entry.title && entry.courseName,
    entry.location,
    entry.detail,
  ].filter(Boolean);

  const card = (
    <div
      className={`border-line bg-surface flex h-full gap-3 rounded-xl border p-3 transition ${
        entry.href ? "hover:border-brand/40 hover:bg-canvas" : ""
      }`}
    >
      <span className={`w-1 shrink-0 rounded-full ${style.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="text-muted">{timeRange(entry)}</span>
          <span className={`rounded-full border px-2 py-0.5 ${style.chip}`}>
            {style.tag}
          </span>
          {entry.done && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              <CheckIcon className="size-3" />
              Handed in
            </span>
          )}
        </div>
        <p
          className={`text-ink mt-1 text-sm leading-snug font-bold ${entry.done ? "line-through opacity-70" : ""}`}
        >
          {entry.title}
        </p>
        {meta.length > 0 && (
          <p className="text-muted mt-0.5 text-xs">{meta.join(" • ")}</p>
        )}
      </div>
      {entry.points !== null && (
        <div className="shrink-0 text-right">
          <p className="text-navy text-sm font-extrabold whitespace-nowrap">
            {points(entry.points)} pts
          </p>
          {entry.stars > 0 && !entry.done && (
            <p className="inline-flex items-center gap-0.5 text-xs font-bold text-orange-600">
              +{entry.stars}
              <StarIcon className="size-3" />
            </p>
          )}
        </div>
      )}
    </div>
  );

  return entry.href ? (
    <Link href={entry.href} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );
}
