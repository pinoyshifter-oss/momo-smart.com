"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import { AlertIcon, PlusCircleIcon } from "~/app/_components/icons";
import { deleteSection, saveSection, type SaveState } from "../actions";

export type SectionOptions = {
  departments: Array<{ id: string; name: string }>;
  courses: Array<{
    id: string;
    code: string;
    name: string;
    level: string;
    departmentId: string;
  }>;
};

export type EditableSection = {
  id: string;
  courseName: string;
  code: string;
  period: number;
  room: string | null;
  capacity: number;
  days: string[];
  startTime: string;
  endTime: string;
};

const FIELD =
  "border-line bg-surface text-ink placeholder:text-muted/70 focus:border-brand focus:ring-brand/10 w-full rounded-lg border px-3 py-2.5 text-sm transition outline-none focus:ring-4 disabled:opacity-60";
const LABEL = "text-ink mb-1.5 block text-xs font-bold";

const WEEKDAYS = [
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
  { value: "SATURDAY", label: "Sat" },
];
const SCHOOL_WEEK = WEEKDAYS.slice(0, 5).map((day) => day.value);
const LEVELS = [
  { value: "REGULAR", label: "Regular" },
  { value: "HONORS", label: "Honors" },
  { value: "AP", label: "AP" },
  { value: "IB", label: "IB" },
  { value: "ELECTIVE", label: "Elective" },
];

/**
 * Add section (no `section`) or Edit section (with one): a button that opens
 * the section form in a dialog.
 */
export function SectionDialog({
  options,
  section,
  label,
  className,
}: {
  options: SectionOptions;
  section?: EditableSection;
  label: string;
  className: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Bumped on close, so every opening starts from the saved values.
  const [round, setRound] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={className}
      >
        {!section && <PlusCircleIcon className="size-4" />}
        {label}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={`section-title-${section?.id ?? "new"}`}
        onClose={() => setRound((value) => value + 1)}
        className="bg-surface m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/50"
      >
        <SectionForm
          key={round}
          options={options}
          section={section}
          onClose={() => dialog.current?.close()}
        />
      </dialog>
    </>
  );
}

function SectionForm({
  options,
  section,
  onClose,
}: {
  options: SectionOptions;
  section?: EditableSection;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveSection,
    null,
  );
  const [courseId, setCourseId] = useState("");
  const [departmentId, setDepartmentId] = useState(
    options.departments[0]?.id ?? "__new",
  );

  // The page re-renders with the saved section, so the dialog can go.
  useEffect(() => {
    if (state && "saved" in state) onClose();
  }, [state, onClose]);

  const titleId = `section-title-${section?.id ?? "new"}`;
  const departmentName = new Map(
    options.departments.map((department) => [department.id, department.name]),
  );
  const byDepartment = new Map<string, SectionOptions["courses"]>();
  for (const course of options.courses) {
    const group = departmentName.get(course.departmentId) ?? "Other";
    byDepartment.set(group, [...(byDepartment.get(group) ?? []), course]);
  }

  return (
    <form
      // Submitted by hand rather than through `action`, which would reset the
      // fields after a rejected attempt.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <div className="border-line flex items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 id={titleId} className="text-ink text-lg font-bold">
            {section ? "Edit section" : "Add a section"}
          </h2>
          <p className="text-muted mt-0.5 text-xs">
            {section
              ? section.courseName
              : "Set up a class you teach this term, then enroll students into it."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:bg-canvas hover:text-ink -mr-1 rounded-lg px-2 py-1 text-lg leading-none transition"
        >
          ×
        </button>
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
        {section ? (
          <input type="hidden" name="sectionId" value={section.id} />
        ) : (
          <div>
            <label htmlFor="section-course" className={LABEL}>
              Course
            </label>
            <select
              id="section-course"
              name="courseId"
              required
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className={FIELD}
            >
              <option value="" disabled>
                Select a course
              </option>
              {[...byDepartment].map(([department, courses]) => (
                <optgroup key={department} label={department}>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="__new">+ New course…</option>
            </select>
          </div>
        )}

        {!section && courseId === "__new" && (
          <div className="border-line bg-canvas space-y-4 rounded-xl border p-4">
            <div>
              <label htmlFor="section-course-name" className={LABEL}>
                Course name
              </label>
              <input
                id="section-course-name"
                name="courseName"
                required
                placeholder="Marine Biology"
                className={FIELD}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="section-course-level" className={LABEL}>
                  Level
                </label>
                <select
                  id="section-course-level"
                  name="courseLevel"
                  defaultValue="REGULAR"
                  className={FIELD}
                >
                  {LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="section-department" className={LABEL}>
                  Department
                </label>
                <select
                  id="section-department"
                  name="departmentId"
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className={FIELD}
                >
                  {options.departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                  <option value="__new">+ New department…</option>
                </select>
              </div>
            </div>
            {departmentId === "__new" && (
              <div>
                <label htmlFor="section-department-name" className={LABEL}>
                  Department name
                </label>
                <input
                  id="section-department-name"
                  name="departmentName"
                  required
                  placeholder="Science Department"
                  className={FIELD}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="section-code" className={LABEL}>
              Section name
            </label>
            <input
              id="section-code"
              name="code"
              required
              placeholder="Sec 1"
              defaultValue={section?.code}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="section-period" className={LABEL}>
              Period
            </label>
            <select
              id="section-period"
              name="period"
              required
              defaultValue={section?.period ?? 1}
              className={FIELD}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map(
                (period) => (
                  <option key={period} value={period}>
                    Period {period}
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label htmlFor="section-capacity" className={LABEL}>
              Seats
            </label>
            <input
              id="section-capacity"
              name="capacity"
              type="number"
              required
              min={1}
              max={200}
              defaultValue={section?.capacity ?? 30}
              className={FIELD}
            />
          </div>
        </div>

        <div>
          <label htmlFor="section-room" className={LABEL}>
            Room <span className="text-muted font-medium">(optional)</span>
          </label>
          <input
            id="section-room"
            name="room"
            placeholder="Room 304"
            defaultValue={section?.room ?? ""}
            className={FIELD}
          />
        </div>

        <fieldset>
          <legend className={LABEL}>Meets on</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <label
                key={day.value}
                className="border-line has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand text-ink cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition select-none"
              >
                <input
                  type="checkbox"
                  name="days"
                  value={day.value}
                  defaultChecked={(section?.days ?? SCHOOL_WEEK).includes(
                    day.value,
                  )}
                  className="sr-only"
                />
                {day.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="section-start" className={LABEL}>
              Starts
            </label>
            <input
              id="section-start"
              name="startTime"
              type="time"
              required
              defaultValue={section?.startTime ?? "08:00"}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="section-end" className={LABEL}>
              Ends
            </label>
            <input
              id="section-end"
              name="endTime"
              type="time"
              required
              defaultValue={section?.endTime ?? "09:00"}
              className={FIELD}
            />
          </div>
        </div>
        {section && (
          <p className="text-muted -mt-2 text-[11px]">
            Saving applies these times to every selected day.
          </p>
        )}

        {state && "error" in state && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700"
          >
            <AlertIcon className="mt-px size-4 shrink-0" />
            {state.error}
          </p>
        )}
      </div>

      <div className="border-line flex justify-end gap-2 border-t px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="border-line text-ink hover:bg-canvas rounded-lg border px-4 py-2.5 text-sm font-semibold transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-brand hover:bg-brand/90 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {pending ? "Saving…" : section ? "Save changes" : "Add section"}
        </button>
      </div>
    </form>
  );
}

/** Deletes an empty section after a confirmation. */
export function DeleteSectionButton({
  sectionId,
  name,
  hasStudents,
}: {
  sectionId: string;
  name: string;
  hasStudents: boolean;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    deleteSection,
    null,
  );

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${name}? This can't be undone.`)) {
          event.preventDefault();
        }
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="sectionId" value={sectionId} />
      {state && "error" in state && (
        <span role="alert" className="text-xs font-semibold text-rose-600">
          {state.error}
        </span>
      )}
      <button
        type="submit"
        disabled={hasStudents || pending}
        title={hasStudents ? "Remove all students first" : `Delete ${name}`}
        className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
    </form>
  );
}
