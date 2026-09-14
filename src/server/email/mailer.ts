import "server-only";

import { Resend } from "resend";

import { env } from "~/env";

export type EmailResult = { ok: true } | { ok: false; reason: string };

let client: Resend | null = null;

/**
 * Sends one transactional email through Resend. Never throws: callers decide
 * what to do when delivery fails, e.g. show the details on screen instead.
 */
export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return {
      ok: false,
      reason: "email is not set up (RESEND_API_KEY and EMAIL_FROM)",
    };
  }

  client ??= new Resend(env.RESEND_API_KEY);

  try {
    const { error } = await client.emails.send({
      from: env.EMAIL_FROM,
      ...message,
    });
    if (error) {
      console.error("resend rejected email", error);
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error("resend request failed", error);
    return { ok: false, reason: "the email service could not be reached" };
  }
}
