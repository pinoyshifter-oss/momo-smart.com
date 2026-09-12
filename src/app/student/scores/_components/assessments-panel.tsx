import Link from "next/link";

import { StarIcon } from "~/app/_components/icons";
import { Card, EmptyState, Pill } from "~/app/_components/ui";
import { humanise } from "~/app/_components/format";
import {
  courseTone,
  points,
  shortDate,
} from "~/app/student/_components/format";
import { categoryTone, scoresHref, type Subject } from "./shared";

/** Released scores for the selected subject, filterable by grade category. */
export function AssessmentsPanel({
  subject,
  category,
  term,
}: {
  subject: Subject;
  category: string | undefined;
  term: string | undefined;
}) {
  const scored = subject.items.filter((item) => item.status !== "PENDING");
  const shown = category
    ? scored.filter((item) => item.categoryId === category)
    : scored;
  const categories = new Map(
    subject.categories.map((c, index) => [
      c.id,
      { name: c.name, badge: categoryTone(index).badge },
    ]),
  );
  const filters = [
    { id: undefined, label: `All (${scored.length})` },
    ...subject.categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <Card className="p-5">
      <div className="border-line flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div className="min-w-0">
          <h2 className="text-ink inline-flex items-center gap-2 text-lg font-bold">
            <span
              className={`size-2.5 shrink-0 rounded-full ${courseTone(subject.course.colorToken).bar}`}
            />
            {subject.course.name}
          </h2>
          <p className="text-muted mt-0.5 text-xs">
            Graded {subject.gradedCount} of {subject.totalCount} •{" "}
            {subject.sectionCode}
          </p>
        </div>
        {subject.stars > 0 && (
          <Pill tone="amber">
            {subject.stars} <StarIcon className="size-3" /> Earned
          </Pill>
        )}
      </div>

      <nav
        aria-label="Filter by category"
        className="mt-4 flex flex-wrap gap-2"
      >
        {filters.map((filter) => {
          const active = filter.id === category;
          return (
            <Link
              key={filter.label}
              href={scoresHref({
                term,
                subject: subject.sectionId,
                category: filter.id,
              })}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-navy text-white"
                  : "bg-canvas text-ink hover:bg-brand-soft"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {shown.length === 0 ? (
        <EmptyState>
          {scored.length === 0
            ? "Scores appear here once your teacher releases them."
            : "Nothing graded in this category yet."}
        </EmptyState>
      ) : (
        <ul className="mt-2">
          {shown.map((item) => {
            const tag = item.categoryId
              ? categories.get(item.categoryId)
              : undefined;
            return (
              <li
                key={item.id}
                className="border-line flex items-start gap-3 border-b py-4 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-ink text-sm leading-snug font-bold">
                      {item.title}
                    </p>
                    {tag && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tag.badge}`}
                      >
                        {tag.name}
                      </span>
                    )}
                  </div>
                  <p className="text-muted mt-1 text-xs">
                    {shortDate(item.dueAt)} • {humanise(item.type)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {item.status === "EXCUSED" ? (
                    <p className="text-muted text-sm font-bold">Excused</p>
                  ) : (
                    <p className="text-navy text-lg font-extrabold whitespace-nowrap">
                      {points(item.score ?? 0)} / {points(item.pointsPossible)}
                    </p>
                  )}
                  {item.stars > 0 && (
                    <p className="inline-flex items-center gap-0.5 text-xs font-bold text-orange-600">
                      +{item.stars}
                      <StarIcon className="size-3" />
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {subject.categories.length > 0 && (
        <div className="bg-canvas mt-4 rounded-xl px-4 py-3 text-xs">
          <p className="text-ink font-semibold">
            Formula:{" "}
            {subject.categories
              .map((c) => `(${c.name} × ${(c.weightPercent / 100).toFixed(2)})`)
              .join(" + ")}
          </p>
          <p className="text-muted mt-1">
            {subject.percent !== null
              ? `Running grade ${points(subject.percent)}%${subject.letter ? ` • ${subject.letter}` : ""}. `
              : ""}
            Categories with nothing graded yet are left out and the remaining
            weights rescaled.
          </p>
        </div>
      )}
    </Card>
  );
}
