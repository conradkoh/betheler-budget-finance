'use node';

import crypto from 'node:crypto';

import { v } from 'convex/values';

import { action } from './_generated/server';

// Helper to generate a secure random alphanumeric string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.randomFillSync(array);
  return Array.from(array, (x) => chars[x % chars.length]).join('');
}

export const generateRecoveryCode = action({
  args: { length: v.optional(v.number()) },
  handler: async (_ctx, args) => {
    const code = generateRandomString(args.length ?? 128);
    return code;
  },
});
