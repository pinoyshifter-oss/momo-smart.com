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
  const missing = [
    !env.RESEND_API_KEY && "RESEND_API_KEY",
    !env.EMAIL_FROM && "EMAIL_FROM",
  ].filter(Boolean);
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.error(`email not sent: ${missing.join(" and ")} not set`);
    return {
      ok: false,
      reason: "email is not set up (RESEND_API_KEY and EMAIL_FROM)",
    };
  }

  client ??= new Resend(env.RESEND_API_KEY);
  // Which key and sender were used, without logging the secret itself — so a
  // deployment on the wrong Resend account shows up in its logs.
  const via = {
    from: env.EMAIL_FROM,
    key: `…${env.RESEND_API_KEY.slice(-4)}`,
    toDomain: message.to.slice(message.to.lastIndexOf("@") + 1),
  };

  try {
    const { data, error } = await client.emails.send({
      from: env.EMAIL_FROM,
      ...message,
    });
    if (error) {
      console.error("resend rejected email", { ...via, error });
      return { ok: false, reason: error.message };
    }
    console.info("email sent", { id: data?.id, ...via });
    return { ok: true };
  } catch (error) {
    console.error("resend request failed", error);
    return { ok: false, reason: "the email service could not be reached" };
  }
}
