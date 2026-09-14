import { type Metadata } from "next";
import Link from "next/link";

import { CalendarIcon, ChevronRightIcon } from "~/app/_components/icons";
import { Card } from "~/app/_components/ui";
import { addDays, startOfDay } from "~/server/lib/dates";
import { api } from "~/trpc/server";
import { DayView, WeekView } from "./_components/agenda-views";
import { MonthGrid } from "./_components/month-grid";
import { OfficeHoursCard, PriorityRail } from "./_components/priority-rail";
import {
  calendarHref,
  daysFor,
  groupByDay,
  KIND_STYLE,
  KINDS,
  parseDateParam,
  rangeLabel,
  stepped,
  VIEWS,
  type Filter,
  type View,
} from "./_components/shared";

export const metadata: Metadata = { title: "Calendar" };

/** Deadlines and submissions change as the student works, so never cache. */
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
const param = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function StudentCalendar({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const now = new Date();
  const today = startOfDay(now);

  const requestedView = param(params.view);
  const view: View = VIEWS.some((v) => v.id === requestedView)
    ? (requestedView as View)
    : "month";
  const requestedFilter = param(params.filter);
  const filter: Filter = KINDS.some((k) => k === requestedFilter)
    ? (requestedFilter as Filter)
    : "all";
  const anchor = parseDateParam(param(params.date)) ?? today;

  const days = daysFor(view, anchor);
  const [entries, upcoming, officeHours] = await Promise.all([
    api.calendar.studentSchedule({
      from: days[0]!,
      to: days[days.length - 1]!,
    }),
    api.calendar.studentSchedule({ from: today, to: addDays(today, 7) }),
    api.calendar.studentOfficeHours(),
  ]);

  const counts: Record<Filter, number> = {
    all: entries.length,
    class: 0,
    due: 0,
    exam: 0,
    event: 0,
  };
  for (const entry of entries) counts[entry.kind] += 1;

  const shown =
    filter === "all" ? entries : entries.filter((e) => e.kind === filter);
  const byDay = groupByDay(shown);
  const filters: Array<{ id: Filter; label: string; dot?: string }> = [
    { id: "all", label: "All" },
    ...KINDS.map((kind) => ({
      id: kind,
      label: KIND_STYLE[kind].label,
      dot: KIND_STYLE[kind].dot,
    })),
  ];

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-navy text-2xl font-extrabold tracking-tight sm:text-3xl">
                Student Calendar &amp; Deadlines
              </h1>
              <p className="text-muted mt-1 text-sm">
                Class sessions, assignment deadlines, exams and school events in
                one view.
              </p>
            </div>
            <nav
              aria-label="Calendar view"
              className="border-line bg-brand-soft/60 inline-flex rounded-xl border p-1"
            >
              {VIEWS.map((item) => {
                const active = item.id === view;
                return (
                  <Link
                    key={item.id}
                    href={calendarHref({ view: item.id, date: anchor, filter })}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                      active
                        ? "bg-surface text-navy shadow-card"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-line mt-5 flex flex-wrap items-center gap-3 border-t pt-5">
            <div className="border-line inline-flex items-center rounded-xl border">
              <Link
                href={calendarHref({
                  view,
                  date: stepped(view, anchor, -1),
                  filter,
                })}
                aria-label={`Previous ${view}`}
                className="text-muted hover:text-ink rounded-l-xl p-2.5 transition"
              >
                <ChevronRightIcon className="size-4 rotate-180" />
              </Link>
              <h2 className="text-ink min-w-0 px-2 text-center text-sm font-bold sm:min-w-44 sm:text-base">
                {rangeLabel(view, days, anchor)}
              </h2>
              <Link
                href={calendarHref({
                  view,
                  date: stepped(view, anchor, 1),
                  filter,
                })}
                aria-label={`Next ${view}`}
                className="text-muted hover:text-ink rounded-r-xl p-2.5 transition"
              >
                <ChevronRightIcon className="size-4" />
              </Link>
            </div>
            <Link
              href={calendarHref({ view, date: today, filter })}
              className="border-line text-ink hover:bg-canvas rounded-xl border px-3.5 py-2 text-sm font-semibold transition"
            >
              Today
            </Link>
            <a
              href="/student/calendar/ics"
              download
              className="border-line text-ink hover:bg-canvas inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition xl:ml-auto"
              title="Downloads the next 60 days as an .ics file to import into Google Calendar, Apple Calendar or Outlook"
            >
              <CalendarIcon className="text-brand size-4" />
              Export to Google / Apple Calendar
            </a>
          </div>

          <nav
            aria-label="Filter by type"
            className="mt-4 flex flex-wrap gap-2"
          >
            {filters.map((item) => {
              const active = item.id === filter;
              return (
                <Link
                  key={item.id}
                  href={calendarHref({ view, date: anchor, filter: item.id })}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-navy bg-navy text-white"
                      : item.id === "all"
                        ? "border-line bg-surface text-ink hover:bg-canvas"
                        : `${KIND_STYLE[item.id].chip} hover:brightness-95`
                  }`}
                >
                  {item.dot && (
                    <span
                      className={`size-2 rounded-full ${active ? "bg-white" : item.dot}`}
                    />
                  )}
                  {item.label} ({counts[item.id]})
                </Link>
              );
            })}
          </nav>
        </Card>

        {view === "month" ? (
          <MonthGrid
            days={days}
            month={anchor.getMonth()}
            today={today}
            byDay={byDay}
            filter={filter}
          />
        ) : view === "week" ? (
          <WeekView days={days} today={today} byDay={byDay} filter={filter} />
        ) : (
          <DayView entries={shown} />
        )}
      </div>

      <aside className="min-w-0 space-y-6">
        <PriorityRail upcoming={upcoming} now={now} />
        <OfficeHoursCard slots={officeHours} />
      </aside>
    </div>
  );
}
