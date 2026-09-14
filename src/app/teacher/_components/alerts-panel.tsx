import { sectionLabel } from "~/app/_components/format";
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  CapIcon,
  MailIcon,
  UsersIcon,
} from "~/app/_components/icons";
import { Avatar, Pill } from "~/app/_components/ui";

type Alert = {
  id: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  metadata: unknown;
  currentPercent: number | null;
  currentLetter: string | null;
  section: { code: string; course: { code: string } } | null;
  student: { id: string; user: { name: string | null; image: string | null } };
};

/** The one-tap follow-up offered for each kind of alert. */
const ACTION: Record<
  string,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  MISSING_WORK: {
    label: "Contact parent & counselor",
    className: "bg-navy text-white hover:bg-navy-deep",
    icon: MailIcon,
  },
  MISSED_ASSESSMENT: {
    label: "Schedule exam slot",
    className: "bg-brand text-white hover:bg-brand/90",
    icon: CalendarIcon,
  },
  GRADE_DROP: {
    label: "Assign peer tutor",
    className: "bg-brand-soft text-navy hover:bg-brand-soft/70",
    icon: CapIcon,
  },
  ATTENDANCE: {
    label: "Contact parent & counselor",
    className: "bg-navy text-white hover:bg-navy-deep",
    icon: MailIcon,
  },
  INACTIVITY: {
    label: "Message student",
    className: "bg-navy text-white hover:bg-navy-deep",
    icon: MailIcon,
  },
  BEHAVIOR: {
    label: "Log conference",
    className: "bg-brand-soft text-navy hover:bg-brand-soft/70",
    icon: UsersIcon,
  },
};

function badgeFor(alert: Alert) {
  const count =
    alert.metadata &&
    typeof alert.metadata === "object" &&
    "count" in alert.metadata &&
    typeof alert.metadata.count === "number"
      ? alert.metadata.count
      : null;

  if (alert.type === "MISSING_WORK" && count !== null) {
    return { label: `${count} Missing`, tone: "rose" as const };
  }
  if (alert.type === "GRADE_DROP")
    return { label: "Grade Drop", tone: "amber" as const };
  if (alert.type === "MISSED_ASSESSMENT")
    return { label: "Missed Exam", tone: "rose" as const };
  return {
    label: alert.severity === "CRITICAL" ? "Critical" : "Notice",
    tone: "slate" as const,
  };
}

export function AlertsPanel({
  alerts,
  total,
}: {
  alerts: Alert[];
  total: number;
}) {
  return (
    <section className="shadow-card bg-surface overflow-hidden rounded-2xl border border-rose-200">
      <div className="flex items-center justify-between gap-3 border-b border-rose-200/70 bg-rose-50 px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-rose-700">
          <AlertIcon className="size-5 text-rose-600" />
          Student Attention
        </h2>
        {total > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
            {total}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="text-muted px-5 py-8 text-center text-sm">
          No open alerts. Every student is on track.
        </p>
      ) : (
        <div className="divide-line divide-y px-4">
          {alerts.map((alert) => {
            const badge = badgeFor(alert);
            const action = ACTION[alert.type] ?? ACTION.MISSING_WORK!;
            const detail = [
              alert.section
                ? sectionLabel(alert.section.course.code, alert.section.code)
                : "School-wide",
              alert.currentPercent !== null
                ? `${alert.currentPercent}%${alert.currentLetter ? ` (${alert.currentLetter})` : ""}`
                : null,
            ]
              .filter(Boolean)
              .join(" • ");

            return (
              <article
                key={alert.id}
                title={alert.message}
                className="flex items-center gap-3 py-4"
              >
                <Avatar
                  name={alert.student.user.name}
                  src={alert.student.user.image}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm leading-snug font-bold">
                    {alert.student.user.name}
                  </p>
                  <p className="text-muted text-xs leading-snug">{detail}</p>
                </div>
                <Pill tone={badge.tone}>{badge.label}</Pill>
                <button
                  type="button"
                  aria-label={`${action.label} for ${alert.student.user.name ?? "student"}`}
                  title={action.label}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition ${action.className}`}
                >
                  <action.icon className="size-4" />
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="border-line bg-brand-soft/60 border-t px-5 py-3 text-center">
        <button
          type="button"
          className="text-brand inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
        >
          Intervention Portal
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
    </section>
  );
}
