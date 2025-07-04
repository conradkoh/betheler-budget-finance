import { query } from '../_generated/server';

/**
 * Gets Google authentication configuration for client use.
 * Returns only public configuration data (client ID and enabled status).
 * Does not require admin access, unlike the system admin endpoint.
 */
export const getConfig = query({
  args: {},
  handler: async (ctx, _args) => {
    // Get Google Auth configuration from database
    const config = await ctx.db
      .query('thirdPartyAuthConfig')
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
