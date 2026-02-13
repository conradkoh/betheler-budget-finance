import { ConvexError, v } from 'convex/values';
import type { SessionId } from 'convex-helpers/server/sessions';
import { SessionIdArg } from 'convex-helpers/server/sessions';
import { z } from 'zod';

import { featureFlags } from '../../config/featureFlags';
import { api } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import {
  type ActionCtx,
  action,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from '../_generated/server';

// Public interfaces and types
export type OAuthState = z.infer<typeof OAuthStateSchema>;

// Internal interfaces and types
interface _GoogleProfile {
  id: string;
  email: string;
  verified_email?: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  hd?: string; // Hosted domain for Google Workspace users
}

interface _GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

// Internal constants
const _GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const _GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// OAuth State Parameter Schema - makes flow type explicit and type-safe
const OAuthStateSchema = z.object({
  flowType: z.enum(['login', 'connect']),
  requestId: z.string(), // ID of the login or connect request
  version: z.literal('v1'), // Schema version for future compatibility
});

/**
 * Decodes and validates OAuth state from URL-encoded JSON string
 */
function _decodeOAuthState(encodedState: string): OAuthState {
  try {
    const decoded = decodeURIComponent(encodedState);
    const parsed = JSON.parse(decoded);
    return OAuthStateSchema.parse(parsed);
  } catch (_error) {
    throw new ConvexError({
      code: 'INVALID_STATE',
      message: 'Invalid or malformed OAuth state parameter',
    });
  }
}

/**
 * Gets Google authentication configuration for client use.
 * Returns public configuration data (client ID and enabled status).
 */
export const getConfig = query({
  args: {},
  handler: async (ctx, _args) => {
    // Get Google Auth configuration from database
    const config = await ctx.db
      .query('auth_providerConfigs')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (!config) {
      return {
        enabled: false,
        clientId: null,
      };
    }

    return {
      enabled: config.enabled,
      clientId: config.clientId || null,
    };
  },
});

/**
 * Internal query to retrieve Google Auth configuration for actions.
 */
export const getGoogleAuthConfigInternal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('auth_providerConfigs')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();
  },
});

/**
 * Exchange Google OAuth authorization code for access token and user profile.
 */
export const exchangeGoogleCode = action({
  args: {
    code: v.string(),
    state: v.string(), // CSRF protection
    redirectUri: v.string(),
  },
  handler: async (ctx, args): Promise<{ profile: _GoogleProfile; success: boolean }> => {
    // Check if Google auth is enabled dynamically
    const authConfig = await _isGoogleAuthEnabledForActions(ctx);
    if (!authConfig.enabled || !authConfig.clientId || !authConfig.clientSecret) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Google authentication is currently disabled or not configured',
      });
    }

    const { clientId, clientSecret } = authConfig;

    try {
      // Step 1: Exchange authorization code for access token
      const tokenResponse = await fetch(_GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: args.code,
          grant_type: 'authorization_code',
          redirect_uri: args.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        await tokenResponse.text(); // Read error response but don't store it
        throw new ConvexError({
          code: 'OAUTH_ERROR',
          message: 'Failed to exchange authorization code for token',
        });
      }

      const tokenData = (await tokenResponse.json()) as _GoogleTokenResponse;

      // Step 2: Use access token to get user profile
      const profileResponse = await fetch(_GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        await profileResponse.text(); // Read error response but don't store it
        throw new ConvexError({
          code: 'OAUTH_ERROR',
          message: 'Failed to fetch user profile from Google',
        });
      }

      const profile = (await profileResponse.json()) as _GoogleProfile;

      // Validate required profile fields
      if (!profile.id || !profile.email || !profile.name) {
        throw new ConvexError({
          code: 'OAUTH_ERROR',
          message: 'Invalid Google profile data received',
        });
      }

      return { profile, success: true };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        code: 'OAUTH_ERROR',
        message: 'Google OAuth authentication failed',
      });
    }
  },
});

/**
 * Creates or updates a Google user and establishes a session.
 */
export const loginWithGoogle = mutation({
  args: {
    profile: v.object({
      id: v.string(),
      email: v.string(),
      verified_email: v.optional(v.boolean()),
      name: v.string(),
      given_name: v.optional(v.string()),
      family_name: v.optional(v.string()),
      picture: v.optional(v.string()),
      locale: v.optional(v.string()),
      hd: v.optional(v.string()),
    }),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if Google auth is enabled dynamically
    const isEnabled = await _isGoogleAuthEnabled(ctx);
    if (!isEnabled) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Google authentication is currently disabled or not configured',
      });
    }

    const { profile, sessionId } = args;

    try {
      // Check if user already exists by Google ID
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_googleId', (q) => q.eq('google.id', profile.id))
        .first();

      const userId: Id<'users'> = existingUser
        ? await (async () => {
            // Update existing user with latest profile information
            if (existingUser.type !== 'full') {
              throw new ConvexError({
                code: 'USER_TYPE_MISMATCH',
                message: 'User exists with different authentication type',
              });
            }
            await ctx.db.patch('users', existingUser._id, {
              email: profile.email,
              google: profile,
            });

            return existingUser._id;
          })()
        : await (async () => {
            // Check if user exists with same email but different auth type
            const existingEmailUser = await ctx.db
              .query('users')
              .withIndex('by_email', (q) => q.eq('email', profile.email))
              .first();

            if (existingEmailUser) {
              throw new ConvexError({
                code: 'EMAIL_ALREADY_EXISTS',
                message:
                  'An account with this email already exists with a different authentication method',
              });
            }

            // Create new full user with Google profile
            return await ctx.db.insert('users', {
              type: 'full',
              name: profile.name,
              email: profile.email,
              google: profile,
              accessLevel: 'user', // Default access level for new Google users
            });
          })();

      // Create or update session (following existing session pattern)
      const existingSession = await ctx.db
        .query('sessions')
        .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
        .first();

      if (existingSession) {
        // Update existing session to link to the Google user
        await ctx.db.patch('sessions', existingSession._id, {
          userId: userId,
          authMethod: 'google',
        });
      } else {
        // Create new session
        await ctx.db.insert('sessions', {
          sessionId: sessionId,
          userId: userId,
          createdAt: Date.now(),
          authMethod: 'google',
        });
      }

      return {
        success: true,
        userId,
        userType: 'full' as const,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        code: 'LOGIN_ERROR',
        message: 'Failed to complete Google login',
      });
    }
  },
});

/**
 * Connects/links a Google account to the current logged-in user.
 * This is different from loginWithGoogle as it preserves the current session
 * and only adds Google profile data to the existing user.
 */
export const connectGoogle = mutation({
  args: {
    profile: v.object({
      id: v.string(),
      email: v.string(),
      verified_email: v.optional(v.boolean()),
      name: v.string(),
      given_name: v.optional(v.string()),
      family_name: v.optional(v.string()),
      picture: v.optional(v.string()),
      locale: v.optional(v.string()),
      hd: v.optional(v.string()),
    }),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if Google auth is enabled dynamically
    const isEnabled = await _isGoogleAuthEnabled(ctx);
    if (!isEnabled) {
      throw new ConvexError({
        code: 'FEATURE_DISABLED',
        message: 'Google authentication is currently disabled or not configured',
      });
    }

    const { profile, sessionId } = args;

    // Get the current session and user
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first();

    if (!session || !session.userId) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to connect a Google account',
      });
    }

    const currentUser = await ctx.db.get('users', session.userId);

    if (!currentUser) {
      throw new ConvexError({
        code: 'USER_NOT_FOUND',
        message: 'Current user not found',
      });
    }

    // Handle anonymous users by converting them to full users
    if (currentUser.type === 'anonymous') {
      // Convert anonymous user to full user with Google profile
      await _convertAnonymousToFullUser(ctx, currentUser, profile);

      // Update session auth method to Google
      await ctx.db.patch('sessions', session._id, {
        authMethod: 'google',
      });

      return {
        success: true,
        message: 'Anonymous account converted and Google account connected successfully',
        connectedEmail: profile.email,
        converted: true,
      };
    }

    // Ensure current user is a full user (not anonymous)
    if (currentUser.type !== 'full') {
      throw new ConvexError({
        code: 'INVALID_USER_TYPE',
        message: 'Only full user accounts can connect Google accounts',
      });
    }

    // Check if user already has Google connected
    if (currentUser.google) {
      // If it's the same Google account, return success (idempotent operation)
      if (currentUser.google.id === profile.id) {
        return {
          success: true,
          message: 'Google account is already connected to this user',
          connectedEmail: profile.email,
          alreadyConnected: true,
        };
      }
      // Different Google account is already connected
      throw new ConvexError({
        code: 'ALREADY_CONNECTED',
        message: 'A different Google account is already connected to this user',
      });
    }

    try {
      // Check if this Google account is already linked to another user
      const existingGoogleUser = await ctx.db
        .query('users')
        .withIndex('by_googleId', (q) => q.eq('google.id', profile.id))
        .first();

      if (existingGoogleUser && existingGoogleUser._id !== currentUser._id) {
        throw new ConvexError({
          code: 'GOOGLE_ACCOUNT_IN_USE',
          message: 'This Google account is already connected to another user',
        });
      }

      // Check if another user has the same email
      const existingEmailUser = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', profile.email))
        .first();

      if (existingEmailUser && existingEmailUser._id !== currentUser._id) {
        throw new ConvexError({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Another user account already uses this email address',
        });
      }

      // Connect Google account to current user
      await ctx.db.patch('users', currentUser._id, {
        google: profile,
        // Update email if current user doesn't have one or if Google email is different
        email: currentUser.email || profile.email,
      });

      return {
        success: true,
        message: 'Google account connected successfully',
        connectedEmail: profile.email,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError({
        code: 'CONNECT_ERROR',
        message: 'Failed to connect Google account',
      });
    }
  },
});

/**
 * Disconnects Google authentication from the current user's account.
 * Removes Google profile data while preserving the user account.
 */
export const disconnectGoogle = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get the current session and user
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session || !session.userId) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to disconnect Google account',
      });
    }

    const user = await ctx.db.get('users', session.userId);

    if (!user) {
      throw new ConvexError({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    // Check if user has Google authentication linked
    if (user.type !== 'full' || !user.google) {
      throw new ConvexError({
        code: 'NO_GOOGLE_ACCOUNT',
        message: 'No Google account is linked to this user',
      });
    }

    // Ensure user has other authentication methods or recovery options
    // For now, we'll allow disconnection but this could be enhanced to prevent
    // users from locking themselves out
    const hasRecoveryCode = !!user.recoveryCode;
    const hasEmail = !!user.email;

    if (!hasRecoveryCode && !hasEmail) {
      throw new ConvexError({
        code: 'UNSAFE_DISCONNECT',
        message:
          'Cannot disconnect Google account without recovery options. Please set up a recovery code first.',
      });
    }

    // Remove Google data from user
    await ctx.db.patch('users', user._id, {
      google: undefined,
    });

    // If the current session was authenticated via Google, we might want to
    // keep the session active but change the auth method to indicate it's no longer Google
    if (session.authMethod === 'google') {
      await ctx.db.patch('sessions', session._id, {
        authMethod: undefined, // Or could be 'disconnected' or similar
      });
    }

    return {
      success: true,
      message: 'Google account disconnected successfully',
    };
  },
});

/**
 * Mutation to create a new login request for authentication provider (e.g., Google OAuth).
 * Returns the id of the inserted login request as loginId.
 */
export const createLoginRequest = mutation({
  args: {
    ...SessionIdArg,
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.redirectUri) {
      throw new Error('redirectUri is required');
    }

    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now
    const id = await ctx.db.insert('auth_loginRequests', {
      sessionId: args.sessionId,
      status: 'pending',
      createdAt: now,
      expiresAt,
      provider: 'google',
      redirectUri: args.redirectUri,
    });
    return { loginId: id };
  },
});

/**
 * Mutation to create a new connect request for authentication provider account linking (e.g., Google OAuth).
 * Returns the id of the inserted connect request as connectId.
 */
export const createConnectRequest = mutation({
  args: {
    ...SessionIdArg,
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.redirectUri) {
      throw new Error('redirectUri is required');
    }

    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes from now
    const id = await ctx.db.insert('auth_connectRequests', {
      sessionId: args.sessionId,
      status: 'pending',
      createdAt: now,
      expiresAt,
      provider: 'google',
      redirectUri: args.redirectUri,
    });
    return { connectId: id };
  },
});

/**
 * Mutation to complete or fail a login request after OAuth callback.
 * Updates status, completedAt, and error fields.
 */
export const completeLoginRequest = mutation({
  args: {
    loginRequestId: v.id('auth_loginRequests'),
    status: v.union(v.literal('completed'), v.literal('failed')),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const completedAt = Date.now();
    await ctx.db.patch('auth_loginRequests', args.loginRequestId, {
      status: args.status,
      completedAt,
      error: args.error,
    });
    return { success: true };
  },
});

/**
 * Mutation to complete or fail a connect request after OAuth callback.
 * Updates status, completedAt, and error fields.
 */
export const completeConnectRequest = mutation({
  args: {
    connectRequestId: v.id('auth_connectRequests'),
    status: v.union(v.literal('completed'), v.literal('failed')),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const completedAt = Date.now();
    await ctx.db.patch('auth_connectRequests', args.connectRequestId, {
      status: args.status,
      completedAt,
      error: args.error,
    });
    return { success: true };
  },
});

/**
 * Query to get a login request by ID (public for frontend polling).
 */
export const getLoginRequest = query({
  args: {
    loginRequestId: v.id('auth_loginRequests'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get('auth_loginRequests', args.loginRequestId);
  },
});

/**
 * Query to get a connect request by ID (public for frontend polling).
 */
export const getConnectRequest = query({
  args: {
    connectRequestId: v.id('auth_connectRequests'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get('auth_connectRequests', args.connectRequestId);
  },
});

/**
 * Improved Google OAuth callback handler with explicit flow detection via structured state.
 * Handles both login and connect flows with proper validation and type safety.
 */
export const handleGoogleCallback = action({
  args: {
    code: v.string(),
    state: v.string(), // Structured OAuth state with explicit flow type
  },
  handler: async (ctx, args) => {
    const { code, state } = args;

    try {
      // Decode and validate the structured state parameter
      const oauthState = _decodeOAuthState(state);
      const { flowType, requestId } = oauthState;

      if (flowType === 'connect') {
        // Handle connect flow
        const connectRequest = await ctx.runQuery(api.auth.google.getConnectRequest, {
          connectRequestId: requestId as Id<'auth_connectRequests'>,
        });

        if (!connectRequest || connectRequest.provider !== 'google') {
          throw new Error('Invalid connect request');
        }

        // SECURITY: Check if connect request has expired
        const now = Date.now();
        if (connectRequest.expiresAt && now > connectRequest.expiresAt) {
          throw new Error('Connect request expired');
        }

        const redirectUri = connectRequest.redirectUri;
        if (!redirectUri) {
          throw new Error('No redirect URI found in connect request');
        }

        // Exchange code for Google profile
        const { profile, success } = await ctx.runAction(api.auth.google.exchangeGoogleCode, {
          code,
          state,
          redirectUri,
        });
        if (!success) throw new Error('Google OAuth failed');

        // Connect Google account to existing user
        const connectResult = await ctx.runMutation(api.auth.google.connectGoogle, {
          profile,
          sessionId: connectRequest.sessionId as SessionId,
        });
        if (!connectResult.success) throw new Error('Connect failed');

        // Mark connect request as completed
        await ctx.runMutation(api.auth.google.completeConnectRequest, {
          connectRequestId: requestId as Id<'auth_connectRequests'>,
          status: 'completed',
        });

        return {
          success: true,
          message: 'Account connected successfully. You may close this window.',
          flowType: 'connect' as const,
        };
      }
      if (flowType === 'login') {
        // Handle login flow
        const loginRequest = await ctx.runQuery(api.auth.google.getLoginRequest, {
          loginRequestId: requestId as Id<'auth_loginRequests'>,
        });

        if (!loginRequest || loginRequest.provider !== 'google') {
          throw new Error('Invalid login request');
        }

        // SECURITY: Check if login request has expired
        const now = Date.now();
        if (loginRequest.expiresAt && now > loginRequest.expiresAt) {
          throw new Error('Login request expired');
        }

        const redirectUri = loginRequest.redirectUri;
        if (!redirectUri) {
          throw new Error('No redirect URI found in login request');
        }

        // Exchange code for Google profile
        const { profile, success } = await ctx.runAction(api.auth.google.exchangeGoogleCode, {
          code,
          state,
          redirectUri,
        });
        if (!success) throw new Error('Google OAuth failed');

        // Find or create user and update session
        const loginResult = await ctx.runMutation(api.auth.google.loginWithGoogle, {
          profile,
          sessionId: loginRequest.sessionId as SessionId,
        });
        if (!loginResult.success) throw new Error('Login failed');

        // Mark login request as completed
        await ctx.runMutation(api.auth.google.completeLoginRequest, {
          loginRequestId: requestId as Id<'auth_loginRequests'>,
          status: 'completed',
        });

        return {
          success: true,
          message: 'Login successful. You may close this window.',
          flowType: 'login' as const,
        };
      }

      throw new Error(`Unknown flow type: ${flowType}`);
    } catch (err) {
      // Try to decode state to determine which request to mark as failed
      try {
        const oauthState = _decodeOAuthState(state);
        const { flowType, requestId } = oauthState;

        if (flowType === 'connect') {
          await ctx.runMutation(api.auth.google.completeConnectRequest, {
            connectRequestId: requestId as Id<'auth_connectRequests'>,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        } else if (flowType === 'login') {
          await ctx.runMutation(api.auth.google.completeLoginRequest, {
            loginRequestId: requestId as Id<'auth_loginRequests'>,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      } catch (_stateError) {
        // If we can't decode state, continue without failing the entire operation
      }

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
});

/**
 * Handles Google OAuth callback for login flow.
 * Processes the OAuth code, exchanges it for a profile, logs in the user, and marks the request as completed.
 *
 * @deprecated Use handleGoogleCallback instead - the new handler uses explicit flow detection via structured state
 * and supports both login and connect flows with proper type safety and validation.
 */
export const handleGoogleLoginCallback = action({
  args: {
    code: v.string(),
    state: v.string(), // This is the loginRequestId
  },
  handler: async (ctx, args) => {
    const { code, state } = args;

    try {
      // Get the login request to extract sessionId and redirectUri
      const loginRequest = await ctx.runQuery(api.auth.google.getLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
      });
      if (!loginRequest || loginRequest.provider !== 'google') {
        throw new Error('Invalid login request');
      }

      // SECURITY: Check if login request has expired
      const now = Date.now();
      if (loginRequest.expiresAt && now > loginRequest.expiresAt) {
        throw new Error('Login request expired');
      }

      // Use the redirect URI that was stored with the login request
      const redirectUri = loginRequest.redirectUri;
      if (!redirectUri) {
        throw new Error('No redirect URI found in login request');
      }

      // Exchange code for Google profile
      const { profile, success } = await ctx.runAction(api.auth.google.exchangeGoogleCode, {
        code,
        state,
        redirectUri,
      });
      if (!success) throw new Error('Google OAuth failed');

      // Find or create user and update session - using mutation
      const loginResult = await ctx.runMutation(api.auth.google.loginWithGoogle, {
        profile,
        sessionId: loginRequest.sessionId as SessionId, // SessionId type casting
      });
      if (!loginResult.success) throw new Error('Login failed');

      // Mark login request as completed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'completed',
      });

      return {
        success: true,
        message: 'Login successful. You may close this window.',
      };
    } catch (err) {
      // Mark login request as failed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
});

/**
 * Handles Google OAuth callback for profile connect flow.
 * Processes the OAuth code, exchanges it for a profile, connects the account to existing user, and marks the request as completed.
 *
 * @deprecated Use handleGoogleCallback instead - the new handler uses explicit flow detection via structured state
 * and supports both login and connect flows with proper type safety and validation.
 */
export const handleGoogleConnectCallback = action({
  args: {
    code: v.string(),
    state: v.string(), // This is the loginRequestId
  },
  handler: async (ctx, args) => {
    const { code, state } = args;

    try {
      // Get the login request to extract sessionId and redirectUri
      const loginRequest = await ctx.runQuery(api.auth.google.getLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
      });
      if (!loginRequest || loginRequest.provider !== 'google') {
        throw new Error('Invalid login request');
      }

      // SECURITY: Check if login request has expired
      const now = Date.now();
      if (loginRequest.expiresAt && now > loginRequest.expiresAt) {
        throw new Error('Login request expired');
      }

      // Use the redirect URI that was stored with the login request
      const redirectUri = loginRequest.redirectUri;
      if (!redirectUri) {
        throw new Error('No redirect URI found in login request');
      }

      // Exchange code for Google profile
      const { profile, success } = await ctx.runAction(api.auth.google.exchangeGoogleCode, {
        code,
        state,
        redirectUri,
      });
      if (!success) throw new Error('Google OAuth failed');

      // Connect Google account to existing user - using mutation
      const connectResult = await ctx.runMutation(api.auth.google.connectGoogle, {
        profile,
        sessionId: loginRequest.sessionId as SessionId, // SessionId type casting
      });
      if (!connectResult.success) throw new Error('Connect failed');

      // Mark login request as completed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'completed',
      });

      return {
        success: true,
        message: 'Account connected successfully. You may close this window.',
      };
    } catch (err) {
      // Mark login request as failed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
});

/**
 * Converts an anonymous user to a full user with Google profile data.
 * This is used when an anonymous user connects their Google account.
 */
async function _convertAnonymousToFullUser(
  ctx: MutationCtx,
  anonymousUser: Doc<'users'>,
  googleProfile: _GoogleProfile
): Promise<void> {
  if (anonymousUser.type !== 'anonymous') {
    throw new ConvexError({
      code: 'INVALID_CONVERSION',
      message: 'Only anonymous users can be converted to full users',
    });
  }

  // Check if this Google account is already linked to another user
  const existingGoogleUser = await ctx.db
    .query('users')
    .withIndex('by_googleId', (q) => q.eq('google.id', googleProfile.id))
    .first();

  if (existingGoogleUser) {
    throw new ConvexError({
      code: 'GOOGLE_ACCOUNT_IN_USE',
      message: 'This Google account is already connected to another user',
    });
  }

  // Check if another user has the same email
  const existingEmailUser = await ctx.db
    .query('users')
    .withIndex('by_email', (q) => q.eq('email', googleProfile.email))
    .first();

  if (existingEmailUser) {
    throw new ConvexError({
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Another user account already uses this email address',
    });
  }

  // Generate username from email
  const username = googleProfile.email.replace('@', '_').replace(/\./g, '_').toLowerCase();

  // Check if username is already taken
  const existingUsernameUser = await ctx.db
    .query('users')
    .withIndex('by_username', (q) => q.eq('username', username))
    .first();

  if (existingUsernameUser) {
    // Add a random suffix to make it unique
    const randomSuffix = Math.floor(Math.random() * 10000);
    const uniqueUsername = `${username}_${randomSuffix}`;

    // Convert anonymous user to full user
    await ctx.db.patch('users', anonymousUser._id, {
      type: 'full',
      username: uniqueUsername,
      email: googleProfile.email,
      google: googleProfile,
      name: googleProfile.name,
      recoveryCode: anonymousUser.recoveryCode,
      accessLevel: anonymousUser.accessLevel ?? 'user', // Ensure access level is set
    });
  } else {
    // Convert anonymous user to full user
    await ctx.db.patch('users', anonymousUser._id, {
      type: 'full',
      username: username,
      email: googleProfile.email,
      google: googleProfile,
      name: googleProfile.name,
      recoveryCode: anonymousUser.recoveryCode,
      accessLevel: anonymousUser.accessLevel ?? 'user', // Ensure access level is set
    });
  }
}

/**
 * Checks if Google Auth is dynamically enabled for mutations and queries.
 */
async function _isGoogleAuthEnabled(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  // Check if login is disabled globally
  if (featureFlags.disableLogin) {
    return false;
  }

  // Check database configuration
  const config = await ctx.db
    .query('auth_providerConfigs')
    .withIndex('by_type', (q) => q.eq('type', 'google'))
    .first();

  // Google Auth is enabled if it's configured, enabled, and has both client ID and secret
  return !!(config?.enabled && config?.clientId && config?.clientSecret);
}

/**
 * Checks if Google Auth is dynamically enabled for actions with configuration details.
 */
async function _isGoogleAuthEnabledForActions(ctx: ActionCtx): Promise<{
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
}> {
  // Check if login is disabled globally
  if (featureFlags.disableLogin) {
    return { enabled: false };
  }

  // Get configuration from database via internal query
  const config = await ctx.runQuery(api.auth.google.getGoogleAuthConfigInternal);

  if (!config?.enabled || !config?.clientId || !config?.clientSecret) {
    return { enabled: false };
  }

  return {
    enabled: true,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  };
}
