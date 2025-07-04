// Password Protection Module
// Provides client-side password protection for React components

export { PasswordProtect } from './PasswordProtect';
export type { PasswordProtectConfig, PasswordProtectContextValue } from './PasswordProtectContext';
// Context-based components
export { PasswordProtectProvider, usePasswordProtection } from './PasswordProtectContext';
export { PasswordProtectedConditionalRender } from './PasswordProtectedConditionalRender';

// Utilities
export { generatePasswordHash, verifyPassword } from './password-utils';
