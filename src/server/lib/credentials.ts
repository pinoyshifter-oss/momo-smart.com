import { randomInt } from "node:crypto";

import { env } from "~/env";

/** No 0/O, 1/l/I — the password is read off an email or a screen. */
const PASSWORD_ALPHABET =
  "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** A 12-character temporary password in groups, e.g. "hK7m-Qp4x-T9ce". */
export function temporaryPassword(): string {
  return Array.from({ length: 3 }, () =>
    Array.from(
      { length: 4 },
      () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)],
    ).join(""),
  ).join("-");
}

/** "Oakridge High School" → "OHS"; "STU" when there is no usable name. */
export function studentNumberPrefix(schoolName: string | null | undefined) {
  const initials = (schoolName ?? "")
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
  return initials.length >= 2 ? initials : "STU";
}

/** A student ID in the school's format, e.g. "OHS-28491". */
export function studentNumber(prefix: string): string {
  return `${prefix}-${randomInt(10_000, 100_000)}`;
}

/** Webmail providers, which say nothing about which school someone is at. */
const PUBLIC_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
  "yandex.com",
]);

const domainOf = (email: string) =>
  email.slice(email.lastIndexOf("@") + 1).toLowerCase();

/**
 * The school's email domain, read off a staff address. Null for webmail
 * addresses, which can't vouch for a school.
 */
export function schoolDomain(staffEmail: string | null | undefined) {
  if (!staffEmail?.includes("@")) return null;
  const domain = domainOf(staffEmail);
  return PUBLIC_MAIL.has(domain) ? null : domain;
}

/** The school domain itself or a subdomain of it, e.g. student.school.edu. */
export function onSchoolDomain(email: string, domain: string): boolean {
  const candidate = domainOf(email);
  return candidate === domain || candidate.endsWith(`.${domain}`);
}

/**
 * Which emails a teacher may give new students: any address while
 * ALLOW_ANY_STUDENT_EMAIL is on (testing), otherwise the school's domain —
 * and none when the teacher's own address is webmail.
 */
export type StudentEmailRule =
  | { kind: "any" }
  | { kind: "school"; domain: string }
  | { kind: "unknown" };

export function studentEmailRule(
  staffEmail: string | null | undefined,
): StudentEmailRule {
  if (env.ALLOW_ANY_STUDENT_EMAIL) return { kind: "any" };
  const domain = schoolDomain(staffEmail);
  return domain ? { kind: "school", domain } : { kind: "unknown" };
}
