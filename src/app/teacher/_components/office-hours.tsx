import {
  CalendarIcon,
  ClipboardIcon,
  ClockIcon,
} from "~/app/_components/icons";
import { clock, humanise } from "~/app/_components/format";
import { Card, Pill } from "~/app/_components/ui";

type OfficeHour = {
  id: string;
  startTime: string;
  endTime: string;
  mode: string;
  location: string | null;
  label: string | null;
  capacity: number;
  _count: { bookings: number };
};

type Deadline = {
  id: string;
  title: string;
  startAt: Date;
};

/** "08:15 AM" → "8:15 AM", to keep the tile headline compact. */
const short = (time: string) => clock(time).replace(/^0/, "");

export function OfficeHours({
  officeHours,
  deadlines,
  pacing,
  termName,
}: {
  officeHours: OfficeHour[];
  deadlines: Deadline[];
  pacing: { completedModules: number; totalModules: number; percent: number };
  termName: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2 className="text-ink text-[17px] font-bold">
          Office Hours &amp; Schedule
        </h2>
        <CalendarIcon className="text-muted size-5" />
      </div>

      <div className="space-y-3 p-4">
        {officeHours.length === 0 ? (
          <p className="bg-brand-soft/60 text-muted rounded-xl px-4 py-3 text-xs">
            No office hours scheduled today.
          </p>
        ) : (
          officeHours.map((slot) => (
            <div
              key={slot.id}
              className="bg-brand-soft/60 flex items-start gap-3 rounded-xl p-4"
            >
              <ClockIcon className="mt-1 size-5 shrink-0 text-teal-600" />
              <div className="min-w-0 flex-1">
                <p className="text-ink text-base leading-snug font-bold">
                  Today: {short(slot.startTime)} – {short(slot.endTime)}
                </p>
                <p className="text-muted mt-0.5 text-xs">
                  {[slot.location, slot.label ?? humanise(slot.mode)]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>
              <Pill tone="green">
                {slot._count.bookings}/{slot.capacity} Booked
              </Pill>
            </div>
          ))
        )}

        {deadlines.map((deadline) => (
          <div
            key={deadline.id}
            className="bg-brand-soft/60 flex items-start gap-3 rounded-xl p-4"
          >
            <ClipboardIcon className="text-navy mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-ink text-base leading-snug font-bold">
                {deadline.title}
              </p>
              <p className="text-muted mt-0.5 text-xs">
                {deadline.startAt.toLocaleDateString("en-US", {
                  weekday: "long",
                })}
                ,{" "}
                {deadline.startAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Pill tone="slate">Due</Pill>
          </div>
        ))}
      </div>

      <div className="border-line mx-4 border-t pt-3 pb-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-ink text-xs font-bold">{termName} Pacing</p>
          <p
            className="text-xs font-semibold text-teal-600"
            title={`${pacing.completedModules} of ${pacing.totalModules} modules`}
          >
            {pacing.percent}%
          </p>
        </div>
        <div
          className="bg-line mt-2 h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={pacing.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Curriculum pacing"
        >
          <div
            className="h-full rounded-full bg-teal-600"
            style={{ width: `${pacing.percent}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
