import Link from "next/link";

import {
  ChevronRightIcon,
  MegaphoneIcon,
  TrendUpIcon,
} from "~/app/_components/icons";
import { Card, EmptyState } from "~/app/_components/ui";

type SectionPerformance = {
  sectionId: string;
  sectionCode: string;
  period: number;
  course: { name: string; level: string };
  studentCount: number;
  classAverage: number | null;
  gradedStudents: number;
  distribution: { A: number; B: number; C: number; DF: number };
  currentUnit: { order: number; title: string } | null;
};

/** Colour set per card: the top rule, the student pill and the average label. */
const ACCENTS = [
  {
    rule: "bg-teal-600",
    pill: "bg-teal-50 text-teal-700",
    text: "text-teal-700",
  },
  { rule: "bg-navy", pill: "bg-brand-soft text-brand", text: "text-brand" },
  {
    rule: "bg-amber-600",
    pill: "bg-amber-50 text-amber-700",
    text: "text-amber-700",
  },
  {
    rule: "bg-violet-600",
    pill: "bg-violet-50 text-violet-700",
    text: "text-violet-700",
  },
];

export function letterFor(percent: number): string {
  if (percent >= 97) return "A+";
  if (percent >= 93) return "A";
  if (percent >= 90) return "A-";
  if (percent >= 87) return "B+";
  if (percent >= 83) return "B";
  if (percent >= 80) return "B-";
  if (percent >= 77) return "C+";
  if (percent >= 73) return "C";
  if (percent >= 70) return "C-";
  if (percent >= 60) return "D";
  return "F";
}

export function Performance({ sections }: { sections: SectionPerformance[] }) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-ink flex items-center gap-2.5 text-[17px] font-bold">
          <TrendUpIcon className="text-navy size-5" />
          Course Performance
        </h2>
        <button
          type="button"
          className="border-line bg-surface text-navy hover:bg-canvas inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition"
        >
          <MegaphoneIcon className="size-3.5" />
          Announcement
        </button>
      </div>

      {sections.length === 0 ? (
        <Card className="mt-4">
          <EmptyState>No sections assigned this term.</EmptyState>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section, index) => (
            <SectionCard
              key={section.sectionId}
              section={section}
              accent={ACCENTS[index % ACCENTS.length]!}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SectionCard({
  section,
  accent,
}: {
  section: SectionPerformance;
  accent: (typeof ACCENTS)[number];
}) {
  const bars = [
    { label: "A", count: section.distribution.A, className: "bg-teal-600" },
    { label: "B", count: section.distribution.B, className: "bg-blue-600" },
    { label: "C", count: section.distribution.C, className: "bg-amber-600" },
    { label: "D/F", count: section.distribution.DF, className: "bg-red-600" },
  ];
  const peak = Math.max(1, ...bars.map((bar) => bar.count));

  return (
    <article className="border-line bg-surface shadow-card flex flex-col overflow-hidden rounded-2xl border">
      <span aria-hidden="true" className={`h-1.5 ${accent.rule}`} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-muted pt-1 text-[10px] font-bold tracking-[0.12em] uppercase">
            {section.course.level} • Per. {section.period}
          </p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${accent.pill}`}
          >
            {section.studentCount} Students
          </span>
        </div>

        <h3 className="text-ink mt-2 text-lg leading-snug font-extrabold">
          {section.course.name} {section.sectionCode}
        </h3>

        <p className="mt-3 flex items-end gap-2">
          <span className="text-ink text-4xl font-extrabold tracking-tight">
            {section.classAverage === null ? "—" : `${section.classAverage}%`}
          </span>
          <span
            className={`pb-1 text-[11px] leading-tight font-semibold ${accent.text}`}
          >
            Class Average
            {section.classAverage !== null && (
              <>
                <br />({letterFor(section.classAverage)})
              </>
            )}
          </span>
        </p>

        <div className="border-line mt-4 border-t pt-3">
          <p className="text-muted text-[10px] font-semibold tracking-wider uppercase">
            Grade distribution
          </p>
          <div className="mt-2 flex h-24 items-stretch gap-3">
            {bars.map((bar) => (
              <div
                key={bar.label}
                className="flex flex-1 flex-col items-center gap-1"
              >
                {/* The track gives the bar a definite height to size against. */}
                <div className="flex w-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-ink text-[11px] font-semibold">
                    {bar.count}
                  </span>
                  <div
                    className={`w-full rounded-t ${bar.className}`}
                    style={{
                      height: `${Math.max(6, (bar.count / peak) * 70)}%`,
                    }}
                    role="presentation"
                  />
                </div>
                <span className="text-muted text-[11px] font-semibold">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
          {section.gradedStudents === 0 && (
            <p className="text-muted mt-2 text-[11px]">
              No released grades yet.
            </p>
          )}
        </div>
      </div>

      <div className="border-line flex items-center justify-between gap-2 border-t px-4 py-3">
        <p
          className="text-muted min-w-0 truncate text-xs"
          title={section.currentUnit?.title}
        >
          {section.currentUnit?.title ?? "No unit in progress"}
        </p>
        <Link
          href={`/teacher/enroll?section=${section.sectionId}`}
          className="text-brand inline-flex shrink-0 items-center gap-0.5 text-xs font-bold hover:underline"
        >
          Open Roster
          <ChevronRightIcon className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
