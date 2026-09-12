import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { roleValidator } from "./model";

/**
 * Messaging lives here, in Convex, apart from the Neon/Postgres school
 * database. People are referenced by their Neon `User.id`; who may message
 * whom is decided by the Next.js app against Postgres before a conversation
 * is created (see `trusted.ts`).
 */
export default defineSchema({
  conversations: defineTable({
    subject: v.optional(v.string()),
    /** Sorted member ids, so an existing 1:1 thread is reused. */
    memberKey: v.string(),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
    lastSenderId: v.optional(v.string()),
  }).index("by_member_key", ["memberKey"]),

  participants: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    name: v.string(),
    title: v.optional(v.string()),
    role: roleValidator,
    subtitle: v.optional(v.string()),
    /** Everything sent at or before this instant has been seen. */
    lastReadAt: v.number(),
    /** Copied from the conversation so an inbox is a single indexed read. */
    lastMessageAt: v.number(),
  })
    .index("by_user_and_last_message", ["userId", "lastMessageAt"])
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_and_user", ["conversationId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    body: v.string(),
    /** Set explicitly (not `_creationTime`) so seeded history keeps its times. */
    sentAt: v.number(),
  }).index("by_conversation", ["conversationId", "sentAt"]),
});
