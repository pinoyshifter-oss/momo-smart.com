import {
  AlertIcon,
  CalendarCheckIcon,
  NotePenIcon,
  UsersIcon,
} from "~/app/_components/icons";

type Stat = {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  valueClass: string;
  unitClass: string;
  accent: string;
  iconClass: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function StatCards({
  totalEnrolled,
  ungradedCount,
  attendanceRate,
  attendanceDelta,
  atRiskCount,
}: {
  totalEnrolled: number;
  ungradedCount: number;
  attendanceRate: number | null;
  attendanceDelta: number | null;
  atRiskCount: number;
}) {
  const stats: Stat[] = [
    {
      label: "Enrolled",
      value: String(totalEnrolled),
      unit: "Students",
      valueClass: "text-ink",
      unitClass: "text-muted",
      accent: "bg-navy",
      iconClass: "bg-brand-soft text-navy",
      icon: UsersIcon,
    },
    {
      label: "To Grade",
      value: String(ungradedCount),
      unit: "Pending",
      valueClass: "text-amber-700",
      unitClass: "text-amber-700",
      accent: "bg-amber-600",
      iconClass: "bg-amber-100 text-amber-700",
      icon: NotePenIcon,
    },
    {
      label: "Attendance",
      value: attendanceRate === null ? "—" : `${attendanceRate}%`,
      delta:
        attendanceDelta === null || attendanceDelta === 0
          ? undefined
          : `${attendanceDelta > 0 ? "+" : ""}${attendanceDelta}%`,
      valueClass: "text-teal-700",
      unitClass: "text-teal-600",
      accent: "bg-teal-600",
      iconClass: "bg-teal-50 text-teal-700",
      icon: CalendarCheckIcon,
    },
    {
      label: "Attention Needed",
      value: String(atRiskCount),
      unit: "Students",
      valueClass: "text-rose-600",
      unitClass: "text-rose-600",
      accent: "bg-rose-600",
      iconClass: "bg-rose-100 text-rose-600",
      icon: AlertIcon,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="border-line bg-surface shadow-card relative overflow-hidden rounded-2xl border px-4 pt-4 pb-5"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 h-1 ${stat.accent}`}
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">
                {stat.label}
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`text-3xl font-extrabold tracking-tight ${stat.valueClass}`}
                >
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className={`text-[11px] font-semibold ${stat.unitClass}`}>
                    {stat.unit}
                  </span>
                )}
                {stat.delta && (
                  <span className={`text-[11px] font-bold ${stat.unitClass}`}>
                    {stat.delta}
                  </span>
                )}
              </p>
            </div>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
            >
              <stat.icon className="size-5" />
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
