import { type Metadata } from "next";

import { ChartIcon, DownloadIcon } from "~/app/_components/icons";
import { api } from "~/trpc/server";
import { Card, CardHeader, EmptyState, Pill } from "~/app/_components/ui";
import { PageHeader } from "../_components/page-header";
import { letterFor } from "../_components/performance";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [overview, performance, pacing] = await Promise.all([
    api.dashboard.teacherOverview(),
    api.dashboard.sectionPerformance(),
    api.dashboard.pacingSummary(),
  ]);

  const tiles = [
    { label: "Enrolled students", value: String(overview.totalEnrolled) },
    { label: "Awaiting grading", value: String(overview.ungradedCount) },
    {
      label: "Attendance today",
      value:
        overview.attendanceRate === null ? "—" : `${overview.attendanceRate}%`,
    },
    { label: "Open alerts", value: String(overview.atRiskCount) },
    { label: "Curriculum pacing", value: `${pacing.percent}%` },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Reports"
        subtitle={`${overview.term?.name ?? "Current term"} • ${overview.sectionCount} section${overview.sectionCount === 1 ? "" : "s"}.`}
        action={
          <button
            type="button"
            className="border-line bg-surface text-ink hover:bg-canvas inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition"
          >
            <DownloadIcon className="size-4" />
            Export CSV
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {tiles.map((tile) => (
          <article
            key={tile.label}
            className="border-line bg-surface shadow-card rounded-2xl border p-4"
          >
            <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">
              {tile.label}
            </p>
            <p className="text-ink mt-1 text-3xl font-extrabold tracking-tight">
              {tile.value}
            </p>
          </article>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          icon={<ChartIcon className="size-[18px]" />}
          title="Section summary"
          subtitle="Running class averages and grade distribution from released grades."
        />

        {performance.length === 0 ? (
          <EmptyState>No sections assigned this term.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-canvas text-muted text-[11px] font-bold tracking-wider uppercase">
                  <th className="px-5 py-3">Section</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Class average</th>
                  <th className="px-4 py-3 text-center">A</th>
                  <th className="px-4 py-3 text-center">B</th>
                  <th className="px-4 py-3 text-center">C</th>
                  <th className="px-4 py-3 text-center">D/F</th>
                  <th className="px-5 py-3">Current unit</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {performance.map((row) => (
                  <tr key={row.sectionId} className="hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <p className="text-ink text-sm font-bold">
                        {row.course.name} {row.sectionCode}
                      </p>
                      <p className="text-muted text-xs">Period {row.period}</p>
                    </td>
                    <td className="text-ink px-4 py-3 text-sm font-semibold">
                      {row.studentCount}
                    </td>
                    <td className="px-4 py-3">
                      {row.classAverage === null ? (
                        <span className="text-muted text-xs">—</span>
                      ) : (
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-ink text-sm font-extrabold">
                            {row.classAverage}%
                          </span>
                          <Pill tone="slate">
                            {letterFor(row.classAverage)}
                          </Pill>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-teal-700">
                      {row.distribution.A}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-blue-700">
                      {row.distribution.B}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-amber-700">
                      {row.distribution.C}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-red-700">
                      {row.distribution.DF}
                    </td>
                    <td className="text-muted max-w-[240px] truncate px-5 py-3 text-xs">
                      {row.currentUnit?.title ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
