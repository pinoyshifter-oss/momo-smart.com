import Link from "next/link";

import { timeAgo } from "~/app/_components/format";
import { Card, CardHeader, EmptyState, Pill } from "~/app/_components/ui";
import { api } from "~/trpc/server";

const ROLE_TONE: Record<string, "blue" | "green" | "amber" | "violet"> = {
  Teacher: "blue",
  Administrator: "amber",
  "IT / District": "violet",
  Other: "green",
};

const joined = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const requested = Number((await searchParams).page);
  const page = Number.isInteger(requested) && requested > 1 ? requested : 1;

  const data = await api.waitlist.list({ page });
  const first = (data.page - 1) * data.pageSize + 1;
  const last = first + data.entries.length - 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-ink text-3xl font-extrabold tracking-tight">
          Join Waitlist
        </h1>
        <p className="text-muted mt-2 max-w-2xl text-sm">
          Early-access requests submitted from the public demo page, newest
          first.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total signups" value={data.total} />
        <Stat label="Last 7 days" value={data.lastWeek} />
        {data.byRole.slice(0, 2).map((group) => (
          <Stat key={group.role} label={group.role} value={group.count} />
        ))}
      </dl>

      <Card>
        <CardHeader
          title="Waitlist entries"
          subtitle={
            data.total === 0
              ? "No signups yet"
              : `Showing ${first}–${last} of ${data.total}`
          }
        />

        {data.entries.length === 0 ? (
          <EmptyState>
            {data.total === 0
              ? "Nobody has joined the waitlist yet."
              : "This page is empty."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="bg-canvas text-muted text-[11px] font-bold tracking-wider uppercase">
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-4 py-3">School / District</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {data.entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-canvas/60 align-top transition"
                  >
                    <td className="px-5 py-4">
                      <p className="text-ink text-sm font-bold">
                        {entry.name ?? "—"}
                      </p>
                      <a
                        href={`mailto:${entry.email}`}
                        className="text-brand mt-0.5 block text-xs font-semibold hover:underline"
                      >
                        {entry.email}
                      </a>
                    </td>
                    <td className="text-ink px-4 py-4 text-sm font-semibold">
                      {entry.school}
                    </td>
                    <td className="px-4 py-4">
                      <Pill tone={ROLE_TONE[entry.role] ?? "slate"}>
                        {entry.role}
                      </Pill>
                    </td>
                    <td className="text-muted max-w-xs px-4 py-4 text-xs">
                      {entry.message ? (
                        <p className="line-clamp-3" title={entry.message}>
                          {entry.message}
                        </p>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-muted px-4 py-4 text-xs font-semibold">
                      {entry.source}
                    </td>
                    <td className="px-5 py-4 text-xs whitespace-nowrap">
                      <p className="text-ink font-semibold">
                        {joined.format(entry.createdAt)}
                      </p>
                      <p className="text-muted mt-0.5">
                        {timeAgo(entry.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.pageCount > 1 && (
          <div className="border-line flex items-center justify-between gap-3 border-t px-5 py-3">
            <p className="text-muted text-xs font-semibold">
              Page {data.page} of {data.pageCount}
            </p>
            <div className="flex gap-2">
              <PageLink page={data.page - 1} disabled={data.page <= 1}>
                Previous
              </PageLink>
              <PageLink
                page={data.page + 1}
                disabled={data.page >= data.pageCount}
              >
                Next
              </PageLink>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-line bg-surface shadow-card rounded-2xl border px-4 py-3">
      <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-ink mt-1 text-2xl font-extrabold">{value}</dd>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className =
    "border-line bg-surface rounded-lg border px-3 py-2 text-xs font-semibold transition";
  if (disabled) {
    return (
      <span className={`${className} text-muted cursor-not-allowed opacity-60`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={page === 1 ? "/superadmin" : `/superadmin?page=${page}`}
      className={`${className} text-ink hover:bg-canvas`}
    >
      {children}
    </Link>
  );
}
