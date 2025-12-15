import { v } from 'convex/values';

import { featureFlags } from '../config/featureFlags';
import { internalMutation } from './_generated/server';
import { generateLoginCode } from '../modules/auth/codeUtils';

/**
 * Find users by exact name match and retrieve their session information
 */
export const findUserByName = internalMutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Find users with the exact name match
    const users = await ctx.db
      .query('users')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .collect();

    // Fetch session info for each user
    const results = await Promise.all(
      users.map(async (user) => {
        // Get all sessions for this user
        const sessions = await ctx.db
          .query('sessions')
          .filter((q) => q.eq(q.field('userId'), user._id))
          .collect();

        return {
          userId: user._id,
          name: user.name,
          sessions: sessions.map((session) => ({
            sessionId: session.sessionId,
            createdAt: session.createdAt,
          })),
        };
      })
    );

    return results;
  },
});

/**
 * Generate a temporary login code for a user that lasts for 10 minutes
 */
export const generateTempLoginCode = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      throw new Error('Login functionality is currently disabled');
    }

    // Verify the user exists
    const user = await ctx.db.get('users', args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check for existing login codes and delete them to avoid confusion
    const existingLoginCodes = await ctx.db
      .query('loginCodes')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();

    // Delete any existing login codes for this user
    for (const code of existingLoginCodes) {
      await ctx.db.delete('loginCodes', code._id);
    }

    // Generate a new login code
    const codeString = generateLoginCode();
    const now = Date.now();
    // const expiresAt = getTempCodeExpirationTime(); // 10 minutes from now
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes from now
    // Store the login code
    await ctx.db.insert('loginCodes', {
      code: codeString,
      userId: args.userId,
      createdAt: now,
      expiresAt,
    });

    return {
      code: codeString,
      expiresAt,
    };
  },
});
