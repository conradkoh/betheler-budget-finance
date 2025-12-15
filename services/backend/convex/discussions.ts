import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import { mutation, query } from './_generated/server';

// Get the current state of a discussion
export const getDiscussionState = query({
  args: {
    key: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Look up the discussion state by key
    const state = await ctx.db
      .query('discussionState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (!state) {
      // If no state exists for this key, return default values
      return {
        key: args.key,
        exists: false,
        isActive: false,
      };
    }

    return {
      ...state,
      exists: true,
    };
  },
});

// Get messages for a discussion
export const getDiscussionMessages = query({
  args: {
    key: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Look up messages for this discussion
    const messages = await ctx.db
      .query('discussionMessages')
      .withIndex('by_discussion', (q) => q.eq('discussionKey', args.key))
      .order('desc')
      .collect();

    // Return messages in reverse chronological order (newest first)
    return messages;
  },
});

// Get conclusion for a discussion
export const getDiscussionConclusion = query({
  args: {
    key: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Look up the discussion state by key
    const discussion = await ctx.db
      .query('discussionState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (!discussion || !discussion.conclusions) {
      return null;
    }

    // Return the conclusion data
    return {
      _id: discussion._id,
      discussionKey: args.key,
      conclusions: discussion.conclusions,
      createdAt: discussion.concludedAt || 0,
      createdBy: discussion.concludedBy,
    };
  },
});

// Create a new discussion
export const createDiscussion = mutation({
  args: {
    key: v.string(),
    title: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if a discussion with this key already exists
    const existingDiscussion = await ctx.db
      .query('discussionState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (existingDiscussion) {
      // If it exists, return the existing discussion ID
      return existingDiscussion._id;
    }

    // Create a new discussion
    return await ctx.db.insert('discussionState', {
      key: args.key,
      title: args.title,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Add a message to a discussion
export const addDiscussionMessage = mutation({
  args: {
    discussionKey: v.string(),
    name: v.string(),
    message: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the discussion exists and is active
    const discussion = await ctx.db
      .query('discussionState')
      .withIndex('by_key', (q) => q.eq('key', args.discussionKey))
      .first();

    if (!discussion) {
      throw new Error('Discussion not found');
    }

    if (!discussion.isActive) {
      throw new Error('Discussion is no longer active');
    }

    // Add the message
    return await ctx.db.insert('discussionMessages', {
      discussionKey: args.discussionKey,
      name: args.name,
      message: args.message,
      timestamp: Date.now(),
      sessionId: args.sessionId,
    });
  },
});

// Conclude a discussion
export const concludeDiscussion = mutation({
  args: {
    discussionKey: v.string(),
    conclusions: v.array(
      v.object({
        text: v.string(),
        tags: v.array(v.string()),
      })
    ),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the discussion exists
    const discussion = await ctx.db
      .query('discussionState')
      .withIndex('by_key', (q) => q.eq('key', args.discussionKey))
      .first();

    if (!discussion) {
      throw new Error('Discussion not found');
    }

    // Mark the discussion as inactive and add conclusions
    return await ctx.db.patch('discussionState', discussion._id, {
      isActive: false,
      conclusions: args.conclusions,
      concludedAt: Date.now(),
      concludedBy: args.sessionId,
    });
  },
});

// Get all discussions for a presentation
export const getDiscussionsForPresentation = query({
  args: {
    presentationKey: v.string(),
    ...SessionIdArg,
  },
  handler: async (_ctx, _args) => {
    // This query is now deprecated
    return [];
  },
});

// Reopen a concluded discussion
export const reopenDiscussion = mutation({
  args: {
    discussionKey: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the discussion exists
    const discussion = await ctx.db
      .query('discussionState')
      .withIndex('by_key', (q) => q.eq('key', args.discussionKey))
      .first();

    if (!discussion) {
      throw new Error('Discussion not found');
    }

    // Already active
    if (discussion.isActive) {
      return discussion._id;
    }

    // Mark the discussion as active, retain conclusions
    return await ctx.db.patch('discussionState', discussion._id, {
      isActive: true,
    });
  },
});

// Delete a message from a discussion
export const deleteDiscussionMessage = mutation({
  args: {
    messageId: v.id('discussionMessages'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get('discussionMessages', args.messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    // Get the discussion to check if it's active
    const discussion = await ctx.db
      .query('discussionState')
      .withIndex('by_key', (q) => q.eq('key', message.discussionKey))
      .first();

    if (!discussion) {
      throw new Error('Discussion not found');
    }

    if (!discussion.isActive) {
      throw new Error('Cannot delete messages from a concluded discussion');
    }

    // Delete the message
    await ctx.db.delete('discussionMessages', args.messageId);

    return true;
  },
});

// Update conclusions for a discussion
export const updateConclusions = mutation({
  args: {
    discussionKey: v.string(),
    conclusions: v.array(
      v.object({
        text: v.string(),
        tags: v.array(v.string()),
      })
    ),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the discussion exists
    const discussion = await ctx.db
      .query('discussionState')
      .withIndex('by_key', (q) => q.eq('key', args.discussionKey))
      .first();

    if (!discussion) {
      throw new Error('Discussion not found');
    }

    // Update the conclusions (works whether discussion is active or concluded)
    return await ctx.db.patch('discussionState', discussion._id, {
      conclusions: args.conclusions,
    });
  },
});
