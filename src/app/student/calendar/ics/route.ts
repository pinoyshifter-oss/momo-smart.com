import { TRPCError } from "@trpc/server";

import { addDays, startOfDay } from "~/server/lib/dates";
import { api } from "~/trpc/server";

/** How far ahead the export reaches, inside the schedule query's limit. */
const EXPORT_DAYS = 60;

const SUMMARY_PREFIX = { class: "", due: "Due: ", exam: "Exam: ", event: "" };

/** "20241024T235900Z" */
const icsDateTime = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** "20241024", in local time, for all-day events. */
const icsDay = (date: Date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

const escapeText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/** RFC 5545 folds content lines longer than 75 characters. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) {
    parts.push(` ${line.slice(i, i + 74)}`);
  }
  return parts.join("\r\n");
}

/**
 * The student's next two months as an iCalendar file, to import into Google
 * Calendar, Apple Calendar or Outlook.
 */
export async function GET() {
  const today = startOfDay(new Date());

  let entries;
  try {
    entries = await api.calendar.studentSchedule({
      from: today,
      to: addDays(today, EXPORT_DAYS),
    });
  } catch (error) {
    if (
      error instanceof TRPCError &&
      (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN")
    ) {
      return new Response("Sign in as a student to export your calendar.", {
        status: 401,
      });
    }
    throw error;
  }

  const stamp = icsDateTime(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smart Momo//Student Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Smart Momo",
  ];

  for (const entry of entries) {
    lines.push("BEGIN:VEVENT", `UID:${entry.id}@momosmart.edu`);
    lines.push(`DTSTAMP:${stamp}`);
    if (entry.allDay) {
      lines.push(
        `DTSTART;VALUE=DATE:${icsDay(entry.startAt)}`,
        `DTEND;VALUE=DATE:${icsDay(addDays(entry.startAt, 1))}`,
      );
    } else {
      lines.push(
        `DTSTART:${icsDateTime(entry.startAt)}`,
        `DTEND:${icsDateTime(entry.endAt ?? entry.startAt)}`,
      );
    }
    lines.push(
      `SUMMARY:${escapeText(SUMMARY_PREFIX[entry.kind] + entry.title)}`,
    );
    if (entry.location) lines.push(`LOCATION:${escapeText(entry.location)}`);

    const description = [
      entry.courseName !== entry.title && entry.courseName,
      entry.detail,
      entry.points !== null && `${entry.points} pts`,
    ]
      .filter(Boolean)
      .join(" • ");
    if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  return new Response(`${lines.map(fold).join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="smart-momo-calendar.ics"',
      "Cache-Control": "no-store",
    },
  });
}
