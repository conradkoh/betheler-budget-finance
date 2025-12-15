import type { SessionId } from 'convex-helpers/server/sessions';
import { expect, test } from 'vitest';

import { t } from '../test.setup';
import { api } from './_generated/api';

test('getUser', async () => {
  const sessionId = '123' as SessionId;
  const login = await t.mutation(api.auth.loginAnon, { sessionId });
  expect(login.success).toBe(true);
  const userId = login.userId;
  const loginState = await t.query(api.auth.getState, { sessionId });
  expect(loginState.state).toBe('authenticated');
  if (loginState.state === 'unauthenticated') {
    throw new Error('User is not authenticated');
  }
  expect(loginState.user._id).toBe(userId);
});
