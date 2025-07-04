import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Database schema definition for the application.
 * Defines all tables, their fields, and indexes for optimal querying.
 *
 * DEPRECATION NOTICE: The fields `expiresAt` and `expiresAtLabel` in the sessions table
 * are deprecated and no longer used for session expiry. They are only kept for migration
 * compatibility and will be removed in a future migration.
 */
export default defineSchema({
  /**
   * Application metadata and version tracking.
   */
  appInfo: defineTable({
    latestVersion: v.string(),
  }),

  /**
   * Presentation state management for real-time presentation controls.
   * Tracks current slide and active presenter information.
   */
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

  /**
   * Discussion state management for collaborative discussions.
   * Tracks discussion lifecycle, conclusions, and metadata.
   */
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

  /**
   * Individual messages within discussions.
   * Stores message content, sender information, and timestamps.
   */
  discussionMessages: defineTable({
    discussionKey: v.string(), // The discussion this message belongs to
    name: v.string(), // Name of the person who wrote the message
    message: v.string(), // The content of the message
    timestamp: v.number(), // When the message was sent
    sessionId: v.optional(v.string()), // Session ID of the sender (optional)
  }).index('by_discussion', ['discussionKey']),

  /**
   * Checklist state management for collaborative task tracking.
   * Tracks checklist lifecycle and metadata.
   */
  checklistState: defineTable({
    key: v.string(), // Unique identifier for the checklist
    title: v.string(), // Title of the checklist
    isActive: v.boolean(), // Whether the checklist is active or concluded
    createdAt: v.number(), // When the checklist was created
    concludedAt: v.optional(v.number()), // When the checklist was concluded
    concludedBy: v.optional(v.string()), // Session ID of who concluded the checklist
  }).index('by_key', ['key']),

  /**
   * Individual items within checklists.
   * Stores item content, completion status, ordering, and audit trail.
   */
  checklistItems: defineTable({
    checklistKey: v.string(), // The checklist this item belongs to
    text: v.string(), // The item text/description
    isCompleted: v.boolean(), // Whether the item is completed
    order: v.number(), // Display order
    createdAt: v.number(), // When the item was created
    completedAt: v.optional(v.number()), // When the item was completed
    createdBy: v.optional(v.string()), // Session ID of who created the item
    completedBy: v.optional(v.string()), // Session ID of who completed the item
  })
    .index('by_checklist', ['checklistKey'])
    .index('by_checklist_order', ['checklistKey', 'order']),

  /**
   * Attendance tracking for events and meetings.
   * Records attendance status, reasons, and participant information.
   */
  attendanceRecords: defineTable({
    attendanceKey: v.string(), // The attendance session key (hardcoded)
    timestamp: v.number(), // When the attendance was recorded
    userId: v.optional(v.id('users')), // Optional user ID (for authenticated users)
    name: v.optional(v.string()), // Name (required for anonymous users)
    status: v.optional(v.union(v.literal('attending'), v.literal('not_attending'))), // Attendance status
    reason: v.optional(v.string()), // Optional reason for not attending
    remarks: v.optional(v.string()), // Optional remarks for attending
    isManuallyJoined: v.optional(v.boolean()), // Whether this person manually joined the list (vs being in expected list)
  })
    .index('by_attendance', ['attendanceKey'])
    .index('by_name_attendance', ['attendanceKey', 'name'])
    .index('by_user_attendance', ['attendanceKey', 'userId']),

  /**
   * User accounts supporting authenticated, anonymous, and Google OAuth users.
   * Stores user credentials, names, and recovery information.
   */
  users: defineTable(
    v.union(
      v.object({
        type: v.literal('full'),
        name: v.string(),
        username: v.optional(v.string()),
        email: v.string(),
        recoveryCode: v.optional(v.string()),
        accessLevel: v.optional(v.union(v.literal('user'), v.literal('system_admin'))),
        google: v.optional(
          v.object({
            id: v.string(),
            email: v.string(),
            verified_email: v.optional(v.boolean()),
            name: v.string(),
            given_name: v.optional(v.string()),
            family_name: v.optional(v.string()),
            picture: v.optional(v.string()),
            locale: v.optional(v.string()),
            hd: v.optional(v.string()),
          })
        ),
      }),
      v.object({
        type: v.literal('anonymous'),
        name: v.string(), //system generated name
        recoveryCode: v.optional(v.string()),
        accessLevel: v.optional(v.union(v.literal('user'), v.literal('system_admin'))),
      })
    )
  )
    .index('by_username', ['username'])
    .index('by_email', ['email'])
    .index('by_name', ['name'])
    .index('by_googleId', ['google.id']),

  /**
   * User sessions for authentication and state management.
   * Links session IDs to user accounts with creation timestamps.
   */
  sessions: defineTable({
    sessionId: v.string(), //this is provided by the client
    userId: v.id('users'), // null means session exists but not authenticated
    createdAt: v.number(),
    authMethod: v.optional(
      v.union(
        v.literal('google'), // Authenticated via Google OAuth
        v.literal('login_code'), // Authenticated via login code
        v.literal('recovery_code'), // Authenticated via recovery code
        v.literal('anonymous'), // Anonymous session
        v.literal('username_password') // Traditional username/password (for future use)
      )
    ), // How the user authenticated for this session
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
  })
    .index('by_userId_datetime', ['userId', 'datetime'])
    .index('by_userId', ['userId']),

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
  /**
   * Temporary login codes for cross-device authentication.
   * Stores time-limited codes for secure device-to-device login.
   */
  loginCodes: defineTable({
    code: v.string(), // The 8-letter login code
    userId: v.id('users'), // The user who generated this code
    createdAt: v.number(), // When the code was created
    expiresAt: v.number(), // When the code expires (1 minute after creation)
  }).index('by_code', ['code']),

  /**
   * Third-party authentication configuration for dynamic auth provider setup.
   * Supports multiple auth providers (Google, GitHub, etc.) with unified structure.
   */
  thirdPartyAuthConfig: defineTable({
    type: v.union(v.literal('google')), // Auth provider type (extensible for future providers)
    enabled: v.boolean(), // Whether this auth provider is enabled
    projectId: v.optional(v.string()), // Google Cloud Project ID (optional, for convenience links)
    clientId: v.optional(v.string()), // OAuth client ID
    clientSecret: v.optional(v.string()), // OAuth client secret (encrypted storage recommended)
    redirectUris: v.array(v.string()), // Allowed redirect URIs for OAuth
    configuredBy: v.id('users'), // User who configured this (must be system_admin)
    configuredAt: v.number(), // When this configuration was created/updated
  }).index('by_type', ['type']),
});
