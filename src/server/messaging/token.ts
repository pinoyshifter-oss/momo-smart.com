import "server-only";

import { importPKCS8, SignJWT } from "jose";

import { env } from "~/env";

/** Must match `applicationID` in convex/auth.config.ts. */
const MESSAGING_AUDIENCE = "momo-smart-messaging";
/** Must match the `kid` that scripts/setup-messaging.mjs publishes. */
const KEY_ID = "momo-messaging";
const TOKEN_TTL_SECONDS = 60 * 60;

let signingKey: ReturnType<typeof importPKCS8> | null = null;

/**
 * A short-lived token Convex accepts as proof of who the NextAuth user is.
 * Convex only ever sees the Neon user id (`sub`); everything else about the
 * person stays in the school database.
 */
export async function signMessagingToken(user: {
  id: string;
  role: string;
}): Promise<{ token: string; expiresAt: number }> {
  if (!env.MESSAGING_JWT_PRIVATE_KEY || !env.MESSAGING_JWT_ISSUER) {
    throw new Error("Messaging is not configured.");
  }
  signingKey ??= importPKCS8(
    Buffer.from(env.MESSAGING_JWT_PRIVATE_KEY, "base64").toString("utf8"),
    "RS256",
  );

  const expiresAt = Date.now() + TOKEN_TTL_SECONDS * 1000;
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "RS256", kid: KEY_ID, typ: "JWT" })
    .setIssuer(env.MESSAGING_JWT_ISSUER)
    .setAudience(MESSAGING_AUDIENCE)
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(await signingKey);

  return { token, expiresAt };
}
