import { ConvexHttpClient } from "convex/browser";
import type { FunctionArgs } from "convex/server";

import { api } from "../../../convex/_generated/api";

export type SeedThread = FunctionArgs<
  typeof api.trusted.replaceAllForDemo
>["threads"][number];

/**
 * Replaces every Convex conversation with the demo school's threads. Reads
 * the environment directly (not `~/env`) so it also runs from the `db:seed`
 * CLI; without Convex configured it skips rather than failing the seed.
 */
export async function seedMessaging(threads: SeedThread[]): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const secret = process.env.MESSAGING_SERVER_SECRET;
  if (!url || !secret) {
    console.warn(
      "Skipping the messaging seed: Convex is not configured (run `npm run messaging:setup`).",
    );
    return false;
  }
  await new ConvexHttpClient(url).mutation(api.trusted.replaceAllForDemo, {
    secret,
    threads,
  });
  return true;
}
