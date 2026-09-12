import type { AuthConfig } from "convex/server";

/**
 * Convex trusts short-lived tokens the Next.js app mints for a signed-in
 * NextAuth user (`src/app/api/messaging/token/route.ts`). The public key is
 * inlined as a JWKS data URI, so the deployment never has to reach the app.
 * `npm run messaging:setup` generates the key pair and sets these variables.
 */
export default {
  providers: [
    {
      type: "customJwt",
      // Must match MESSAGING_AUDIENCE in src/server/messaging/token.ts.
      applicationID: "momo-smart-messaging",
      issuer: process.env.MESSAGING_JWT_ISSUER!,
      jwks: process.env.MESSAGING_JWKS!,
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;
