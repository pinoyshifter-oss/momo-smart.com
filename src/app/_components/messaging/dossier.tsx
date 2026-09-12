"use client";

import { clock, humanise } from "~/app/_components/format";
import { Avatar, Pill } from "~/app/_components/ui";
import { api as trpc } from "~/trpc/react";
import { displayName, ROLE_STYLE, type Member, type Viewer } from "./shared";

const percentText = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/** Who you're talking to, from the school database. */
export function Dossier({
  members,
  viewer,
  onClose,
}: {
  members: Member[];
  viewer: Viewer;
  onClose: () => void;
}) {
  const only = members.length === 1 ? members[0] : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-line flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="text-ink text-base font-bold">
          {only ? "Recipient Details" : "Members"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-ink text-xs font-semibold 2xl:hidden"
        >
          Close
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {only ? (
          <PersonDetails member={only} viewer={viewer} />
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.userId}
                className="bg-canvas flex items-center gap-3 rounded-xl px-3 py-2.5"
              >
                <Avatar name={member.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-bold">
                    {displayName(member)}
                  </p>
                  <p className="text-muted truncate text-xs">
                    {member.subtitle ?? ROLE_STYLE[member.role].label}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PersonDetails({ member, viewer }: { member: Member; viewer: Viewer }) {
  const { data, isLoading, isError } = trpc.messaging.dossier.useQuery(
    { userId: member.userId },
    { staleTime: 60_000, retry: false },
  );

  const tiles: Array<{ label: string; value: string }> = data
    ? data.role === "TEACHER"
      ? [
          { label: "Office", value: data.office ?? "—" },
          {
            label: "Office hours today",
            value: data.officeHoursToday[0]
              ? `${clock(data.officeHoursToday[0].startTime)} – ${clock(data.officeHoursToday[0].endTime)}`
              : "None today",
          },
        ]
      : data.role === "STUDENT"
        ? [
            { label: "Grade level", value: `Gr. ${data.gradeLevel ?? "—"}` },
            { label: "Student ID", value: data.studentNumber ?? "—" },
          ]
        : []
    : [];

  return (
    <div className="space-y-6">
      <section className="border-line rounded-2xl border p-5 text-center">
        <span className="inline-flex scale-150 py-3">
          <Avatar name={member.name} size="lg" />
        </span>
        <p className="text-ink mt-3 text-lg font-bold">{displayName(member)}</p>
        <p className="text-muted mt-0.5 text-sm">
          {data?.subtitle ?? member.subtitle ?? ROLE_STYLE[member.role].label}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ROLE_STYLE[member.role].pill}`}
          >
            {member.role === "ADMIN"
              ? "School Staff"
              : member.role === "TEACHER"
                ? "Faculty"
                : "Student"}
          </span>
          {data && data.sharedCourses.length > 0 && (
            <Pill tone="green">
              {data.sharedCourses.length} shared class
              {data.sharedCourses.length === 1 ? "" : "es"}
            </Pill>
          )}
        </div>
        {tiles.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-2 text-left">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className="bg-canvas rounded-xl px-3 py-2.5"
              >
                <dt className="text-muted text-[11px]">{tile.label}</dt>
                <dd className="text-ink mt-0.5 text-sm font-bold">
                  {tile.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {isLoading ? (
        <p className="text-muted text-sm">Loading details…</p>
      ) : isError || !data ? (
        <p className="text-muted text-sm">
          More details aren&apos;t available for this person.
        </p>
      ) : (
        <>
          {data.sharedCourses.length > 0 && (
            <section>
              <p className="text-muted text-[11px] font-bold tracking-wide uppercase">
                Shared Courses
              </p>
              <ul className="mt-2 space-y-2">
                {data.sharedCourses.map((course) => (
                  <li
                    key={course.sectionId}
                    className="border-line rounded-xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-ink text-sm font-bold">
                        {course.courseName}
                      </p>
                      <Pill tone="blue">Period {course.period}</Pill>
                    </div>
                    {course.percent !== null && (
                      <>
                        <div className="mt-2 flex justify-between gap-2 text-xs">
                          <span className="text-muted">
                            {viewer.role === "STUDENT"
                              ? "Your current grade"
                              : "Current grade"}
                          </span>
                          <span className="text-ink font-bold">
                            {percentText(course.percent)}%
                            {course.letter && ` (${course.letter})`}
                          </span>
                        </div>
                        <div className="bg-brand-soft mt-1.5 h-1.5 overflow-hidden rounded-full">
                          <div
                            className="bg-brand h-full rounded-full"
                            style={{
                              width: `${Math.min(100, course.percent)}%`,
                            }}
                          />
                        </div>
                      </>
                    )}
                    <p className="text-muted mt-2 text-[11px]">
                      Syllabus progress {Math.round(course.syllabusPercent)}%
                      {course.room && ` • ${course.room}`}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.officeHoursToday.length > 0 && (
            <section>
              <p className="text-muted text-[11px] font-bold tracking-wide uppercase">
                Office Hours Today
              </p>
              <ul className="mt-2 space-y-2">
                {data.officeHoursToday.map((slot) => (
                  <li
                    key={slot.id}
                    className="bg-canvas rounded-xl px-4 py-3 text-xs"
                  >
                    <p className="text-ink font-bold">
                      {clock(slot.startTime)} – {clock(slot.endTime)}
                    </p>
                    <p className="text-muted mt-0.5">
                      {[slot.label, humanise(slot.mode), slot.location]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
