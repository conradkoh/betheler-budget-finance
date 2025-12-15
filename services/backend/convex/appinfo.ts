import { query } from './_generated/server';

// Public interfaces and types
export interface AppInfo {
  version: string;
  googleAuthAvailable: boolean;
  googleAuthDetails: GoogleAuthDetails;
}

export interface GoogleAuthDetails {
  isConfiguredInDatabase: boolean;
  isEnabled: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
}

// Internal types
interface _GoogleAuthConfig {
  clientId?: string;
  clientSecret?: string;
  enabled?: boolean;
}

/**
 * Gets application information including version and authentication configuration.
 * Provides frontend components with app metadata and Google Auth availability status.
 */
export const get = query({
  args: {},
  handler: async (ctx, _args): Promise<AppInfo> => {
    const appInfo = await ctx.db.query('appInfo').first();

    // Get Google Auth configuration from database
    const googleAuthConfig = await ctx.db
      .query('auth_providerConfigs')
      .withIndex('by_type', (q) => q.eq('type', 'google'))
      .first();

    // Compute configuration status
    const googleAuthDetails = _computeGoogleAuthDetails(googleAuthConfig);

    return {
      version: appInfo?.latestVersion || '1.0.0',
      googleAuthAvailable: googleAuthDetails.isConfiguredInDatabase && googleAuthDetails.isEnabled,
      googleAuthDetails,
    };
  },
});

// Internal helper functions
/**
 * Computes Google Auth configuration details from database config.
 */
function _computeGoogleAuthDetails(googleAuthConfig: _GoogleAuthConfig | null): GoogleAuthDetails {
  const isConfiguredInDatabase = !!(googleAuthConfig?.clientId && googleAuthConfig?.clientSecret);
  const isEnabled = googleAuthConfig?.enabled || false;

  return {
    isConfiguredInDatabase,
    isEnabled,
    hasClientId: !!googleAuthConfig?.clientId,
    hasClientSecret: !!googleAuthConfig?.clientSecret,
  };
}
