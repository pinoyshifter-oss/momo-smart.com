/**
 * One-time setup for Convex-backed messaging: `npm run messaging:setup`.
 *
 * Generates the RS256 key pair the app uses to mint Convex tokens for
 * signed-in users, plus a shared secret for server-only mutations. The app's
 * half goes into .env.local; the deployment's half is set with
 * `convex env set`. Run it once `npx convex dev` has created a deployment.
 * Re-running rotates the keys (open tabs simply fetch a fresh token).
 *
 * Production: `CONVEX_DEPLOY_KEY='prod:…' npm run messaging:setup -- --prod`
 * generates a separate key pair, sets it on the deployment that key belongs
 * to, and writes the app's half to .env.production.local (gitignored) for
 * importing into Vercel. Secrets are never printed.
 */
import { execFileSync } from "node:child_process";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Must match KEY_ID in src/server/messaging/token.ts.
const KEY_ID = "momo-messaging";
const production = process.argv.includes("--prod");
const ENV_FILE = production ? ".env.production.local" : ".env.local";
const deployKey = process.env.CONVEX_DEPLOY_KEY;
const issuer =
  process.env.MESSAGING_JWT_ISSUER ?? "https://momosmart.edu/messaging";

// Refuse before generating anything, so a missing or partial key can't touch
// dev. A production deploy key looks like `prod:<deployment-name>|<token>`.
if (production && !/^prod:[^|\s]+\|\S+$/.test(deployKey ?? "")) {
  console.error(
    "--prod needs the full Production deploy key from the Convex dashboard\n" +
      "(Production deployment → Settings → Generate Production Deploy Key).\n" +
      "It looks like prod:<deployment-name>|<token> — copy all of it, then run:\n" +
      "  CONVEX_DEPLOY_KEY='<your key>' npm run messaging:setup -- --prod",
  );
  process.exit(1);
}

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
const jwk = {
  ...publicKey.export({ format: "jwk" }),
  kid: KEY_ID,
  alg: "RS256",
  use: "sig",
};
const jwks = `data:text/plain;charset=utf-8;base64,${Buffer.from(
  JSON.stringify({ keys: [jwk] }),
).toString("base64")}`;
const secret = randomBytes(32).toString("hex");

const appVars = {
  // Included so the file can be imported into Vercel in one go.
  ...(production ? { CONVEX_DEPLOY_KEY: deployKey } : {}),
  MESSAGING_JWT_PRIVATE_KEY: Buffer.from(privatePem).toString("base64"),
  MESSAGING_JWT_ISSUER: issuer,
  MESSAGING_SERVER_SECRET: secret,
};

// The deployment's half goes first: if it fails, no app keys are written
// that the deployment would reject.
const deploymentVars = {
  MESSAGING_JWKS: jwks,
  MESSAGING_JWT_ISSUER: issuer,
  MESSAGING_SERVER_SECRET: secret,
};
for (const [name, value] of Object.entries(deploymentVars)) {
  // The CLI reports which deployment it set the variable on (never the value).
  try {
    execFileSync("npx", ["convex", "env", "set", name, value], {
      stdio: ["ignore", "ignore", "inherit"],
    });
  } catch {
    console.error(
      `\nCouldn't set ${name} on the Convex deployment (see the message above). Nothing was written to ${ENV_FILE}.`,
    );
    process.exit(1);
  }
}

let text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
for (const [name, value] of Object.entries(appVars)) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  if (pattern.test(text)) {
    text = text.replace(pattern, () => line);
  } else {
    text += `${text === "" || text.endsWith("\n") ? "" : "\n"}${line}\n`;
  }
}
writeFileSync(ENV_FILE, text);
console.log(`Wrote the app's messaging keys to ${ENV_FILE}.`);

console.log(
  production
    ? "Add the variables in .env.production.local, plus NEXT_PUBLIC_CONVEX_URL (your production deployment URL), to Vercel → Settings → Environment Variables → Production."
    : "Messaging is configured. Restart `npm run dev` to pick it up.",
);
