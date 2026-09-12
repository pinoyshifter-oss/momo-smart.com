import { v, type Infer } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/** Mirrors `UserRole` in the school (Neon) database. */
export const roleValidator = v.union(
  v.literal("STUDENT"),
  v.literal("TEACHER"),
  v.literal("ADMIN"),
);

/**
 * A person as they appear in a conversation: their Neon `User.id` plus a
 * display snapshot taken when the conversation was opened, so a thread
 * renders without a round trip to Postgres.
 */
export const memberValidator = v.object({
  userId: v.string(),
  name: v.string(),
  title: v.optional(v.string()),
  role: roleValidator,
  /** e.g. "Teacher • Science Department" or "Student • Gr. 11". */
  subtitle: v.optional(v.string()),
});

export type Member = Infer<typeof memberValidator>;

export const MAX_BODY_LENGTH = 20_000;

/** Order-independent key for a set of people, so a 1:1 thread is reused. */
export function memberKeyOf(userIds: string[]): string {
  return [...new Set(userIds)].sort().join(",");
}

export function cleanBody(body: string): string {
  const text = body.trim();
  if (!text) throw new Error("Write a message first.");
  if (text.length > MAX_BODY_LENGTH) {
    throw new Error(
      `Messages are limited to ${MAX_BODY_LENGTH.toLocaleString()} characters.`,
    );
  }
  return text;
}

export async function createConversation(
  ctx: MutationCtx,
  members: Member[],
  subject: string | undefined,
  at: number,
): Promise<Id<"conversations">> {
  const unique = [...new Map(members.map((m) => [m.userId, m])).values()];
  const conversationId = await ctx.db.insert("conversations", {
    subject,
    memberKey: memberKeyOf(unique.map((m) => m.userId)),
    lastMessageAt: at,
  });
  for (const member of unique) {
    await ctx.db.insert("participants", {
      ...member,
      conversationId,
      lastReadAt: 0,
      lastMessageAt: at,
    });
  }
  return conversationId;
}

/**
 * Appends a message and moves the thread to the top of every member's inbox.
 * The sender has, by definition, read up to their own message.
 */
export async function postMessage(
  ctx: MutationCtx,
  conversationId: Id<"conversations">,
  senderId: string,
  body: string,
  sentAt: number,
) {
  await ctx.db.insert("messages", { conversationId, senderId, body, sentAt });
  await ctx.db.patch(conversationId, {
    lastMessageAt: sentAt,
    lastMessagePreview: body.slice(0, 160),
    lastSenderId: senderId,
  });

  const members = await ctx.db
    .query("participants")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
    .collect();
  for (const member of members) {
    await ctx.db.patch(
      member._id,
      member.userId === senderId
        ? {
            lastMessageAt: sentAt,
            lastReadAt: Math.max(member.lastReadAt, sentAt),
          }
        : { lastMessageAt: sentAt },
    );
  }
}
