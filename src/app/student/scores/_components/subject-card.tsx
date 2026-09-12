import Link from "next/link";

import {
  BookIcon,
  BookOpenIcon,
  ChartIcon,
  ChevronRightIcon,
  FlaskIcon,
  StarIcon,
} from "~/app/_components/icons";
import { Pill } from "~/app/_components/ui";
import {
  courseTone,
  points,
  teacherFullName,
} from "~/app/student/_components/format";
import { categoryTone, type Subject } from "./shared";

/** One enrolled subject: running grade and its weighted category breakdown. */
export function SubjectCard({
  subject,
  selected,
  href,
}: {
  subject: Subject;
  selected: boolean;
  href: string;
}) {
  const tone = courseTone(subject.course.colorToken);
  const weights = subject.categories
    .map((category) => `${points(category.weightPercent)}% ${category.name}`)
    .join(" • ");

  return (
    <article
      className={`bg-surface shadow-card overflow-hidden rounded-2xl border ${
        selected ? "border-navy ring-navy/10 ring-4" : "border-line"
      }`}
    >
      <div className={`h-1.5 ${tone.bar}`} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone.badge}`}
          >
            <SubjectIcon department={subject.course.department.name} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-ink text-lg leading-snug font-bold">
                {subject.course.name}
              </h3>
              {selected && <Pill tone="blue">Selected</Pill>}
            </div>
            <p className="text-muted mt-1 text-sm">
              {weights || "Points-based average"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="whitespace-nowrap">
              <span className="text-navy text-3xl font-extrabold tracking-tight">
                {subject.percent !== null ? points(subject.percent) : "—"}
              </span>
              <span className="text-muted text-sm font-semibold"> / 100</span>
            </p>
            {subject.stars > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                +{subject.stars}
                <StarIcon className="size-3.5" />
              </p>
            )}
          </div>
        </div>

        {subject.categories.length > 0 && (
          <div className="bg-canvas/70 mt-5 grid gap-4 rounded-xl px-4 py-3 sm:auto-cols-fr sm:grid-flow-col">
            {subject.categories.map((category, index) => {
              const bar = categoryTone(index).bar;
              return (
                <div key={category.id} className="min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-ink truncate font-semibold">
                      {category.name} ({points(category.weightPercent)}%)
                    </span>
                    <span className="text-ink font-bold">
                      {category.percent !== null
                        ? `${points(category.percent)}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${bar}`}
                      style={{
                        width: `${Math.min(100, category.percent ?? 0)}%`,
                      }}
                    />
                  </div>
                  <p className="text-muted mt-1 text-[11px]">
                    {category.gradedCount > 0
                      ? `${points(category.earned)}/${points(category.possible)} pts`
                      : "Nothing graded yet"}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-line mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs">
          <span className="text-muted font-semibold">
            Instructor: {teacherFullName(subject.teacher)}
            {subject.room && ` • ${subject.room}`}
          </span>
          <Link
            href={href}
            scroll={false}
            aria-current={selected ? "true" : undefined}
            className="text-brand inline-flex items-center gap-1 font-bold hover:underline"
          >
            {selected ? "Viewing assessments" : "View assessments"}
            <ChevronRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SubjectIcon({ department }: { department: string }) {
  const name = department.toLowerCase();
  if (name.includes("science")) return <FlaskIcon className="size-5" />;
  if (name.includes("english")) return <BookOpenIcon className="size-5" />;
  if (name.includes("math")) return <ChartIcon className="size-5" />;
  return <BookIcon className="size-5" />;
}
