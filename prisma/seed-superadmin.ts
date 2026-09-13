/**
 * Creates or updates the platform superadmin: `npm run db:seed:superadmin`.
 *
 * Kept apart from the demo seed on purpose: the demo password is public, and
 * the superadmin can read every waitlist lead. The demo reset leaves
 * SUPERADMIN accounts in place, so this only needs to run once per database.
 *
 * Environment (read from the shell or `.env`):
 *   SUPERADMIN_EMAIL     defaults to superadmin@momosmart.edu
 *   SUPERADMIN_PASSWORD  at least 12 characters. When unset, a new account
 *                        gets a random password printed once; an existing
 *                        account keeps the password it has.
 *   SUPERADMIN_NAME      defaults to "Momo Superadmin"
 *
 * The waitlist itself is never seeded: /superadmin shows the real signups
 * from the /demo page.
 */
import { randomBytes } from "node:crypto";

import { hash } from "bcryptjs";

import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

/** An env var, treating an empty value (as in `.env.example`) as unset. */
const setting = (key: string) => {
  const value = process.env[key]?.trim();
  return value === "" ? undefined : value;
};

async function main() {
  const email = (
    setting("SUPERADMIN_EMAIL") ?? "superadmin@momosmart.edu"
  ).toLowerCase();
  const name = setting("SUPERADMIN_NAME") ?? "Momo Superadmin";
  const given = setting("SUPERADMIN_PASSWORD");

  if (given !== undefined && given.length < 12) {
    throw new Error("SUPERADMIN_PASSWORD must be at least 12 characters.");
  }

  const existing = await db.user.findUnique({
    where: { email },
    select: { role: true },
  });
  // Never silently promote a school account to platform access.
  if (existing && existing.role !== "SUPERADMIN") {
    throw new Error(
      `${email} already belongs to a ${existing.role} account. Set SUPERADMIN_EMAIL to a different address.`,
    );
  }

  const generated =
    !existing && !given ? randomBytes(18).toString("base64url") : null;
  const password = given ?? generated;
  const passwordHash = password ? await hash(password, 12) : undefined;

  await db.user.upsert({
    where: { email },
    create: { email, name, role: "SUPERADMIN", passwordHash },
    update: {
      name,
      role: "SUPERADMIN",
      isActive: true,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  console.log(`Superadmin ${existing ? "updated" : "created"}: ${email}`);
  if (generated) {
    console.log(`  Generated password: ${generated}`);
    console.log("  Store it now — it is not saved anywhere in plain text.");
  } else if (given) {
    console.log("  Password set from SUPERADMIN_PASSWORD.");
  } else {
    console.log("  Existing password kept.");
  }

  console.log("\n  Sign in at /login — you will land on /superadmin.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
