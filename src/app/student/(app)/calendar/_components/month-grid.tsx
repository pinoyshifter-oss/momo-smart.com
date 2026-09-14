import Link from "next/link";

import { clockOf } from "~/app/_components/format";
import { Card } from "~/app/_components/ui";
import {
  calendarHref,
  KIND_STYLE,
  sameDay,
  WEEKDAYS,
  type Filter,
  type ScheduleEntry,
} from "./shared";

const VISIBLE_PER_DAY = 3;

/** Month at a glance: chips on wider screens, coloured dots on phones. */
export function MonthGrid({
  days,
  month,
  today,
  byDay,
  filter,
}: {
  days: Date[];
  month: number;
  today: Date;
  byDay: Map<string, ScheduleEntry[]>;
  filter: Filter;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-line bg-canvas/60 grid grid-cols-7 border-b">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="text-muted py-3 text-center text-[11px] font-bold tracking-wide uppercase"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const inMonth = day.getMonth() === month;
          const isToday = sameDay(day, today);
          const items = byDay.get(day.toDateString()) ?? [];
          const dayHref = calendarHref({ view: "day", date: day, filter });
          const lastRow = index >= days.length - 7;

          return (
            <div
              key={day.toDateString()}
              className={`border-line min-h-20 p-1.5 sm:min-h-28 sm:p-2 ${
                index % 7 !== 6 ? "border-r" : ""
              } ${lastRow ? "" : "border-b"} ${
                isToday
                  ? "ring-navy relative ring-2 ring-inset"
                  : inMonth
                    ? ""
                    : "bg-canvas/50"
              }`}
            >
              <Link
                href={dayHref}
                className="flex items-center justify-between gap-1"
                aria-label={day.toDateString()}
              >
                <span
                  className={
                    isToday
                      ? "bg-navy flex size-6 items-center justify-center rounded-full text-xs font-bold text-white"
                      : `px-0.5 text-xs font-semibold ${inMonth ? "text-ink" : "text-muted/60"}`
                  }
                >
                  {day.getDate()}
                </span>
                {isToday && (
                  <span className="text-navy hidden text-[10px] font-extrabold tracking-wide uppercase md:inline">
                    Today
                  </span>
                )}
              </Link>

              {items.length > 0 && (
                <>
                  <ul className="mt-1.5 hidden space-y-1 sm:block">
                    {items.slice(0, VISIBLE_PER_DAY).map((entry) => (
                      <li key={entry.id}>
                        <EntryChip entry={entry} />
                      </li>
                    ))}
                    {items.length > VISIBLE_PER_DAY && (
                      <li>
                        <Link
                          href={dayHref}
                          className="text-brand px-1 text-[11px] font-bold hover:underline"
                        >
                          +{items.length - VISIBLE_PER_DAY} more
                        </Link>
                      </li>
                    )}
                  </ul>
                  <div className="mt-1.5 flex flex-wrap gap-1 px-0.5 sm:hidden">
                    {items.slice(0, 6).map((entry) => (
                      <span
                        key={entry.id}
                        className={`size-1.5 rounded-full ${KIND_STYLE[entry.kind].dot}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EntryChip({ entry }: { entry: ScheduleEntry }) {
  const style = KIND_STYLE[entry.kind];
  const time = entry.allDay ? "" : `${clockOf(entry.startAt)} `;
  const chip = (
    <span
      title={`${time}${entry.title}`}
      className={`block truncate rounded-md border px-1.5 py-1 text-[11px] font-semibold ${style.chip} ${
        entry.done ? "line-through opacity-60" : ""
      }`}
    >
      {time}
      {entry.title}
    </span>
  );
  return entry.href ? (
    <Link href={entry.href} className="block transition hover:brightness-95">
      {chip}
    </Link>
  ) : (
    chip
  );
}
