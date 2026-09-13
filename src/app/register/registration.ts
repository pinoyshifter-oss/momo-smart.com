/** Shared by the registration form and its server action. */

export const TEACHER_TITLES = [
  "Mr.",
  "Ms.",
  "Mrs.",
  "Mx.",
  "Dr.",
  "Prof.",
] as const;

/** Offered as suggestions only; any subject can be typed. */
export const SUBJECT_SUGGESTIONS = [
  "Biology",
  "Chemistry",
  "Physics",
  "General Science",
  "Mathematics",
  "English",
  "Filipino",
  "History",
  "Social Studies",
  "Computer Science",
  "Physical Education",
  "Music",
  "Arts",
  "Foreign Language",
];

/** Either a school picked from search or one the teacher is adding. */
export type OrganizationChoice =
  | { kind: "existing"; id: string; name: string; city: string | null }
  | { kind: "new"; name: string; city: string };

export type RegistrationState = {
  error: string | null;
  /** The step to send the teacher back to when the error is theirs to fix. */
  step?: "school" | "profile" | "account";
};

/** Upper bound for the stored photo data URL (~220 KB of JPEG). */
export const MAX_PHOTO_LENGTH = 300_000;
