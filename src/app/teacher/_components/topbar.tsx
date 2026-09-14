import {
  BellIcon,
  HelpIcon,
  PlusCircleIcon,
  SearchIcon,
} from "~/app/_components/icons";
import { AccountMenu } from "./account-menu";

export function Topbar({
  termName,
  week,
  teacherName,
  email,
  photoUrl,
  unreadNotifications,
}: {
  termName: string;
  week: number | null;
  teacherName: string;
  email: string;
  photoUrl: string | null;
  unreadNotifications: number;
}) {
  return (
    <header className="border-line bg-surface/90 sticky top-0 z-10 border-b backdrop-blur">
      <div className="flex items-center gap-4 px-5 py-3 lg:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-ink text-sm font-semibold">{termName}</span>
          {week !== null && (
            <span className="bg-brand-soft text-brand rounded-full px-2.5 py-1 text-[11px] font-bold">
              Week {week}
            </span>
          )}
        </div>

        <label className="relative hidden w-full max-w-xs min-w-0 md:block">
          <span className="sr-only">Search</span>
          <SearchIcon className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search student name, assignment, or rubric…"
            className="border-line bg-surface text-ink placeholder:text-muted focus:border-brand focus:ring-brand/10 w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition outline-none focus:ring-4"
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="text-muted hover:bg-canvas hover:text-ink relative rounded-lg p-2 transition"
            aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ""}`}
          >
            <BellIcon className="size-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            type="button"
            className="text-muted hover:bg-canvas hover:text-ink rounded-lg p-2 transition"
            aria-label="Help"
          >
            <HelpIcon className="size-5" />
          </button>

          <span
            aria-hidden="true"
            className="bg-line mx-1 hidden h-7 w-px sm:block"
          />

          <button
            type="button"
            className="bg-brand hover:bg-brand/90 hidden items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition sm:inline-flex"
          >
            <PlusCircleIcon className="size-4" />
            New Submission
          </button>

          <AccountMenu name={teacherName} email={email} photoUrl={photoUrl} />
        </div>
      </div>
    </header>
  );
}
