import Link from "next/link";

import {
  AlarmIcon,
  ArrowRightIcon,
  CheckIcon,
  ChecklistIcon,
  ClockIcon,
  IdCardIcon,
} from "~/app/_components/icons";
import { submitAttendance, takeAttendance } from "../actions";
import { clock } from "~/app/_components/format";
import { Card, EmptyState, Pill } from "~/app/_components/ui";

type Period = {
  sectionId: string;
  sectionCode: string;
  course: { name: string };
  period: number;
  room: string | null;
  startTime: string | null;
  endTime: string | null;
  enrolled: number;
  state: "SUBMITTED" | "IN_SESSION" | "UPCOMING" | "PENDING";
  sessionId: string | null;
  submittedAt: Date | null;
  presentCount: number | null;
};

export function DailyRoster({ periods }: { periods: Period[] }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <h2 className="text-ink flex items-center gap-2.5 text-[17px] font-bold">
          <ClockIcon className="text-navy size-5" />
          Period Attendance
        </h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="border-brand/20 bg-brand-soft text-navy hover:bg-brand-soft/70 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition"
          >
            <IdCardIcon className="size-4" />
            Credentials
          </button>
          <Link
            href="/teacher/enroll"
            className="text-brand inline-flex items-center gap-1 text-xs font-bold hover:underline"
          >
            Master Roster
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>

      {periods.length === 0 ? (
        <EmptyState>No classes meet today.</EmptyState>
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {periods.map((period) => (
            <PeriodTile key={period.sectionId} period={period} />
          ))}
        </div>
      )}
    </Card>
  );
}

function PeriodTile({ period }: { period: Period }) {
  const live = period.state === "IN_SESSION";
  const done = period.state === "SUBMITTED";
  const upcoming = period.state === "UPCOMING";
  const startsAt = clock(period.startTime).replace(/^0/, "");

  return (
    <article
      className={`flex flex-wrap items-center gap-3 rounded-xl p-4 transition ${
        live
          ? "border-brand bg-surface ring-brand/15 border-2 ring-4"
          : "border-line bg-canvas border"
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
          done
            ? "bg-emerald-100 text-emerald-600"
            : live
              ? "bg-brand text-white"
              : upcoming
                ? "bg-slate-200/70 text-slate-400"
                : "bg-rose-100 text-rose-600"
        }`}
      >
        {done ? (
          <CheckIcon className="size-4" />
        ) : live ? (
          <AlarmIcon className="size-[18px]" />
        ) : (
          <ClockIcon className="size-[18px]" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-ink flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold">
          <span>
            P{period.period}: {period.course.name}
          </span>
          {live && (
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-white uppercase">
              Live
            </span>
          )}
        </p>
        <p className="text-muted mt-0.5 text-xs">
          {[period.room, startsAt].filter(Boolean).join(" • ")}
        </p>
      </div>

      {done ? (
        <Pill tone="green" className="text-xs">
          {period.presentCount ?? 0}/{period.enrolled}
        </Pill>
      ) : upcoming ? (
        <Pill tone="slate" className="text-xs">
          Upcoming
        </Pill>
      ) : period.sessionId ? (
        <form action={submitAttendance}>
          <input type="hidden" name="sessionId" value={period.sessionId} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white transition hover:bg-emerald-700"
          >
            <CheckIcon className="size-3.5" />
            Submit Attendance
          </button>
        </form>
      ) : (
        <form action={takeAttendance}>
          <input type="hidden" name="sectionId" value={period.sectionId} />
          <button
            type="submit"
            className="bg-brand hover:bg-brand/90 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap text-white transition"
          >
            <ChecklistIcon className="size-4" />
            Take Attendance
          </button>
        </form>
      )}
    </article>
  );
}
