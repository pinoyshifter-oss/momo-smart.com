import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { cleanBody, postMessage } from "./model";

/**
 * What a signed-in browser may do: read its own inbox and threads, reply and
 * mark things read. Opening a conversation goes through `trusted.ts`, because
 * only the school database knows who shares a class with whom.
 */

const INBOX_LIMIT = 50;
const THREAD_LIMIT = 200;
/** Unread badges stop counting here. */
const UNREAD_CAP = 99;

/** The caller's Neon user id, from the token the app minted. */
async function viewerId(ctx: QueryCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Sign in to use messages.");
  return identity.subject;
}

async function membershipOf(
  ctx: QueryCtx,
  conversationId: Id<"conversations">,
  userId: string,
) {
  const participant = await ctx.db
    .query("participants")
    .withIndex("by_conversation_and_user", (q) =>
      q.eq("conversationId", conversationId).eq("userId", userId),
    )
    .unique();
  if (!participant) throw new ConvexError("You're not in this conversation.");
  return participant;
}

function membersOf(ctx: QueryCtx, conversationId: Id<"conversations">) {
  return ctx.db
    .query("participants")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
    .collect();
}

const person = (p: Doc<"participants">) => ({
  userId: p.userId,
  name: p.name,
  title: p.title ?? null,
  role: p.role,
  subtitle: p.subtitle ?? null,
  lastReadAt: p.lastReadAt,
});

/** The caller's conversations, most recent activity first, with unread counts. */
export const inbox = query({
  args: {},
  handler: async (ctx) => {
    const me = await viewerId(ctx);
    const mine = await ctx.db
      .query("participants")
      .withIndex("by_user_and_last_message", (q) => q.eq("userId", me))
      .order("desc")
      .take(INBOX_LIMIT);

    const rows = await Promise.all(
      mine.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);
        if (!conversation) return null;

        const [members, unseen] = await Promise.all([
          membersOf(ctx, conversation._id),
          ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
              q
                .eq("conversationId", conversation._id)
                .gt("sentAt", membership.lastReadAt),
            )
            .take(UNREAD_CAP + 1),
        ]);

        return {
          id: conversation._id,
          subject: conversation.subject ?? null,
          lastMessageAt: conversation.lastMessageAt,
          lastMessagePreview: conversation.lastMessagePreview ?? null,
          lastSenderId: conversation.lastSenderId ?? null,
          others: members.filter((m) => m.userId !== me).map(person),
          unread: Math.min(
            UNREAD_CAP,
            unseen.filter((m) => m.senderId !== me).length,
          ),
        };
      }),
    );

    return rows.filter((row) => row !== null);
  },
});

/** One conversation's members and its latest messages, oldest first. */
export const thread = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await viewerId(ctx);
    await membershipOf(ctx, conversationId, me);

    const [members, latest] = await Promise.all([
      membersOf(ctx, conversationId),
      ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversationId),
        )
        .order("desc")
        .take(THREAD_LIMIT),
    ]);

    return {
      id: conversationId,
      members: members.map(person),
      messages: latest.reverse().map((message) => ({
        id: message._id,
        senderId: message.senderId,
        body: message.body,
        sentAt: message.sentAt,
      })),
    };
  },
});

export const send = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, { conversationId, body }) => {
    const me = await viewerId(ctx);
    await membershipOf(ctx, conversationId, me);

    let text: string;
    try {
      text = cleanBody(body);
    } catch (error) {
      throw new ConvexError((error as Error).message);
    }
    await postMessage(ctx, conversationId, me, text, Date.now());
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await viewerId(ctx);
    const membership = await membershipOf(ctx, conversationId, me);
    const conversation = await ctx.db.get(conversationId);
    if (conversation && membership.lastReadAt < conversation.lastMessageAt) {
      await ctx.db.patch(membership._id, {
        lastReadAt: conversation.lastMessageAt,
      });
    }
  },
});
