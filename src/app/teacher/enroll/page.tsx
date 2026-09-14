import { type Metadata } from "next";

import { UserPlusIcon, UsersIcon } from "~/app/_components/icons";
import { studentEmailRule } from "~/server/lib/credentials";
import { api } from "~/trpc/server";
import {
  Avatar,
  Card,
  CardHeader,
  EmptyState,
  Pill,
} from "~/app/_components/ui";
import { dropStudent } from "../actions";
import { EnrollStudentDialog } from "../_components/enroll-dialog";
import { PageHeader, SectionTabs } from "../_components/page-header";
import { EnrollForm } from "./enroll-form";

export const metadata: Metadata = { title: "Enroll Students" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ section?: string }>;

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { section: sectionParam } = await searchParams;
  const [me, sections] = await Promise.all([
    api.user.me(),
    api.course.mySections(),
  ]);

  if (sections.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <PageHeader title="Enroll Students" />
        <Card>
          <EmptyState>
            You have no sections this term yet.{" "}
            <a
              href="/teacher/settings"
              className="text-brand font-semibold hover:underline"
            >
              Add a section in Class Settings
            </a>{" "}
            to start enrolling students.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const active = sections.find((s) => s.id === sectionParam) ?? sections[0]!;
  const roster = await api.course.roster({ sectionId: active.id });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Enroll Students"
        subtitle={`${active.course.name} — ${active.code} • ${roster.length} of ${active.capacity} seats filled.`}
        action={
          <EnrollStudentDialog
            label="New student"
            sections={sections.map((s) => ({
              id: s.id,
              label: `${s.course.name} — ${s.code} (Per. ${s.period})`,
            }))}
            defaultSectionId={active.id}
            emailRule={studentEmailRule(me.email)}
            className="bg-brand hover:bg-brand/90 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition"
          />
        }
      />

      <SectionTabs
        sections={sections.map((s) => ({
          id: s.id,
          label: `${s.course.code} — ${s.code}`,
        }))}
        activeId={active.id}
        basePath="/teacher/enroll"
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader
            icon={<UsersIcon className="size-[18px]" />}
            title="Class roster"
            subtitle={`${roster.length} active student${roster.length === 1 ? "" : "s"}`}
          />

          {roster.length === 0 ? (
            <EmptyState>No students enrolled yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="bg-canvas text-muted text-[11px] font-bold tracking-wider uppercase">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-4 py-3">Grade level</th>
                    <th className="px-4 py-3">Running grade</th>
                    <th className="px-5 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {roster.map((row) => (
                    <tr key={row.id} className="hover:bg-canvas/60 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={row.student.user.name}
                            src={row.student.user.image}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-ink truncate text-sm font-bold">
                              {row.student.user.name}
                            </p>
                            <p className="text-muted text-xs">
                              #{row.student.studentNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted px-4 py-3 text-xs font-semibold">
                        Grade {row.student.gradeLevel}
                      </td>
                      <td className="px-4 py-3">
                        {row.currentPercent === null ? (
                          <span className="text-muted text-xs">—</span>
                        ) : (
                          <span className="flex items-baseline gap-1.5">
                            <span className="text-ink text-sm font-extrabold">
                              {row.currentPercent}%
                            </span>
                            {row.currentLetter && (
                              <Pill tone="slate">{row.currentLetter}</Pill>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <form action={dropStudent}>
                          <input
                            type="hidden"
                            name="sectionId"
                            value={active.id}
                          />
                          <input
                            type="hidden"
                            name="studentId"
                            value={row.student.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            icon={<UserPlusIcon className="size-[18px]" />}
            title="Add an existing student"
            subtitle="Already has an account? Enroll by student ID or school email."
          />
          <div className="p-5">
            <EnrollForm
              key={active.id}
              sectionId={active.id}
              full={roster.length >= active.capacity}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
