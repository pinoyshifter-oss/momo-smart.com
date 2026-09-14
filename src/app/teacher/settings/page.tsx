import { type Metadata } from "next";

import { SettingsIcon } from "~/app/_components/icons";
import { api } from "~/trpc/server";
import { clock, humanise } from "~/app/_components/format";
import { Card, CardHeader, Pill } from "~/app/_components/ui";
import { PageHeader } from "../_components/page-header";
import { DeleteSectionButton, SectionDialog } from "./section-dialog";

export const metadata: Metadata = { title: "Class Settings" };
export const dynamic = "force-dynamic";

const PRIMARY =
  "bg-brand hover:bg-brand/90 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition";

export default async function ClassSettingsPage() {
  const [sections, options] = await Promise.all([
    api.course.mySections(),
    api.section.setupOptions(),
  ]);
  const details = await Promise.all(
    sections.map((section) =>
      api.course.sectionDetail({ sectionId: section.id }),
    ),
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Class Settings"
        subtitle="Add the sections you teach, and set their schedule, seats and room."
        action={
          options.term && (
            <SectionDialog
              options={options}
              label="Add section"
              className={PRIMARY}
            />
          )
        }
      />

      {!options.term ? (
        <Card>
          <p className="text-muted px-5 py-8 text-center text-sm">
            No current term is set up yet, so sections can&apos;t be added.
            Ask your school administrator to open the term.
          </p>
        </Card>
      ) : details.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <p className="text-ink text-base font-bold">
              You don&apos;t have any sections yet
            </p>
            <p className="text-muted max-w-md text-sm">
              Add a section for each class you teach in {options.term.name}.
              Then you can enroll students into it.
            </p>
            <SectionDialog
              options={options}
              label="Add your first section"
              className={`${PRIMARY} mt-2`}
            />
          </div>
        </Card>
      ) : (
        details.map((section) => {
          const first = section.meetings[0];
          const name = `${section.course.name} — ${section.code}`;

          return (
            <Card key={section.id}>
              <CardHeader
                icon={<SettingsIcon className="size-[18px]" />}
                title={name}
                subtitle={[
                  `Period ${section.period}`,
                  section.room,
                  `${section.studentCount}/${section.capacity} seats`,
                  section.term.name,
                ]
                  .filter(Boolean)
                  .join(" • ")}
                action={
                  <>
                    <Pill tone="violet">{section.course.level}</Pill>
                    <SectionDialog
                      options={options}
                      label="Edit"
                      section={{
                        id: section.id,
                        courseName: section.course.name,
                        code: section.code,
                        period: section.period,
                        room: section.room,
                        capacity: section.capacity,
                        days: section.meetings.map((m) => m.dayOfWeek),
                        startTime: first?.startTime ?? "08:00",
                        endTime: first?.endTime ?? "09:00",
                      }}
                      className="border-line bg-surface text-ink hover:bg-canvas rounded-lg border px-3 py-2 text-xs font-semibold transition"
                    />
                    <DeleteSectionButton
                      sectionId={section.id}
                      name={name}
                      hasStudents={section.studentCount > 0}
                    />
                  </>
                }
              />

              <div className="grid gap-5 p-5 md:grid-cols-3">
                <div>
                  <BlockTitle>Schedule</BlockTitle>
                  {section.meetings.length === 0 ? (
                    <p className="text-muted mt-2 text-xs">No meetings set.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {section.meetings.map((meeting, index) => (
                        <li
                          key={`${meeting.dayOfWeek}-${meeting.startTime}-${index}`}
                          className="text-ink text-xs"
                        >
                          <span className="font-semibold">
                            {humanise(meeting.dayOfWeek)}
                          </span>{" "}
                          {clock(meeting.startTime)} – {clock(meeting.endTime)}
                          {meeting.rotation !== "ALL" &&
                            ` (${meeting.rotation.toLowerCase()} days)`}
                          {meeting.room && (
                            <span className="text-muted">
                              {" "}
                              • {meeting.room}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <BlockTitle>Grade weights</BlockTitle>
                  {section.gradeCategories.length === 0 ? (
                    <p className="text-muted mt-2 text-xs">
                      Points-based — no weighted categories.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {section.gradeCategories.map((category) => (
                        <li key={category.id}>
                          <div className="flex justify-between text-xs">
                            <span className="text-ink font-semibold">
                              {category.name}
                            </span>
                            <span className="text-muted">
                              {category.weightPercent}%
                            </span>
                          </div>
                          <Bar percent={category.weightPercent} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <BlockTitle>Curriculum pacing</BlockTitle>
                  <p className="text-ink mt-2 text-xs font-semibold">
                    {section.pacingSummary.completedUnits} of{" "}
                    {section.pacingSummary.totalUnits} units complete •{" "}
                    {section.pacingSummary.percent}%
                  </p>
                  <Bar percent={section.pacingSummary.percent} />
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

function BlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted text-[10px] font-bold tracking-wider uppercase">
      {children}
    </p>
  );
}

function Bar({ percent }: { percent: number }) {
  return (
    <div className="bg-line mt-1.5 h-1.5 overflow-hidden rounded-full">
      <div
        className="h-full rounded-full bg-teal-600"
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}
