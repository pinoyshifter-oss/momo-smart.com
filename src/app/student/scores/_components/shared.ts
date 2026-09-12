import type { RouterOutputs } from "~/trpc/react";

export type MyScores = NonNullable<RouterOutputs["grading"]["myScores"]>;
export type Subject = MyScores["subjects"][number];

/** Category colours by position, so every subject's bars read the same way. */
const CATEGORY_TONES = [
  { bar: "bg-navy", badge: "bg-indigo-50 text-indigo-700" },
  { bar: "bg-brand", badge: "bg-brand-soft text-brand" },
  { bar: "bg-teal-600", badge: "bg-teal-50 text-teal-700" },
  { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
] as const;

export function categoryTone(index: number) {
  return CATEGORY_TONES[index % CATEGORY_TONES.length]!;
}

/** Honours band for a general average, or null below 90. */
export function honorsFor(average: number): string | null {
  if (average >= 98) return "With Highest Honors";
  if (average >= 95) return "With High Honors";
  if (average >= 90) return "With Honors";
  return null;
}

export type ScoresQuery = {
  term?: string;
  subject?: string;
  category?: string;
};

/** A Scores page link, leaving out whatever is unset. */
export function scoresHref(query: ScoresQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `/student/scores?${search}` : "/student/scores";
}
