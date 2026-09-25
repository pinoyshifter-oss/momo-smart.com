import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DATABASE_URL: z.string().url(),
    /**
     * Public origin, e.g. "https://momosmart.com", for canonical URLs, the
     * sitemap and social previews. Falls back to Vercel's production domain.
     */
    SITE_URL: z.string().url().optional(),
    /** UploadThing API token. Optional so the app runs without it; submission uploads need it. */
    UPLOADTHING_TOKEN: z.string().optional(),
    /**
     * Resend API key and sender, e.g. "Smart Momo <no-reply@yourschool.edu>"
     * on a domain verified in Resend. Both are needed to email new students
     * their sign-in details; without them the teacher is shown the details to
     * pass on instead.
     */
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    /**
     * Testing aid: lets teachers enroll students with any email address
     * instead of one on the school's email domain. Keep "false" for real
     * schools.
     */
    ALLOW_ANY_STUDENT_EMAIL: z
      .string()
      // Dashboards and `echo … | vercel env add` can leave a trailing newline.
      .trim()
      .pipe(z.enum(["true", "false"]))
      .default("false")
      .transform((value) => value === "true"),
    /**
     * Turns on the public demo: one-click sign-in from /demo, the in-app demo
     * banner and the scheduled reset route. Only enable on a dedicated demo
     * database — a reset wipes every user.
     */
    DEMO_MODE: z
      .string()
      // Dashboards and `echo … | vercel env add` can leave a trailing newline.
      .trim()
      .pipe(z.enum(["true", "false"]))
      .default("false")
      .transform((value) => value === "true"),
    /** Bearer token the demo reset route requires. */
    CRON_SECRET: z.string().optional(),
    /**
     * Messaging runs on Convex, apart from DATABASE_URL. These three are
     * written by `npm run messaging:setup`; without them the Messages pages
     * show setup instructions instead of the inbox.
     */
    MESSAGING_JWT_PRIVATE_KEY: z.string().optional(),
    MESSAGING_JWT_ISSUER: z.string().url().optional(),
    MESSAGING_SERVER_SECRET: z.string().min(32).optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    /** The Convex deployment messaging talks to; `npx convex dev` sets it. */
    NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    SITE_URL: process.env.SITE_URL,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    ALLOW_ANY_STUDENT_EMAIL: process.env.ALLOW_ANY_STUDENT_EMAIL,
    DEMO_MODE: process.env.DEMO_MODE,
    CRON_SECRET: process.env.CRON_SECRET,
    MESSAGING_JWT_PRIVATE_KEY: process.env.MESSAGING_JWT_PRIVATE_KEY,
    MESSAGING_JWT_ISSUER: process.env.MESSAGING_JWT_ISSUER,
    MESSAGING_SERVER_SECRET: process.env.MESSAGING_SERVER_SECRET,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
