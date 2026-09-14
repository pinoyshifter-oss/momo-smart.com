import { type Metadata } from "next";
import Link from "next/link";

import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarIcon,
  CapIcon,
  ChartIcon,
  ChatIcon,
  ClipboardIcon,
  UserPlusIcon,
} from "~/app/_components/icons";
import { PageHeader } from "../_components/page-header";

export const metadata: Metadata = { title: "Teacher Tools" };

const TOOLS = [
  {
    title: "Take attendance",
    description: "Open today's period roster from the dashboard.",
    href: "/teacher",
    icon: CalendarCheckIcon,
    tint: "bg-teal-50 text-teal-700",
  },
  {
    title: "Assignments",
    description: "Create, publish and track coursework by section.",
    href: "/teacher/assignments",
    icon: ClipboardIcon,
    tint: "bg-amber-50 text-amber-700",
  },
  {
    title: "Class record",
    description: "The gradebook: every score, gap and running grade.",
    href: "/teacher/grades",
    icon: BookOpenIcon,
    tint: "bg-brand-soft text-brand",
  },
  {
    title: "Add a section",
    description: "Set up a class you teach, with its schedule and seats.",
    href: "/teacher/settings",
    icon: CapIcon,
    tint: "bg-teal-50 text-teal-700",
  },
  {
    title: "Enroll students",
    description: "Add or remove students from your section rosters.",
    href: "/teacher/enroll",
    icon: UserPlusIcon,
    tint: "bg-brand-soft text-navy",
  },
  {
    title: "Course overview",
    description: "Meeting times, seats and averages for every section.",
    href: "/teacher/courses",
    icon: CapIcon,
    tint: "bg-violet-50 text-violet-700",
  },
  {
    title: "Reports",
    description: "Term summary and grade distribution per section.",
    href: "/teacher/reports",
    icon: ChartIcon,
    tint: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Calendar",
    description: "Deadlines, exams and school events.",
    href: "/teacher/calendar",
    icon: CalendarIcon,
    tint: "bg-rose-50 text-rose-700",
  },
  {
    title: "Messages",
    description: "Conversations with students and families.",
    href: "/teacher/messages",
    icon: ChatIcon,
    tint: "bg-slate-100 text-slate-700",
  },
];

export default function TeacherToolsPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Teacher Tools"
        subtitle="Shortcuts to everything you need during the school day."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group border-line bg-surface shadow-card hover:border-brand/40 flex flex-col rounded-2xl border p-5 transition"
          >
            <span
              className={`flex size-10 items-center justify-center rounded-xl ${tool.tint}`}
            >
              <tool.icon className="size-5" />
            </span>
            <p className="text-ink mt-4 text-sm font-bold">{tool.title}</p>
            <p className="text-muted mt-1 flex-1 text-xs leading-relaxed">
              {tool.description}
            </p>
            <span className="text-brand mt-4 inline-flex items-center gap-1 text-xs font-bold group-hover:underline">
              Open
              <ArrowRightIcon className="size-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
