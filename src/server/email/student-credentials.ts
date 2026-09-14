import "server-only";

import { SITE_NAME, SITE_URL } from "~/server/site";
import { sendEmail, type EmailResult } from "./mailer";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ESCAPES[character]!);

export type StudentCredentials = {
  to: string;
  studentName: string;
  studentNumber: string;
  temporaryPassword: string;
  teacherName: string;
  sectionName: string;
  schoolName?: string | null;
};

/**
 * The welcome email a newly enrolled student receives: their student ID,
 * sign-in email and temporary password, and how to sign in. Kept separate
 * from sending so it can be previewed.
 */
export function studentCredentialsEmail({
  to,
  studentName,
  studentNumber,
  temporaryPassword,
  teacherName,
  sectionName,
  schoolName,
}: StudentCredentials) {
  const loginUrl = new URL("/login", SITE_URL).toString();
  const firstName = studentName.split(" ")[0] ?? studentName;
  const school = schoolName ?? SITE_NAME;
  const subject = `Welcome to ${SITE_NAME} — your student ID and sign-in details`;

  const text = [
    `Hi ${firstName},`,
    "",
    `Welcome to ${school}! ${teacherName} has enrolled you in ${sectionName}, and your ${SITE_NAME} student account is ready.`,
    "",
    "YOUR SIGN-IN DETAILS",
    `Student ID:          ${studentNumber}`,
    `Sign-in email:       ${to}`,
    `Temporary password:  ${temporaryPassword}`,
    "",
    "HOW TO SIGN IN",
    `1. Go to ${loginUrl}`,
    "2. Enter your school email and the temporary password above.",
    "3. Choose your own password (at least 8 characters). The temporary one stops working after that.",
    "",
    "Keep your student ID — it's your ID for school records. Never share your password; no teacher or staff member will ever ask for it.",
    "",
    `You're receiving this because ${teacherName} enrolled you in ${sectionName}. If you weren't expecting it, please tell your teacher.`,
  ].join("\n");

  const detail = (label: string, value: string, mono = false) => `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:13px;width:160px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:16px;font-weight:700;word-break:break-all;${
        mono
          ? "font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0.5px;"
          : ""
      }">${escape(value)}</td>
    </tr>`;

  const step = (number: number, body: string) => `
    <tr>
      <td style="padding:6px 12px 6px 0;vertical-align:top;width:28px;">
        <span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:12px;background:#12275e;color:#ffffff;font-size:12px;font-weight:700;text-align:center;">${number}</span>
      </td>
      <td style="padding:8px 0;color:#334155;font-size:14px;line-height:1.5;">${body}</td>
    </tr>`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your student ID is ${escape(studentNumber)}. Sign in with your temporary password and choose your own.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fb;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#12275e;padding:22px 32px;">
              <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">${SITE_NAME}</div>
              <div style="color:#c7d2fe;font-size:12px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;margin-top:4px;">${escape(school)} · Student account</div>
            </td>
          </tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 12px;color:#0f172a;font-size:22px;line-height:1.3;">Welcome, ${escape(firstName)}!</h1>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
              ${escape(teacherName)} has enrolled you in <strong style="color:#0f172a;">${escape(sectionName)}</strong>. Your student account is ready — here are your sign-in details.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border:1px solid #dbe3ff;border-radius:12px;">
              <tr><td style="padding:10px 22px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${detail("Student ID", studentNumber, true)}
                  ${detail("Sign-in email", to)}
                  ${detail("Temporary password", temporaryPassword, true)}
                </table>
              </td></tr>
            </table>

            <h2 style="margin:28px 0 8px;color:#0f172a;font-size:15px;">How to sign in</h2>
            <table role="presentation" cellpadding="0" cellspacing="0">
              ${step(1, `Go to <a href="${escape(loginUrl)}" style="color:#2563eb;font-weight:600;">${escape(loginUrl.replace(/^https?:\/\//, ""))}</a>`)}
              ${step(2, "Enter your school email and the temporary password above.")}
              ${step(3, "Choose your own password (at least 8 characters). The temporary one stops working after that.")}
            </table>

            <p style="margin:28px 0;">
              <a href="${escape(loginUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:10px;">Sign in to ${SITE_NAME}</a>
            </p>

            <p style="margin:0;padding:14px 16px;background:#fffbeb;border-radius:10px;color:#92400e;font-size:13px;line-height:1.6;">
              <strong>Keep this safe.</strong> Your student ID is your ID for school records. Never share your password — no teacher or staff member will ever ask for it.
            </p>
          </td></tr>
          <tr>
            <td style="border-top:1px solid #e5e8f0;padding:18px 32px;color:#94a3b8;font-size:12px;line-height:1.6;">
              You're receiving this because ${escape(teacherName)} enrolled you in ${escape(sectionName)}. If you weren't expecting it, please tell your teacher.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

/** Sends the welcome email; never throws (see `sendEmail`). */
export function sendStudentCredentials(
  details: StudentCredentials,
): Promise<EmailResult> {
  return sendEmail({ to: details.to, ...studentCredentialsEmail(details) });
}
