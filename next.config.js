/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  /**
   * The Prisma client is generated outside node_modules, so file tracing does
   * not pick up its native query engine. Without this, serverless functions on
   * Vercel fail with "could not locate the Query Engine".
   */
  outputFileTracingIncludes: {
    "/**/*": [
      "./generated/prisma/*.node",
      "./generated/prisma/schema.prisma",
    ],
  },
};

export default config;
