import "server-only";

import { ConvexHttpClient } from "convex/browser";
import type { FunctionArgs } from "convex/server";

import { api } from "@convex/_generated/api";
import { env } from "~/env";

/** True once `npm run messaging:setup` has run against a deployment. */
export function isMessagingConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_CONVEX_URL &&
    env.MESSAGING_JWT_PRIVATE_KEY &&
    env.MESSAGING_JWT_ISSUER &&
    env.MESSAGING_SERVER_SECRET,
  );
}

type StartArgs = Omit<
  FunctionArgs<typeof api.trusted.startConversation>,
  "secret"
>;

/**
 * Opens (or reuses) a conversation in Convex and posts its first message.
 * Callers must already have checked, against Postgres, that the sender may
 * message every member.
 */
export async function startConversation(args: StartArgs) {
  if (!env.NEXT_PUBLIC_CONVEX_URL || !env.MESSAGING_SERVER_SECRET) {
    throw new Error("Messaging is not configured.");
  }
  const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  return client.mutation(api.trusted.startConversation, {
    ...args,
    secret: env.MESSAGING_SERVER_SECRET,
  });
}
