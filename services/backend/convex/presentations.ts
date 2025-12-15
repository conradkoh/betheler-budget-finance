import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import { mutation, query } from './_generated/server';

// Get the current state of a presentation
export const getPresentationState = query({
  args: {
    key: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Look up the presentation state by key
    const state = await ctx.db
      .query('presentationState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (!state) {
      // If no state exists for this key, return default values
      return {
        key: args.key,
        currentSlide: 0,
        lastUpdated: 0,
        exists: false,
      };
    }

    return {
      ...state,
      exists: true,
    };
  },
});

// Set the current slide for a presentation
export const setCurrentSlide = mutation({
  args: {
    key: v.string(),
    slide: v.number(),
    timestamp: v.optional(v.number()),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    const timestamp = args.timestamp || Date.now();

    // Look up the presentation state by key
    const state = await ctx.db
      .query('presentationState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (!state) {
      // If no state exists for this key, create a new one
      return await ctx.db.insert('presentationState', {
        key: args.key,
        currentSlide: args.slide,
        lastUpdated: timestamp,
      });
    }

    // Only update if the incoming timestamp is newer than the existing one
    if (timestamp > state.lastUpdated) {
      // Update the existing state
      return await ctx.db.patch('presentationState', state._id, {
        currentSlide: args.slide,
        lastUpdated: timestamp,
      });
    }

    // Return the current state if we didn't update
    return state._id;
  },
});

// Start presenting - set the current user as the presenter
export const startPresenting = mutation({
  args: {
    key: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Look up the presentation state by key
    const state = await ctx.db
      .query('presentationState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (!state) {
      // If no state exists for this key, create a new one with the presenter info
      return await ctx.db.insert('presentationState', {
        key: args.key,
        currentSlide: 0,
        lastUpdated: Date.now(),
        activePresentation: {
          presenterId: args.sessionId,
        },
      });
    }

    // Update the existing state with the new presenter
    return await ctx.db.patch('presentationState', state._id, {
      activePresentation: {
        presenterId: args.sessionId,
      },
    });
  },
});

// Stop presenting - remove the presenter info if the requester is the presenter
export const stopPresenting = mutation({
  args: {
    key: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Look up the presentation state by key
    const state = await ctx.db
      .query('presentationState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (!state || !state.activePresentation) {
      // No presentation is active, nothing to do
      return null;
    }

    // Verify the requester is the presenter
    if (state.activePresentation.presenterId !== args.sessionId) {
      throw new Error('Only the presenter can stop the presentation');
    }

    // Remove the activePresentation field
    return await ctx.db.patch('presentationState', state._id, {
      activePresentation: undefined,
    });
  },
});
