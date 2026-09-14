import Link from "next/link";

import { LogoMark } from "~/app/_components/brand";
import {
  BookOpenIcon,
  CalendarIcon,
  ChartIcon,
  ChatIcon,
  ClipboardIcon,
  GridIcon,
  SettingsIcon,
  UserPlusIcon,
  WrenchIcon,
} from "~/app/_components/icons";
import { Nav, type NavItem } from "~/app/_components/nav";
import { Avatar } from "~/app/_components/ui";

export function Sidebar({
  teacherName,
  photoUrl,
  department,
  focus,
  ungradedCount,
  unreadMessages,
}: {
  teacherName: string;
  photoUrl: string | null;
  department: string;
  focus: string;
  ungradedCount: number;
  unreadMessages: number;
}) {
  const items: NavItem[] = [
    { label: "Dashboard", href: "/teacher", exact: true },
    {
      label: "Assignments",
      href: "/teacher/assignments",
      badge: ungradedCount,
    },
    { label: "Class Record", href: "/teacher/grades" },
    { label: "Enroll Students", href: "/teacher/enroll" },
    { label: "Reports", href: "/teacher/reports" },
    { label: "Class Settings", href: "/teacher/settings" },
    { label: "Calendar", href: "/teacher/calendar" },
    { label: "Messages", href: "/teacher/messages", dot: unreadMessages > 0 },
    { label: "Teacher Tools", href: "/teacher/tools" },
  ];

  const icons: Record<string, React.ReactNode> = {
    Dashboard: <GridIcon className="size-[18px]" />,
    Assignments: <ClipboardIcon className="size-[18px]" />,
    "Class Record": <BookOpenIcon className="size-[18px]" />,
    "Enroll Students": <UserPlusIcon className="size-[18px]" />,
    Reports: <ChartIcon className="size-[18px]" />,
    "Class Settings": <SettingsIcon className="size-[18px]" />,
    Calendar: <CalendarIcon className="size-[18px]" />,
    Messages: <ChatIcon className="size-[18px]" />,
    "Teacher Tools": <WrenchIcon className="size-[18px]" />,
  };

  return (
    <aside className="border-line bg-surface hidden w-[256px] shrink-0 flex-col border-r lg:flex">
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
        {/* Brand */}
        <div className="flex items-center gap-3 px-1">
          <LogoMark className="size-11 shrink-0" />
          <div className="min-w-0">
            <p className="text-navy text-[22px] leading-tight font-extrabold tracking-tight">
              Smart Momo
            </p>
            <p className="text-muted mt-0.5 truncate text-[10px] leading-tight font-semibold tracking-[0.06em] uppercase">
              Faculty • {focus}
            </p>
            <span className="mt-1.5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] leading-tight font-bold tracking-wide text-emerald-700 uppercase">
              Teacher mode
            </span>
          </div>
        </div>

        {/* Signed-in teacher, linking to their profile settings */}
        <Link
          href="/teacher/profile"
          title="Profile settings"
          className="border-line bg-brand-soft/50 hover:border-brand/30 mt-5 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition"
        >
          <Avatar name={teacherName} src={photoUrl} />
          <div className="min-w-0">
            <p className="text-ink truncate text-sm font-bold">{teacherName}</p>
            <p className="text-muted truncate text-xs">{department}</p>
          </div>
        </Link>

        <Nav items={items} icons={icons} />
      </div>
    </aside>
  );
}
