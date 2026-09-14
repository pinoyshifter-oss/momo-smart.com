import { TRPCError } from "@trpc/server";

import { env } from "~/env";
import { isDemoEmail } from "~/server/demo/accounts";

/**
 * The public demo's shared logins have to keep working for every visitor, so
 * their email and password can't be changed while DEMO_MODE is on.
 */
export function assertCredentialsEditable(email: string | null | undefined) {
  if (env.DEMO_MODE && isDemoEmail(email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "The demo account's sign-in details can't be changed.",
    });
  }
}
