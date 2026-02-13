import { ConvexError, v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import { featureFlags } from '../config/featureFlags';
import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { getAccessLevel, isSystemAdmin } from '../modules/auth/accessControl';
import { generateLoginCode, getCodeExpirationTime, isCodeExpired } from '../modules/auth/codeUtils';
import type { AuthState } from '../modules/auth/types/AuthState';

/**
 * Retrieves the current authentication state for a session.
 */
export const getState = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<AuthState> => {
    const exists = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!exists) {
      return {
        sessionId: args.sessionId,
        state: 'unauthenticated' as const,
        reason: 'session_not_found' as const,
      };
    }

    if (!exists.userId) {
      return {
        sessionId: args.sessionId,
        state: 'unauthenticated' as const, //this session was unlinked from the user
        reason: 'session_deauthorized' as const,
      };
    }

    const user = await ctx.db.get('users', exists.userId);

    if (!user) {
      return {
        sessionId: args.sessionId,
        state: 'unauthenticated' as const, //the linked user log longer exists
        reason: 'user_not_found' as const,
      };
    }

    return {
      sessionId: args.sessionId,
      state: 'authenticated' as const,
      user,
      accessLevel: getAccessLevel(user),
      isSystemAdmin: isSystemAdmin(user),
      authMethod: exists.authMethod,
    };
  },
});

/**
 * Creates an anonymous user and establishes a session for them.
 */
export const loginAnon = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Login functionality is currently disabled',
      });
    }

    // Check if the session exists
    const existingSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    // Create an anonymous user
    const anonName = _generateAnonUsername();
    const userId = await ctx.db.insert('users', {
      type: 'anonymous',
      name: anonName,
      accessLevel: 'user', // Default access level for new anonymous users
    });

    // Create a new session if it doesn't exist
    if (!existingSession) {
      const now = Date.now();
      await ctx.db.insert('sessions', {
        sessionId: args.sessionId,
        userId: userId as Id<'users'>,
        createdAt: now,
        authMethod: 'anonymous',
      });
    } else {
      // Update existing session with the new user and auth method
      await ctx.db.patch('sessions', existingSession._id, {
        userId: userId as Id<'users'>,
        authMethod: 'anonymous',
      });
    }

    return { success: true, userId };
  },
});

/**
 * Logs out a user by deleting their session.
 */
export const logout = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Find the session by sessionId
    const existingSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (existingSession) {
      await ctx.db.delete('sessions', existingSession._id);
    }

    return { success: true };
  },
});

/**
 * Updates the display name for an authenticated user.
 */
export const updateUserName = mutation({
  args: {
    newName: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Validate input
    if (args.newName.trim().length < 3) {
      return {
        success: false,
        reason: 'name_too_short',
        message: 'Name must be at least 3 characters long',
      };
    }

    if (args.newName.trim().length > 30) {
      return {
        success: false,
        reason: 'name_too_long',
        message: 'Name must be at most 30 characters long',
      };
    }

    // Find the session by sessionId
    const existingSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!existingSession || !existingSession.userId) {
      return {
        success: false,
        reason: 'not_authenticated',
        message: 'You must be logged in to update your profile',
      };
    }

    // Get the user
    const user = await ctx.db.get('users', existingSession.userId);
    if (!user) {
      return {
        success: false,
        reason: 'user_not_found',
        message: 'User not found',
      };
    }

    // Update the user's name
    await ctx.db.patch('users', existingSession.userId, {
      name: args.newName.trim(),
    });

    return {
      success: true,
      message: 'Name updated successfully',
    };
  },
});

/**
 * Retrieves the active login code for the current authenticated user.
 */
export const getActiveLoginCode = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      return {
        success: false,
        reason: 'feature_disabled',
        message: 'Login functionality is currently disabled',
      };
    }

    // Find the session by sessionId
    const existingSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!existingSession || !existingSession.userId) {
      return { success: false, reason: 'not_authenticated' };
    }

    const now = Date.now();

    // Find any active code for this user
    const activeCode = await ctx.db
      .query('loginCodes')
      .filter((q) =>
        q.and(q.eq(q.field('userId'), existingSession.userId), q.gt(q.field('expiresAt'), now))
      )
      .first();

    if (!activeCode) {
      return { success: false, reason: 'no_active_code' };
    }

    return {
      success: true,
      code: activeCode.code,
      expiresAt: activeCode.expiresAt,
    };
  },
});

/**
 * Generates a temporary login code for cross-device authentication.
 */
export const createLoginCode = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Login functionality is currently disabled',
      });
    }

    // Find the session by sessionId
    const existingSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!existingSession || !existingSession.userId) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to generate a login code',
      });
    }

    // Get the user
    const user = await ctx.db.get('users', existingSession.userId);
    if (!user) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const now = Date.now();

    // Delete any existing active codes for this user
    const existingCodes = await ctx.db
      .query('loginCodes')
      .filter((q) => q.eq(q.field('userId'), existingSession.userId))
      .collect();

    // Delete all existing codes for this user
    for (const code of existingCodes) {
      await ctx.db.delete('loginCodes', code._id);
    }

    // Generate a new login code
    const codeString = generateLoginCode();
    const expiresAt = getCodeExpirationTime();

    // Store the code in the database
    await ctx.db.insert('loginCodes', {
      code: codeString,
      userId: existingSession.userId,
      createdAt: now,
      expiresAt,
    });

    return {
      success: true,
      code: codeString,
      expiresAt,
    };
  },
});

/**
 * Verifies and consumes a login code to authenticate a session.
 */
export const verifyLoginCode = mutation({
  args: {
    code: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      return {
        success: false,
        reason: 'feature_disabled',
        message: 'Login functionality is currently disabled',
      };
    }

    // Clean up the code (removing dashes if any)
    const cleanCode = args.code.replace(/-/g, '').toUpperCase();

    // Find the login code
    const loginCode = await ctx.db
      .query('loginCodes')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    if (!loginCode) {
      return {
        success: false,
        reason: 'invalid_code',
        message: 'Invalid login code',
      };
    }

    // Check if the code is expired
    if (isCodeExpired(loginCode.expiresAt)) {
      // Delete the expired code
      await ctx.db.delete('loginCodes', loginCode._id);
      return {
        success: false,
        reason: 'code_expired',
        message: 'This login code has expired',
      };
    }

    // Get the user associated with the code
    const user = await ctx.db.get('users', loginCode.userId);
    if (!user) {
      return {
        success: false,
        reason: 'user_not_found',
        message: 'User not found',
      };
    }

    // Delete the code once used
    await ctx.db.delete('loginCodes', loginCode._id);

    // Check if the session exists
    const existingSession = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    // Create or update session
    const now = Date.now();

    if (existingSession) {
      // Update existing session to point to the user
      await ctx.db.patch('sessions', existingSession._id, {
        userId: loginCode.userId,
        authMethod: 'login_code',
      });
    } else {
      // Create a new session
      await ctx.db.insert('sessions', {
        sessionId: args.sessionId,
        userId: loginCode.userId,
        createdAt: now,
        authMethod: 'login_code',
      });
    }

    return {
      success: true,
      message: 'Login successful',
      user,
    };
  },
});

/**
 * Checks if a login code is still valid (exists and not expired).
 */
export const checkCodeValidity = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      return false;
    }

    // Clean up the code (removing dashes if any)
    const cleanCode = args.code.replace(/-/g, '').toUpperCase();

    // Find the login code
    const loginCode = await ctx.db
      .query('loginCodes')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    // If the code doesn't exist, it's not valid
    if (!loginCode) {
      return false;
    }

    // Check if the code is expired
    if (isCodeExpired(loginCode.expiresAt)) {
      return false;
    }

    // The code exists and is not expired, so it's valid
    return true;
  },
});

/**
 * Gets or creates a recovery code for the current authenticated user.
 */
export const getOrCreateRecoveryCode = action({
  args: { ...SessionIdArg },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; recoveryCode?: string; reason?: string }> => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      return {
        success: false,
        reason: 'feature_disabled',
      };
    }

    // Find the session by sessionId
    const existingSession = await ctx.runQuery(internal.auth.getSessionBySessionId, {
      sessionId: args.sessionId,
    });

    if (!existingSession || !existingSession.userId) {
      return { success: false, reason: 'not_authenticated' };
    }

    // Get the user
    const user = await ctx.runQuery(internal.auth.getUserById, {
      userId: existingSession.userId,
    });

    if (!user) {
      return { success: false, reason: 'user_not_found' };
    }

    // If user already has a recovery code, return it
    if (user.recoveryCode) {
      return { success: true, recoveryCode: user.recoveryCode };
    }

    // Otherwise, generate a new recovery code using the crypto action
    const code: string = await ctx.runAction(api.crypto.generateRecoveryCode, { length: 128 });
    await ctx.runMutation(internal.auth.updateUserRecoveryCode, {
      userId: existingSession.userId,
      recoveryCode: code,
    });

    return { success: true, recoveryCode: code };
  },
});

/**
 * Verifies a recovery code and authenticates the session if valid.
 */
export const verifyRecoveryCode = action({
  args: { recoveryCode: v.string(), ...SessionIdArg },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; user?: Doc<'users'>; reason?: string }> => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      return {
        success: false,
        reason: 'feature_disabled',
      };
    }

    // Find the user with the given recovery code
    const user = await ctx.runQuery(internal.auth.getUserByRecoveryCode, {
      recoveryCode: args.recoveryCode,
    });

    if (!user) {
      return { success: false, reason: 'invalid_code' };
    }

    // Check if the session exists
    const existingSession = await ctx.runQuery(internal.auth.getSessionBySessionId, {
      sessionId: args.sessionId,
    });

    // Create or update session
    const now = Date.now();

    if (existingSession) {
      // Update existing session to point to the user
      await ctx.runMutation(internal.auth.updateSession, {
        sessionId: existingSession._id,
        userId: user._id,
        authMethod: 'recovery_code',
      });
    } else {
      // Create a new session
      await ctx.runMutation(internal.auth.createSession, {
        sessionId: args.sessionId,
        userId: user._id,
        createdAt: now,
        authMethod: 'recovery_code',
      });
    }

    return {
      success: true,
      user,
    };
  },
});

/**
 * Regenerates a new recovery code for the current user, invalidating the old one.
 */
export const regenerateRecoveryCode = action({
  args: { ...SessionIdArg },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; recoveryCode?: string; reason?: string }> => {
    // Check if login is disabled
    if (featureFlags.disableLogin) {
      return {
        success: false,
        reason: 'feature_disabled',
      };
    }

    // Find the session by sessionId
    const existingSession = await ctx.runQuery(internal.auth.getSessionBySessionId, {
      sessionId: args.sessionId,
    });

    if (!existingSession || !existingSession.userId) {
      return { success: false, reason: 'not_authenticated' };
    }

    // Get the user
    const user = await ctx.runQuery(internal.auth.getUserById, {
      userId: existingSession.userId,
    });

    if (!user) {
      return { success: false, reason: 'user_not_found' };
    }

    // Generate a new recovery code using the crypto action
    const code: string = await ctx.runAction(api.crypto.generateRecoveryCode, { length: 128 });
    await ctx.runMutation(internal.auth.updateUserRecoveryCode, {
      userId: existingSession.userId,
      recoveryCode: code,
    });

    return { success: true, recoveryCode: code };
  },
});

/**
 * Internal query to retrieve a session by its sessionId.
 */
export const getSessionBySessionId = internalQuery({
  args: { ...SessionIdArg },
  handler: async (ctx, args): Promise<Doc<'sessions'> | null> => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();
  },
});

/**
 * Internal query to retrieve a user by their ID.
 */
export const getUserById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args): Promise<Doc<'users'> | null> => {
    return await ctx.db.get('users', args.userId);
  },
});

/**
 * Internal query to find a user by their recovery code.
 */
export const getUserByRecoveryCode = internalQuery({
  args: { recoveryCode: v.string() },
  handler: async (ctx, args): Promise<Doc<'users'> | null> => {
    return await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('recoveryCode'), args.recoveryCode))
      .first();
  },
});

/**
 * Internal mutation to add or update a recovery code on a user.
 */
export const updateUserRecoveryCode = internalMutation({
  args: { userId: v.id('users'), recoveryCode: v.string() },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch('users', args.userId, { recoveryCode: args.recoveryCode });
  },
});

/**
 * Internal mutation to create a new session for a user.
 */
export const createSession = internalMutation({
  args: {
    ...SessionIdArg,
    userId: v.id('users'),
    createdAt: v.number(),
    authMethod: v.optional(
      v.union(
        v.literal('google'),
        v.literal('login_code'),
        v.literal('recovery_code'),
        v.literal('anonymous'),
        v.literal('username_password')
      )
    ),
  },
  handler: async (ctx, args): Promise<Id<'sessions'>> => {
    return await ctx.db.insert('sessions', {
      sessionId: args.sessionId,
      userId: args.userId,
      createdAt: args.createdAt,
      authMethod: args.authMethod,
    });
  },
});

/**
 * Internal mutation to update an existing session with a new user.
 */
export const updateSession = internalMutation({
  args: {
    sessionId: v.id('sessions'),
    userId: v.id('users'),
    authMethod: v.optional(
      v.union(
        v.literal('google'),
        v.literal('login_code'),
        v.literal('recovery_code'),
        v.literal('anonymous'),
        v.literal('username_password')
      )
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch('sessions', args.sessionId, {
      userId: args.userId,
      authMethod: args.authMethod,
    });
  },
});

/**
 * Generates a random anonymous username from predefined adjectives and nouns.
 */
function _generateAnonUsername(): string {
  const adjectives = [
    'Happy',
    'Curious',
    'Cheerful',
    'Bright',
    'Calm',
    'Eager',
    'Gentle',
    'Honest',
    'Kind',
    'Lively',
    'Polite',
    'Proud',
    'Silly',
    'Witty',
    'Brave',
  ];

  const nouns = [
    'Penguin',
    'Tiger',
    'Dolphin',
    'Eagle',
    'Koala',
    'Panda',
    'Fox',
    'Wolf',
    'Owl',
    'Rabbit',
    'Lion',
    'Bear',
    'Deer',
    'Hawk',
    'Turtle',
  ];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective}${randomNoun}${randomNumber}`;
}
