/**
 * The fields behind a unique-constraint violation (Prisma P2002) — e.g.
 * "termId,courseId,code" — or null for any other error.
 *
 * Checked by error code rather than `instanceof`: in development the Prisma
 * client is cached on `globalThis` across hot reloads, so its errors can come
 * from an earlier copy of the error class than the one a module imports.
 */
export function uniqueViolation(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const { code, meta } = error as {
    code?: unknown;
    meta?: { target?: unknown };
  };
  if (code !== "P2002") return null;

  const target = meta?.target;
  if (Array.isArray(target)) return target.map(String).join(",");
  return typeof target === "string" ? target : "";
}
