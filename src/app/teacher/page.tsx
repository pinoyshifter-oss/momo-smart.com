import Link from "next/link";

import { DownloadIcon, MegaphoneIcon } from "~/app/_components/icons";
import { studentEmailRule } from "~/server/lib/credentials";
import { api } from "~/trpc/server";
import { AlertsPanel } from "./_components/alerts-panel";
import { DailyRoster } from "./_components/daily-roster";
import { EnrollStudentDialog } from "./_components/enroll-dialog";
import { GradingQueue } from "./_components/grading-queue";
import { OfficeHours } from "./_components/office-hours";
import { Performance } from "./_components/performance";
import { StatCards } from "./_components/stat-cards";

/** Live figures, so the dashboard always reflects the database. */
export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    me,
    overview,
    attendanceToday,
    daySchedule,
    queue,
    queueSummary,
    alerts,
    performance,
    pacing,
    officeHours,
    agenda,
  ] = await Promise.all([
    api.user.me(),
    api.dashboard.teacherOverview(),
    api.attendance.todaySummary({}),
    api.attendance.daySchedule({}),
    api.grading.queue({ limit: 4, sort: "OLDEST" }),
    api.grading.queueSummary(),
    api.alert.list({ status: "OPEN", limit: 3 }),
    api.dashboard.sectionPerformance(),
    api.dashboard.pacingSummary(),
    api.dashboard.officeHoursToday(),
    api.calendar.agenda({ from: now, to: in14Days }),
  ]);

  const live = daySchedule.periods.some((p) => p.state === "IN_SESSION");
  const surname = me.name?.split(" ").slice(-1)[0] ?? "there";

  const deadlines = agenda.events
    .filter((event) => event.type === "ADMIN_DEADLINE")
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-ink text-3xl font-extrabold tracking-tight sm:text-[34px]">
              Teacher Command Center
            </h1>
            {live && (
              <span className="border-brand/20 bg-brand-soft text-brand rounded-full border px-2.5 py-0.5 text-xs font-bold">
                Live
              </span>
            )}
          </div>
          <p className="text-muted mt-1.5 text-sm">
            Welcome back, {me.title ? `${me.title} ` : ""}
            {surname}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/teacher/reports"
            className="border-line bg-surface text-ink hover:bg-canvas inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition"
          >
            <DownloadIcon className="size-4" />
            Export
          </Link>
          <button
            type="button"
            className="bg-navy hover:bg-navy-deep inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition"
          >
            <MegaphoneIcon className="size-4" />
            Broadcast
          </button>
          <EnrollStudentDialog
            sections={performance.map((section) => ({
              id: section.sectionId,
              label: `${section.course.name} — ${section.sectionCode} (Per. ${section.period})`,
            }))}
            emailRule={studentEmailRule(me.email)}
            className="bg-brand hover:bg-brand/90 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition"
          />
        </div>
      </div>

      <StatCards
        totalEnrolled={overview.totalEnrolled}
        ungradedCount={overview.ungradedCount}
        attendanceRate={overview.attendanceRate}
        attendanceDelta={attendanceToday.deltaFromPreviousDay}
        atRiskCount={overview.atRiskCount}
      />

      <DailyRoster periods={daySchedule.periods} />

      {/* Work queue and performance on the left; people and schedule on the right. */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-8">
          <GradingQueue items={queue.items} total={queueSummary.total} />
          <Performance sections={performance} />
        </div>
        <div className="min-w-0 space-y-6">
          <AlertsPanel alerts={alerts.items} total={alerts.total} />
          <OfficeHours
            officeHours={officeHours}
            deadlines={deadlines}
            pacing={pacing}
            termName={overview.term?.name.split("–").pop()?.trim() ?? "Term"}
          />
        </div>
      </div>
    </div>
  );
}
