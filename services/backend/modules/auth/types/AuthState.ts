import type { Doc } from '../../../convex/_generated/dataModel';
import type { AccessLevel } from '../accessControl';

/**
 * Authentication state type representing user session status and information.
 * Can be either unauthenticated with a reason or authenticated with user data.
 */
export type AuthState =
  | {
      sessionId: string;
      state: 'unauthenticated';
      reason: string;
    }
  | {
      sessionId: string;
      state: 'authenticated';
      user: Doc<'users'>;
      accessLevel: AccessLevel;
      isSystemAdmin: boolean;
      authMethod?: 'google' | 'login_code' | 'recovery_code' | 'anonymous' | 'username_password';
    };

/**
 * Google-specific user profile type for frontend components.
 * Contains both basic user info and detailed Google profile data.
 */
export type GoogleUserProfile = {
  name: string;
  email: string;
  picture?: string;
  googleProfile: {
    id: string;
    email: string;
    verified_email?: boolean;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    locale?: string;
    hd?: string;
  };
};
