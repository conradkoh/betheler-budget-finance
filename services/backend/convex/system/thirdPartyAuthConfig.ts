import { ConvexError, v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';
import { isSystemAdmin } from '../../modules/auth/accessControl';
import { getAuthUserOptional } from '../../modules/auth/getAuthUser';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { action, mutation, query } from '../_generated/server';

/**
 * SYSTEM ADMIN ONLY: Third-Party Auth Configuration Management
 *
 * All functions in this module require system administrator access.
 * These functions are used to configure and manage third-party OAuth settings.
 *
 * Security Note: Every function in this module MUST verify system admin access.
 */

/**
 * Configuration object for Google Auth settings.
 */
export interface GoogleAuthConfigData {
  type: 'google';
  enabled: boolean;
  projectId?: string;
  clientId?: string;
  clientSecret?: string;
  hasClientSecret: boolean;
  isConfigured: boolean;
  redirectUris: string[];
  configuredBy: Id<'users'>;
  configuredAt: number;
}

/**
 * Retrieves the current Google Auth configuration for system administrators.
 */
export const getGoogleAuthConfig = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args): Promise<GoogleAuthConfigData | null> => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user || !isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can view Google Auth configuration',
      });
    }

    // Get the configuration for Google auth
    const config = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (!config) {
      return null;
    }

    // Compute derived values
    const hasClientSecret = !!config.clientSecret;
    const isConfigured = !!(config.clientId && config.clientSecret);

    return {
      type: config.type,
      enabled: config.enabled,
      projectId: config.projectId,
      clientId: config.clientId,
      clientSecret: undefined, // Never return the secret
      hasClientSecret,
      isConfigured,
      redirectUris: config.redirectUris,
      configuredBy: config.configuredBy,
      configuredAt: config.configuredAt,
    };
  },
});

/**
 * Updates Google Auth configuration with validation and security checks.
 */
export const updateGoogleAuthConfig = mutation({
  args: {
    enabled: v.boolean(),
    projectId: v.optional(v.string()),
    clientId: v.string(),
    clientSecret: v.string(),
    redirectUris: v.array(v.string()),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to configure Google Auth',
      });
    }

    if (!isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can configure Google Auth',
      });
    }

    // Check if configuration already exists
    const existingConfig = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    // Validate input
    if (!args.clientId.trim()) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Client ID is required',
      });
    }

    const hasExistingSecret = existingConfig && !!existingConfig.clientSecret;

    if (!hasExistingSecret && !args.clientSecret.trim()) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Client Secret is required for new configuration',
      });
    }

    // Validate redirect URIs
    for (const uri of args.redirectUris) {
      try {
        new URL(uri);
      } catch {
        throw new ConvexError({
          code: 'VALIDATION_ERROR',
          message: `Invalid redirect URI: ${uri}`,
        });
      }
    }

    const now = Date.now();

    // Determine which client secret to use
    const clientSecretToUse = args.clientSecret.trim() || existingConfig?.clientSecret || '';

    const configData = {
      type: 'google' as const,
      enabled: args.enabled,
      projectId: args.projectId?.trim() || undefined,
      clientId: args.clientId.trim(),
      clientSecret: clientSecretToUse,
      redirectUris: args.redirectUris,
      configuredBy: user._id,
      configuredAt: now,
    };

    if (existingConfig) {
      // Update existing configuration
      await ctx.db.patch(existingConfig._id, configData);
    } else {
      // Create new configuration
      await ctx.db.insert('thirdPartyAuthConfig', configData);
    }

    return {
      success: true,
      message: 'Google Auth configuration updated successfully',
    };
  },
});

/**
 * Toggles Google Auth enabled state without changing other configuration.
 */
export const toggleGoogleAuthEnabled = mutation({
  args: {
    enabled: v.boolean(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to toggle Google Auth',
      });
    }

    if (!isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can toggle Google Auth',
      });
    }

    const now = Date.now();

    // Check if configuration already exists
    const existingConfig = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (existingConfig) {
      // Update existing configuration
      await ctx.db.patch(existingConfig._id, {
        enabled: args.enabled,
        configuredAt: now,
      });
    } else {
      // Create minimal configuration with enabled flag
      await ctx.db.insert('thirdPartyAuthConfig', {
        type: 'google' as const,
        enabled: args.enabled,
        clientId: '',
        clientSecret: '',
        redirectUris: [],
        configuredBy: user._id,
        configuredAt: now,
      });
    }

    return {
      success: true,
      message: `Google Auth ${args.enabled ? 'enabled' : 'disabled'} successfully`,
    };
  },
});

/**
 * Tests Google Auth configuration by validating credentials with Google's API.
 * Uses the provided clientId and either the provided clientSecret or the saved one.
 * Uses action to allow external HTTP requests to Google's API.
 */
export const testGoogleAuthConfig = action({
  args: {
    clientId: v.string(),
    clientSecret: v.optional(v.string()),
    ...SessionIdArg,
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    message: string;
    details?: { issues?: string[] };
  }> => {
    // Verify system admin access by calling a query
    const authState = await ctx.runQuery(api.auth.getState, { sessionId: args.sessionId });
    if (authState.state !== 'authenticated') {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to test Google Auth configuration',
      });
    }

    if (!isSystemAdmin(authState.user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can test Google Auth configuration',
      });
    }

    let clientSecret = args.clientSecret;

    // If no client secret provided, try to use the saved one
    if (!clientSecret) {
      const config: GoogleAuthConfigData | null = await ctx.runQuery(
        api.system.thirdPartyAuthConfig.getGoogleAuthConfig,
        {
          sessionId: args.sessionId,
        }
      );

      if (!config?.clientSecret) {
        return {
          success: false,
          message: 'No client secret provided and no saved client secret found',
          details: { issues: ['Missing Client Secret'] },
        };
      }

      clientSecret = config.clientSecret;
    }

    // Test the credentials with Google API
    return _testNewCredentials(args.clientId, clientSecret);
  },
});

/**
 * Tests new credentials provided by the user by making actual Google API calls.
 */
async function _testNewCredentials(
  clientId?: string,
  clientSecret?: string
): Promise<{
  success: boolean;
  message: string;
  details?: { issues?: string[] };
}> {
  const issues: string[] = [];

  if (!clientId?.trim()) {
    issues.push('Missing Client ID');
  }

  if (!clientSecret?.trim()) {
    issues.push('Missing Client Secret');
  }

  if (issues.length > 0) {
    return {
      success: false,
      message: `New credentials are incomplete: ${issues.join(', ')}`,
      details: { issues },
    };
  }

  // Test credentials by attempting to exchange a dummy authorization code
  // This will validate that the credentials are real and properly configured
  try {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const testRedirectUri = 'http://localhost:3000/login/google/callback';

    // Try to exchange a dummy code - this will fail but will tell us if credentials are valid
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId || '',
        client_secret: clientSecret || '',
        code: 'dummy_code_for_testing',
        grant_type: 'authorization_code',
        redirect_uri: testRedirectUri,
      }),
    });

    const result = await response.json();

    // Check the error type to determine if credentials are valid
    if (result.error === 'invalid_grant') {
      // This means the credentials are valid but the code is invalid (expected)
      return {
        success: true,
        message: 'Credentials are valid! Google accepted the Client ID and Secret.',
      };
    }

    if (result.error === 'invalid_client') {
      // This means the Client ID or Secret is invalid
      return {
        success: false,
        message: 'Invalid credentials: Google rejected the Client ID or Secret.',
        details: { issues: ['Invalid Client ID or Secret'] },
      };
    }

    if (result.error === 'redirect_uri_mismatch') {
      // Credentials are valid but redirect URI isn't configured
      return {
        success: true,
        message:
          'Credentials are valid! (Note: You may need to add redirect URIs in Google Cloud Console)',
      };
    }

    // Some other error - credentials might be valid but there's another issue
    return {
      success: false,
      message: `Google API error: ${result.error_description || result.error || 'Unknown error'}`,
      details: { issues: [result.error || 'Unknown error'] },
    };
  } catch (error) {
    console.error('Error testing Google credentials:', error);
    return {
      success: false,
      message: 'Failed to connect to Google API. Please check your internet connection.',
      details: { issues: ['Network error'] },
    };
  }
}

/**
 * Resets Google Auth configuration by removing all stored settings.
 */
export const resetGoogleAuthConfig = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Verify system admin access
    const user = await getAuthUserOptional(ctx, args);
    if (!user) {
      throw new ConvexError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to reset Google Auth configuration',
      });
    }

    if (!isSystemAdmin(user)) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: 'Only system administrators can reset Google Auth configuration',
      });
    }

    // Find and delete existing configuration
    const existingConfig = await ctx.db
      .query('thirdPartyAuthConfig')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    if (existingConfig) {
      await ctx.db.delete(existingConfig._id);
    }

    return {
      success: true,
      message: 'Google Auth configuration has been reset',
    };
  },
});
