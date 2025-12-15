import type { SessionId } from 'convex-helpers/server/sessions';

import type { MutationCtx, QueryCtx } from '../../convex/_generated/server';

export const getAuthUser = async (ctx: QueryCtx | MutationCtx, args: { sessionId: SessionId }) => {
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
    .first();
  if (!session) {
    throw new Error('Session not found');
  }

  const user = await ctx.db.get('users', session.userId);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const getAuthUserOptional = async (
  ctx: QueryCtx | MutationCtx,
  args: { sessionId: SessionId }
) => {
  try {
    return await getAuthUser(ctx, args);
  } catch (_error) {
    return null;
  }
};
