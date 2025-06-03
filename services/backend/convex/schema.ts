import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// DEPRECATION NOTICE: The fields `expiresAt` and `expiresAtLabel` in the sessions table are deprecated and no longer used for session expiry. They are only kept for migration compatibility and will be removed in a future migration.

export default defineSchema({
  appInfo: defineTable({
    latestVersion: v.string(),
  }),
  presentationState: defineTable({
    key: v.string(), // The presentation key that identifies this presentation
    currentSlide: v.number(), // The current slide number
    lastUpdated: v.number(), // Timestamp of last update
    activePresentation: v.optional(
      v.object({
        presenterId: v.string(), // Session ID of the current presenter
      })
    ), // Optional object containing presenter information
  }).index('by_key', ['key']),

  // Discussion-related tables
  discussionState: defineTable({
    key: v.string(), // Unique identifier for the discussion
    title: v.string(), // Title of the discussion
    isActive: v.boolean(), // Whether the discussion is active or concluded
    createdAt: v.number(), // When the discussion was created
    conclusions: v.optional(
      v.array(
        v.object({
          text: v.string(), // The conclusion text
          tags: v.array(v.string()), // Optional tags for categorizing the conclusion (e.g., "task", "decision", "action", etc.)
        })
      )
    ), // Conclusions for this discussion
    concludedAt: v.optional(v.number()), // When the discussion was concluded
    concludedBy: v.optional(v.string()), // Session ID of who concluded the discussion
  }).index('by_key', ['key']),

  discussionMessages: defineTable({
    discussionKey: v.string(), // The discussion this message belongs to
    name: v.string(), // Name of the person who wrote the message
    message: v.string(), // The content of the message
    timestamp: v.number(), // When the message was sent
    sessionId: v.optional(v.string()), // Session ID of the sender (optional)
  }).index('by_discussion', ['discussionKey']),

  // Attendance-related tables
  attendanceRecords: defineTable({
    attendanceKey: v.string(), // The attendance session key (hardcoded)
    timestamp: v.number(), // When the attendance was recorded
    userId: v.optional(v.id('users')), // Optional user ID (for authenticated users)
    name: v.optional(v.string()), // Name (required for anonymous users)
    status: v.optional(v.union(v.literal('attending'), v.literal('not_attending'))), // Attendance status
    reason: v.optional(v.string()), // Optional reason for not attending
    remarks: v.optional(v.string()), // Optional remarks for attending
  })
    .index('by_attendance', ['attendanceKey'])
    .index('by_name_attendance', ['attendanceKey', 'name'])
    .index('by_user_attendance', ['attendanceKey', 'userId']),

  // auth
  users: defineTable(
    v.union(
      v.object({
        type: v.literal('full'),
        name: v.string(),
        username: v.string(),
        email: v.string(),
        recoveryCode: v.optional(v.string()),
      }),
      v.object({
        type: v.literal('anonymous'),
        name: v.string(), //system generated name
        recoveryCode: v.optional(v.string()),
      })
    )
  )
    .index('by_username', ['username'])
    .index('by_email', ['email'])
    .index('by_name', ['name']),

  //sessions
  sessions: defineTable({
    sessionId: v.string(), //this is provided by the client
    userId: v.id('users'), // null means session exists but not authenticated
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // DEPRECATED: No longer used for session expiry. Kept for migration compatibility.
    expiresAtLabel: v.optional(v.string()), // DEPRECATED: No longer used for session expiry. Kept for migration compatibility.
  }).index('by_sessionId', ['sessionId']),

  //transactions
  transactions: defineTable({
    userId: v.id('users'),
    amount: v.number(),
    category: v.string(),
    datetime: v.string(),
    description: v.string(),
    transactionType: v.union(v.literal('expense'), v.literal('income'), v.literal('savings')),
  }).index('by_userId_datetime', ['userId', 'datetime']),

  //budgets
  budgets: defineTable({
    userId: v.id('users'),
    category: v.string(),
    amount: v.number(),
    month: v.number(), // 0-based (January is 0)
    year: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId_yearMonth', ['userId', 'year', 'month'])
    .index('by_userId_category', ['userId', 'category']),

  //shareLinks
  shareLinks: defineTable({
    userId: v.id('users'),
    shareId: v.string(), // Unique identifier for the share link
    year: v.number(),
    month: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
    expiresAtLabel: v.string(),
  })
    .index('by_shareId', ['shareId'])
    .index('by_userId', ['userId']),
  //login codes for cross-device authentication
  loginCodes: defineTable({
    code: v.string(), // The 8-letter login code
    userId: v.id('users'), // The user who generated this code
    createdAt: v.number(), // When the code was created
    expiresAt: v.number(), // When the code expires (1 minute after creation)
  }).index('by_code', ['code']),
});
