// Password Protection Module
// Provides client-side password protection for React components

// Context-based components
export { PasswordProtectProvider, usePasswordProtection } from './PasswordProtectContext';
export type { PasswordProtectConfig, PasswordProtectContextValue } from './PasswordProtectContext';
export { PasswordProtect } from './PasswordProtect';
export { PasswordProtectedConditionalRender } from './PasswordProtectedConditionalRender';

// Utilities
export { generatePasswordHash, verifyPassword } from './password-utils';
