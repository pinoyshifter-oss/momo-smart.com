import { type Metadata } from "next";
import Link from "next/link";

import { ChevronRightIcon } from "~/app/_components/icons";
import { Card, EmptyState } from "~/app/_components/ui";
import { api } from "~/trpc/server";
import { AssessmentsPanel } from "./_components/assessments-panel";
import { PrintButton } from "./_components/print-button";
import { scoresHref } from "./_components/shared";
import { StatCards } from "./_components/stat-cards";
import { SubjectCard } from "./_components/subject-card";

export const metadata: Metadata = { title: "Scores & Grading · Momo Smart" };

/** Grades are released while the student browses, so never cache. */
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
const param = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function StudentScores({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestedTerm = param(params.term);
  const scores = await api.grading.myScores(
    requestedTerm ? { termId: requestedTerm } : undefined,
  );

  if (!scores) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <Card>
          <EmptyState>
            No term is open yet — your scores appear here once classes begin.
          </EmptyState>
        </Card>
      </div>
    );
  }

  // The current term is the default, so its links stay parameter-free.
  const term = scores.term.isCurrent ? undefined : scores.term.id;
  // Open the subject asked for, else the first one with scores to show.
  const selected =
    scores.subjects.find((s) => s.sectionId === param(params.subject)) ??
    scores.subjects.find((s) => s.gradedCount > 0) ??
    scores.subjects[0] ??
    null;
  const category = selected?.categories.find(
    (c) => c.id === param(params.category),
  )?.id;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="text-muted flex flex-wrap items-center gap-1.5 text-xs font-semibold"
          >
            <span>Academic Performance</span>
            <ChevronRightIcon className="size-3.5" />
            <span className="text-brand">Scores &amp; Grading</span>
            <ChevronRightIcon className="size-3.5" />
            <span>SY {scores.term.schoolYear}</span>
          </nav>
          <h1 className="text-navy mt-2 text-3xl font-extrabold tracking-tight">
            Academic Gradebook &amp; Scores
          </h1>
          <p className="text-muted mt-2 max-w-2xl text-sm">
            Each subject&apos;s running grade, weighted by the categories your
            teachers set, with every released score behind it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <nav
            aria-label="Term"
            className="border-line bg-surface inline-flex flex-wrap rounded-xl border p-1 print:hidden"
          >
            {scores.terms.map((item) => {
              const active = item.id === scores.term.id;
              return (
                <Link
                  key={item.id}
                  href={scoresHref({
                    term: item.isCurrent ? undefined : item.id,
                  })}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    active ? "bg-navy text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.name}
                  {item.isCurrent && (
                    <span className={active ? "text-white/70" : ""}>
                      {" "}
                      (Current)
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <PrintButton />
        </div>
      </div>

      <StatCards scores={scores} />

      {scores.subjects.length === 0 ? (
        <Card>
          <EmptyState>
            You aren&apos;t enrolled in any classes this term.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="min-w-0 space-y-4">
            <div className="border-line flex flex-wrap items-end justify-between gap-3 border-b pb-3">
              <h2 className="text-navy text-xl font-bold">
                Core Subjects Overview
              </h2>
              <span className="text-muted text-xs font-semibold">
                Showing {scores.subjects.length} enrolled subject
                {scores.subjects.length === 1 ? "" : "s"}
              </span>
            </div>
            {scores.subjects.map((subject) => (
              <SubjectCard
                key={subject.sectionId}
                subject={subject}
                selected={subject.sectionId === selected?.sectionId}
                href={scoresHref({ term, subject: subject.sectionId })}
              />
            ))}
          </section>

          {selected && (
            <aside className="min-w-0 xl:sticky xl:top-20 xl:self-start">
              <AssessmentsPanel
                subject={selected}
                category={category}
                term={term}
              />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
