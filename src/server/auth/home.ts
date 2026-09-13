import type { UserRole } from "../../../generated/prisma";

/**
 * Where a signed-in user belongs. Teachers and administrators land on the
 * command center; students land on their own dashboard; the superadmin only
 * has the waitlist console.
 */
export function homeForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "SUPERADMIN":
      return "/superadmin";
    case "TEACHER":
    case "ADMIN":
      return "/teacher";
    case "STUDENT":
      return "/student";
    default:
      return "/";
  }
}
