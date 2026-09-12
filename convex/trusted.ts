import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";
import {
  cleanBody,
  createConversation,
  memberKeyOf,
  memberValidator,
  postMessage,
} from "./model";

/**
 * Server-to-server entry points. The Next.js app calls these after checking
 * the school database, passing a secret shared through the deployment's
 * environment — browsers never hold it, so they cannot invent members.
 */

function assertServer(secret: string) {
  const expected = process.env.MESSAGING_SERVER_SECRET;
  if (!expected || secret !== expected) {
    throw new ConvexError("Not authorised.");
  }
}

/** Opens a conversation (reusing an existing 1:1 thread) with a first message. */
export const startConversation = mutation({
  args: {
    secret: v.string(),
    senderId: v.string(),
    members: v.array(memberValidator),
    subject: v.optional(v.string()),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    assertServer(args.secret);
    if (!args.members.some((m) => m.userId === args.senderId)) {
      throw new ConvexError("The sender must be a member.");
    }
    const body = cleanBody(args.body);
    const now = Date.now();

    const key = memberKeyOf(args.members.map((m) => m.userId));
    const existing =
      key.split(",").length === 2
        ? await ctx.db
            .query("conversations")
            .withIndex("by_member_key", (q) => q.eq("memberKey", key))
            .first()
        : null;

    const conversationId =
      existing?._id ??
      (await createConversation(ctx, args.members, args.subject, now));
    await postMessage(ctx, conversationId, args.senderId, body, now);
    return conversationId;
  },
});

/** Replaces every conversation with the demo school's threads. */
export const replaceAllForDemo = mutation({
  args: {
    secret: v.string(),
    threads: v.array(
      v.object({
        subject: v.optional(v.string()),
        members: v.array(memberValidator),
        messages: v.array(
          v.object({
            senderId: v.string(),
            body: v.string(),
            sentAt: v.number(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, { secret, threads }) => {
    assertServer(secret);

    for (const doc of await ctx.db.query("messages").collect()) {
      await ctx.db.delete(doc._id);
    }
    for (const doc of await ctx.db.query("participants").collect()) {
      await ctx.db.delete(doc._id);
    }
    for (const doc of await ctx.db.query("conversations").collect()) {
      await ctx.db.delete(doc._id);
    }

    for (const thread of threads) {
      const ordered = [...thread.messages].sort((a, b) => a.sentAt - b.sentAt);
      const conversationId = await createConversation(
        ctx,
        thread.members,
        thread.subject,
        ordered[0]?.sentAt ?? Date.now(),
      );
      // Each member ends up having read up to their own last message.
      for (const message of ordered) {
        await postMessage(
          ctx,
          conversationId,
          message.senderId,
          message.body,
          message.sentAt,
        );
      }
    }
    return { threads: threads.length };
  },
});
