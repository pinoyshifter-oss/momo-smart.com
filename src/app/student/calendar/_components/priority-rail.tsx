import Link from "next/link";

import { clock, clockOf, humanise } from "~/app/_components/format";
import {
  CalendarCheckIcon,
  ChatIcon,
  ChevronRightIcon,
  PlayIcon,
  StarIcon,
} from "~/app/_components/icons";
import { Avatar, Card, EmptyState, Pill } from "~/app/_components/ui";
import {
  points,
  shortDate,
  teacherFullName,
} from "~/app/student/_components/format";
import { sameDay, type OfficeHours, type ScheduleEntry } from "./shared";

const HOUR_MS = 3_600_000;

/** "25m" / "3h 10m" */
function untilLabel(at: Date, now: Date): string {
  const minutes = Math.max(
    1,
    Math.round((at.getTime() - now.getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m`;
  const rest = minutes % 60;
  return rest === 0
    ? `${Math.floor(minutes / 60)}h`
    : `${Math.floor(minutes / 60)}h ${rest}m`;
}

/**
 * Today's next class, anything due in the next 48 hours and the stars still
 * on offer this week. `upcoming` covers today through the next seven days.
 */
export function PriorityRail({
  upcoming,
  now,
}: {
  upcoming: ScheduleEntry[];
  now: Date;
}) {
  const next =
    upcoming.find(
      (entry) =>
        entry.kind === "class" &&
        sameDay(entry.startAt, now) &&
        (entry.endAt ?? entry.startAt) > now,
    ) ?? null;
  const live = next !== null && next.startAt <= now;

  const open = upcoming.filter(
    (entry) => entry.points !== null && !entry.done && entry.startAt > now,
  );
  const urgent = open.filter(
    (entry) => entry.startAt.getTime() - now.getTime() <= 48 * HOUR_MS,
  );
  const potential = open.reduce((sum, entry) => sum + entry.stars, 0);

  return (
    <Card className="p-5">
      <div className="border-line flex items-start justify-between gap-3 border-b pb-4">
        <h2 className="text-ink inline-flex items-center gap-2 text-lg font-bold">
          <CalendarCheckIcon className="text-brand size-5 shrink-0" />
          Today&apos;s Priority Schedule
        </h2>
        <span className="bg-brand-soft text-navy shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold">
          {shortDate(now)}
        </span>
      </div>

      {next ? (
        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-teal-700 uppercase">
              <span className="size-2 rounded-full bg-teal-500" />
              {live ? "In session now" : "Next class today"}
            </p>
            <span className="shrink-0 rounded-lg bg-teal-100 px-2 py-1 text-[11px] font-bold text-teal-800">
              {live
                ? `Ends ${clockOf(next.endAt)}`
                : `Starts in ${untilLabel(next.startAt, now)}`}
            </span>
          </div>
          <p className="text-ink mt-2 text-lg leading-snug font-bold">
            {next.title}
          </p>
          <p className="text-muted mt-1 text-xs">
            {[
              next.detail,
              next.location,
              `${clockOf(next.startAt)} – ${clockOf(next.endAt)}`,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
          <Link
            href="/student/courses"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <PlayIcon className="size-4" />
            Open Course
          </Link>
        </div>
      ) : (
        <p className="bg-canvas text-muted mt-4 rounded-xl px-4 py-3 text-sm">
          No more classes today.
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-2">
        <p className="text-muted text-[11px] font-bold tracking-wide uppercase">
          Urgent deadlines (48h)
        </p>
        {urgent.length > 0 && (
          <span className="text-[11px] font-bold text-rose-600">
            {urgent.length} action item{urgent.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {urgent.length === 0 ? (
        <p className="text-muted mt-2 text-sm">
          Nothing due in the next two days.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {urgent.map((entry) => {
            const hours = Math.max(
              1,
              Math.round((entry.startAt.getTime() - now.getTime()) / HOUR_MS),
            );
            const soon = hours <= 24;
            return (
              <li key={entry.id}>
                <Link
                  href={entry.href ?? "/student/assignments"}
                  className={`block rounded-xl border px-4 py-3 transition ${
                    soon
                      ? "border-rose-200 bg-rose-50/60 hover:bg-rose-50"
                      : "border-amber-200 bg-amber-50/60 hover:bg-amber-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-ink text-sm leading-snug font-bold">
                      {entry.title}
                    </p>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                        soon
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      Due in {hours}h
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted truncate">
                      {entry.courseName} • {clockOf(entry.startAt)}
                    </span>
                    <span className="text-ink shrink-0 font-semibold">
                      {points(entry.points ?? 0)} pts
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/student/assignments"
        className="shadow-card mt-5 flex items-center gap-4 rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 p-4 text-white transition hover:brightness-105"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20">
          <StarIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">
            +{potential.toLocaleString()} Momo Stars Potential
          </span>
          <span className="mt-0.5 block text-xs text-white/85">
            {open.length === 0
              ? "Nothing left to hand in this week"
              : `Complete ${open.length} scheduled task${open.length === 1 ? "" : "s"} this week`}
          </span>
        </span>
        <ChevronRightIcon className="size-5 shrink-0" />
      </Link>
    </Card>
  );
}

export function OfficeHoursCard({ slots }: { slots: OfficeHours }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted text-[11px] font-bold tracking-wide uppercase">
          Faculty Office Hours Today
        </p>
        {slots.length > 0 && <Pill tone="blue">Drop-in Open</Pill>}
      </div>
      {slots.length === 0 ? (
        <EmptyState>None of your teachers hold office hours today.</EmptyState>
      ) : (
        <ul className="mt-3 space-y-2">
          {slots.map((slot) => {
            const name = teacherFullName(slot.teacher.user);
            const seatsLeft = Math.max(0, slot.capacity - slot._count.bookings);
            return (
              <li
                key={slot.id}
                className="bg-canvas flex items-start gap-3 rounded-xl px-4 py-3"
              >
                <Avatar name={slot.teacher.user.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm font-bold">{name}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    {[slot.label, slot.teacher.department?.name]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                  <p className="text-muted mt-0.5 text-xs">
                    {clock(slot.startTime)} – {clock(slot.endTime)} •{" "}
                    {humanise(slot.mode)}
                    {slot.location && ` • ${slot.location}`}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-teal-700">
                    {seatsLeft} of {slot.capacity} seats left
                  </p>
                </div>
                {slot.meetingUrl ? (
                  <a
                    href={slot.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-navy hover:bg-navy-deep shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition"
                  >
                    Join
                  </a>
                ) : (
                  <Link
                    href="/student/messages"
                    aria-label={`Message ${name}`}
                    className="border-line bg-surface text-navy hover:bg-brand-soft shrink-0 rounded-lg border p-2 transition"
                  >
                    <ChatIcon className="size-4" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
