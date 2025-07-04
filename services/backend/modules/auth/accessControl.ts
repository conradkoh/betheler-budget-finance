import type { Doc } from '../../convex/_generated/dataModel';

/**
 * Access level utility functions for user authorization.
 * Provides type-safe access level checking for the application.
 */

export type AccessLevel = 'user' | 'system_admin';

/**
 * Gets a user's access level with fallback to 'user' if undefined.
 * This centralizes the logic for handling optional accessLevel fields during migration.
 * @param user - The user document to check
 * @returns The user's access level, defaulting to 'user' if undefined
 */
export function getAccessLevel(user: Doc<'users'>): AccessLevel {
  return user.accessLevel ?? 'user';
}

/**
 * Checks if a user has system administrator access level.
 * @param user - The user document to check
 * @returns true if the user is a system administrator, false otherwise
 */
export function isSystemAdmin(user: Doc<'users'>): boolean {
  return getAccessLevel(user) === 'system_admin';
}

/**
 * Checks if a user has at least the specified access level.
 * @param user - The user document to check
 * @param requiredLevel - The minimum required access level
 * @returns true if the user meets the access level requirement, false otherwise
 */
export function hasAccessLevel(user: Doc<'users'>, requiredLevel: AccessLevel): boolean {
  if (requiredLevel === 'user') {
    return true; // All users have 'user' level access
  }

  if (requiredLevel === 'system_admin') {
    return isSystemAdmin(user);
  }

  return false;
}

/**
 * Gets a user's access level as a string.
 * @param user - The user document
 * @returns The user's access level
 * @deprecated Use getAccessLevel instead for consistency
 */
export function getUserAccessLevel(user: Doc<'users'>): AccessLevel {
  return getAccessLevel(user);
}
