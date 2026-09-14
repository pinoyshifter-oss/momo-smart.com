import { ChartIcon, CheckCircleIcon, StarIcon } from "~/app/_components/icons";
import { Card, Pill } from "~/app/_components/ui";
import { points } from "~/app/student/(app)/_components/format";
import { honorsFor, type MyScores } from "./shared";

/** The four headline figures above the subject list. */
export function StatCards({ scores }: { scores: MyScores }) {
  const { average, letter, stars, graded, standing } = scores;
  const completion =
    graded.total > 0
      ? Math.round((graded.count / graded.total) * 1000) / 10
      : 0;
  const honors = average !== null ? honorsFor(average) : null;
  const topPercent = standing
    ? Math.max(1, Math.ceil((standing.rank / standing.cohortSize) * 100))
    : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Term General Average"
        corner={letter && <Pill tone="blue">{letter}</Pill>}
        value={average !== null ? points(average) : "—"}
        unit="/ 100"
        footer={
          <>
            {honors ? (
              <Pill tone="green">
                <CheckCircleIcon className="size-3.5" />
                {honors}
              </Pill>
            ) : (
              <span className="text-muted">
                {average !== null ? "Keep it up" : "No grades released yet"}
              </span>
            )}
            <span className="text-muted">Weighted average</span>
          </>
        }
      />

      <StatCard
        label="Momo Stars Earned"
        corner={
          <span className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <StarIcon className="size-4" />
          </span>
        }
        value={stars.total.toLocaleString()}
        unit={
          <span className="inline-flex items-center gap-1 font-bold text-orange-600">
            <StarIcon className="size-4" />
            Stars
          </span>
        }
        footer={
          <>
            <span className="text-ink">
              +{stars.thisWeek.toLocaleString()} this week
            </span>
            <span className="text-navy font-bold">1 Star / Pt</span>
          </>
        }
      />

      <StatCard
        label="Graded Items"
        corner={<CheckCircleIcon className="text-muted size-5" />}
        value={String(graded.count)}
        unit={`/ ${graded.total} Assessments`}
        footer={
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-ink">Completion</span>
              <span className="text-navy font-bold">{completion}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Graded work completion"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              className="bg-brand-soft mt-2 h-1.5 overflow-hidden rounded-full"
            >
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        }
      />

      <StatCard
        label="Class Standing"
        corner={<ChartIcon className="text-muted size-5" />}
        value={topPercent !== null ? `Top ${topPercent}%` : "—"}
        unit={topPercent !== null ? "Cohort" : undefined}
        footer={
          standing ? (
            <>
              <span className="text-ink">Grade {scores.gradeLevel}</span>
              <span className="font-bold text-teal-700">
                Rank #{standing.rank} of {standing.cohortSize}
              </span>
            </>
          ) : (
            <span className="text-muted">
              Ranks appear once grades are released.
            </span>
          )
        }
      />
    </div>
  );
}

function StatCard({
  label,
  corner,
  value,
  unit,
  footer,
}: {
  label: string;
  corner?: React.ReactNode;
  value: string;
  unit?: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted text-[11px] font-bold tracking-[0.08em] uppercase">
          {label}
        </p>
        {corner}
      </div>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span className="text-navy text-4xl font-extrabold tracking-tight">
          {value}
        </span>
        {unit && <span className="text-muted text-sm">{unit}</span>}
      </p>
      <div className="border-line mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs font-semibold">
        {footer}
      </div>
    </Card>
  );
}
