# Password Protection Module

A comprehensive client-side password protection system for React components with context-based state management and localStorage persistence.

## Overview

This module provides both a modern context-based approach and a legacy component-based approach for password-protecting React content. It uses SHA-256 hashing with salt to prevent rainbow table attacks, using the Web Crypto API for secure password verification while keeping everything client-side.

## Features

- 🔒 **Client-side password protection** - No server required
- 🔐 **SHA-256 hashing with salt** - Secure password verification with protection against rainbow table attacks
- 🎯 **Context-based architecture** - Centralized configuration and shared state
- 💾 **localStorage persistence** - Remembers valid passwords across sessions
- 🎨 **Beautiful UI** - Built with Shadcn UI components
- 👁️ **Password visibility toggle** - Show/hide password functionality
- ⚡ **Loading states** - Proper UX with loading indicators
- 🚨 **Error handling** - User-friendly error messages
- 📱 **Responsive design** - Works on all screen sizes
- 🔧 **TypeScript support** - Fully typed for better DX
- 🔄 **Backward compatibility** - Legacy component still available
- 🎛️ **Flexible rendering** - Multiple ways to conditionally show content
- 🪝 **Custom hook** - Build your own authentication UI

## Installation

The module is already included in this project. No additional installation required.

## Quick Start

### 1. Generate a Password Hash

Open your browser's developer console and run:

```javascript
window.generatePasswordHash('your-secret-password', 'your-unique-salt')
```

This will return a hash like: `ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f`

**Important**: Use a unique salt for each protected section to ensure maximum security.

### 2. Context-Based Approach (Recommended)

```tsx
import { 
  PasswordProtectProvider, 
  PasswordProtect, 
  PasswordProtectedConditionalRender 
} from '@/modules/password-protection';

const config = {
  verifyHash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
  salt: "my-unique-salt-string",
  localStorageKey: "my-protected-content-password"
};

export default function MyApp() {
  return (
    <PasswordProtectProvider config={config}>
      {/* Login UI and main protected content */}
      <PasswordProtect title="Secure Area">
        <div>
          <h2>Secret Content</h2>
          <p>This content is only visible after entering the correct password!</p>
        </div>
      </PasswordProtect>
      
      {/* Additional content that appears when authenticated */}
      <PasswordProtectedConditionalRender>
        <div>
          <h3>Additional Secret Content</h3>
          <p>This appears automatically when authenticated!</p>
        </div>
      </PasswordProtectedConditionalRender>
    </PasswordProtectProvider>
  );
}
```

## API Reference

### Context-Based Components (Recommended)

#### `PasswordProtectProvider`

Provides centralized configuration and state management for all password protection components.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `PasswordProtectConfig` | ✅ | Configuration object with hash, salt, and localStorage key |
| `children` | `React.ReactNode` | ✅ | Child components that will have access to the context |

**Config Object:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `verifyHash` | `string` | ✅ | The SHA-256 hash to verify the password against |
| `salt` | `string` | ✅ | The salt used for password hashing |
| `localStorageKey` | `string` | ✅ | The localStorage key to store/retrieve the password |

#### `PasswordProtect`

The main component that provides login UI and wraps protected content.

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | ✅ | - | The content to protect |
| `title` | `string` | ❌ | `"Protected Content"` | Title shown on the password form |
| `description` | `string` | ❌ | `"Please enter the password to view this content."` | Description shown on the password form |
| `showActionMenu` | `boolean` | ❌ | `true` | Whether to show the action menu (hide/lock options) |

#### `PasswordProtectedConditionalRender`

Conditionally renders children based on authentication status.

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | ✅ | - | Content to show when authenticated |
| `fallback` | `React.ReactNode` | ❌ | `null` | Content to show when not authenticated |
| `showLoadingState` | `boolean` | ❌ | `false` | Whether to show loading spinner during auth check |

#### `usePasswordProtection` Hook

Custom hook that provides access to the password protection context.

**Returns:**

```tsx
{
  isAuthorized: boolean;           // Whether user is authenticated
  isLoading: boolean;              // Whether authentication is in progress
  error: string;                   // Current error message (if any)
  authenticate: (password: string) => Promise<boolean>; // Function to authenticate
  logout: () => void;              // Function to logout and clear storage
  temporarilyHide: () => void;     // Function to temporarily blur content
  unhide: () => void;              // Function to remove blur effect
  isTemporarilyHidden: boolean;    // Whether content is currently blurred
}
```

### Legacy Component (Backward Compatibility)

#### `PasswordProtectLegacy`

The original component with individual configuration per instance.

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `verifyHash` | `string` | ✅ | - | The SHA-256 hash to verify the password against |
| `salt` | `string` | ✅ | - | The salt used for password hashing |
| `localStorageKey` | `string` | ✅ | - | The localStorage key to store/retrieve the password |
| `children` | `React.ReactNode` | ✅ | - | The content to protect |
| `title` | `string` | ❌ | `"Protected Content"` | Title shown on the password form |
| `description` | `string` | ❌ | `"Please enter the password to view this content."` | Description shown on the password form |

## Usage Examples

### Basic Context-Based Protection

```tsx
import { PasswordProtectProvider, PasswordProtect } from '@/modules/password-protection';

const config = {
  verifyHash: "your-hash-here",
  salt: "secret-page-salt",
  localStorageKey: "secret-page-password"
};

function SecretPage() {
  return (
    <PasswordProtectProvider config={config}>
      <PasswordProtect>
        <div className="p-6">
          <h1>Secret Information</h1>
          <p>This is protected content!</p>
        </div>
      </PasswordProtect>
    </PasswordProtectProvider>
  );
}
```

### Multiple Protected Sections with Shared Authentication

```tsx
import { 
  PasswordProtectProvider, 
  PasswordProtect, 
  PasswordProtectedConditionalRender 
} from '@/modules/password-protection';

const config = {
  verifyHash: "your-hash-here",
  salt: "admin-area-salt",
  localStorageKey: "admin-area-password"
};

function AdminDashboard() {
  return (
    <PasswordProtectProvider config={config}>
      <div className="space-y-8">
        {/* Main login area */}
        <PasswordProtect title="Admin Dashboard">
          <div>
            <h1>Admin Panel</h1>
            <p>Welcome to the admin area!</p>
          </div>
        </PasswordProtect>
        
        {/* Additional sections that appear when authenticated */}
        <PasswordProtectedConditionalRender>
          <section>
            <h2>User Management</h2>
            <p>Manage users here...</p>
          </section>
        </PasswordProtectedConditionalRender>
        
        <PasswordProtectedConditionalRender>
          <section>
            <h2>System Settings</h2>
            <p>Configure system settings...</p>
          </section>
        </PasswordProtectedConditionalRender>
      </div>
    </PasswordProtectProvider>
  );
}
```

### Using the Custom Hook

```tsx
import { usePasswordProtection } from '@/modules/password-protection';

function CustomAuthComponent() {
  const { 
    isAuthorized, 
    isLoading, 
    error, 
    authenticate, 
    logout 
  } = usePasswordProtection();

  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const success = await authenticate(password);
    if (success) {
      setPassword('');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthorized) {
    return (
      <div>
        <p>✅ You are authenticated!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
      />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}
```

### Conditional Rendering with Fallback

```tsx
import { PasswordProtectedConditionalRender } from '@/modules/password-protection';

function MixedContentPage() {
  return (
    <div>
      {/* Public content */}
      <header>
        <h1>Welcome to My Site</h1>
        <p>This content is visible to everyone.</p>
      </header>

      {/* Protected content with fallback */}
      <PasswordProtectedConditionalRender 
        fallback={
          <div className="p-4 bg-gray-100 rounded">
            <p>🔒 Premium content available to authenticated users</p>
          </div>
        }
      >
        <section className="p-4 bg-green-100 rounded">
          <h2>Premium Content</h2>
          <p>This exclusive content is only visible to authenticated users!</p>
        </section>
      </PasswordProtectedConditionalRender>
    </div>
  );
}
```

## Migration Guide

### From Legacy to Context-Based Approach

**Before (Legacy):**
```tsx
import { PasswordProtectLegacy } from '@/modules/password-protection';

<PasswordProtectLegacy
  verifyHash="your-hash"
  salt="your-salt"
  localStorageKey="your-key"
  title="Protected Area"
>
  <YourContent />
</PasswordProtectLegacy>
```

**After (Context-Based):**
```tsx
import { PasswordProtectProvider, PasswordProtect } from '@/modules/password-protection';

const config = {
  verifyHash: "your-hash",
  salt: "your-salt",
  localStorageKey: "your-key"
};

<PasswordProtectProvider config={config}>
  <PasswordProtect title="Protected Area">
    <YourContent />
  </PasswordProtect>
</PasswordProtectProvider>
```

**Benefits of Migration:**
- Single configuration for multiple protected areas
- Shared authentication state
- Ability to use conditional rendering components
- Access to custom hook for advanced use cases
- Better performance with centralized state management

## Utility Functions

#### `generatePasswordHash(password: string, salt: string): Promise<string>`

Generates a SHA-256 hash of the provided password with salt protection.

```tsx
import { generatePasswordHash } from '@/modules/password-protection';

const hash = await generatePasswordHash('my-password', 'my-unique-salt');
console.log(hash); // "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
```

**Error Handling:**
- Throws an error if password is empty or not a string
- Throws an error if salt is empty or not a string
- Provides clear error messages to guide proper usage

#### `verifyPassword(password: string, hash: string, salt: string): Promise<boolean>`

Verifies a password against a hash using the provided salt.

```tsx
import { verifyPassword } from '@/modules/password-protection';

const isValid = await verifyPassword('my-password', 'hash-here', 'my-unique-salt');
console.log(isValid); // true or false
```

**Error Handling:**
- Returns `false` if any parameter is invalid (logs error to console)
- Validates all input parameters before processing
- Gracefully handles validation errors without throwing

## Console Usage

When using the password hash generator in the browser console:

```javascript
// Correct usage
window.generatePasswordHash('my-password', 'my-salt')

// This will throw an error with helpful message
window.generatePasswordHash('my-password') // Error: Both password and salt are required
```

## Salt Best Practices

### 1. **Use Unique Salts**
Each protected section should use a unique salt to maximize security:

```tsx
// Good: Different salts for different content
const adminConfig = { salt: "admin-dashboard-2024", ... };
const reportsConfig = { salt: "financial-reports-v2", ... };

// Avoid: Reusing the same salt
const config1 = { salt: "my-salt", ... };
const config2 = { salt: "my-salt", ... }; // ❌ Don't do this
```

### 2. **Salt Recommendations**
- Use descriptive, unique strings
- Include version numbers or dates if content changes
- Keep salts consistent for the same content across deployments
- Store salts securely (they can be in your source code as they're not secret)

### 3. **Example Salt Patterns**
```tsx
// By content type and version
salt: "admin-panel-v1"
salt: "user-data-2024"
salt: "financial-reports-q1-2024"

// By feature and environment
salt: "beta-features-staging"
salt: "premium-content-prod"
```

## localStorage Persistence

The system automatically handles password persistence using localStorage:

### How it works

1. **On mount**: Checks if a password is stored in localStorage using the provided `localStorageKey`
2. **Validation**: If a stored password exists, it's verified against the `verifyHash`
3. **Auto-unlock**: If the stored password is valid, the content is automatically unlocked
4. **Cleanup**: Invalid or corrupted stored passwords are automatically removed
5. **Storage**: When a user enters a correct password, it's stored in localStorage for future visits

### Clearing Stored Passwords

To manually clear a stored password, you can use the browser's developer console:

```javascript
// Clear a specific password
localStorage.removeItem('your-storage-key');

// Clear all localStorage (use with caution)
localStorage.clear();

// Or use the logout function from the hook
const { logout } = usePasswordProtection();
logout(); // Clears storage and resets state
```

## Action Menu Features

When content is unlocked, users can:

### **Hide Temporarily**
- Blurs the content with a smooth transition
- Adds interaction prevention
- Shows an overlay with "Show content" button to unhide
- Does NOT clear localStorage - password remains saved

### **Lock Content**
- Completely locks the content and returns to password prompt
- Clears the password from localStorage
- Resets all states including temporary hide state

## Security Considerations

### ⚠️ Important Security Notes

1. **Client-side only**: This is a client-side protection mechanism. The hash and protected content are still sent to the browser.

2. **Not for highly sensitive data**: This should not be used for protecting truly sensitive information that requires server-side security.

3. **Hash visibility**: The hash is visible in your source code, so anyone with access to the code can potentially brute-force the password.

4. **Use cases**: Best suited for:
   - Protecting content from casual viewing
   - Adding a simple access layer to internal tools
   - Hiding content that's not meant for general audiences
   - Creating "members-only" sections with shared passwords
   - Protecting development/staging environments

### Best Practices

1. **Use strong passwords**: Choose passwords that are difficult to guess
2. **Rotate passwords**: Change passwords periodically
3. **Limit scope**: Only protect content that doesn't require high security
4. **Consider alternatives**: For truly sensitive data, use proper server-side authentication
5. **Use unique salts**: Different salts for different protected areas
6. **Monitor access**: Consider adding logging for authentication attempts

## Styling and Customization

The components use Shadcn UI components and can be customized through:

1. **CSS classes**: The components respect your Tailwind CSS theme
2. **Theme variables**: Uses CSS custom properties for colors
3. **Component props**: Customize title and description text
4. **Custom components**: Use the hook to build completely custom UI

### Custom Styling Example

```tsx
<div className="my-custom-container">
  <PasswordProtect 
    title="🔐 Secure Area"
    description="This area contains confidential information."
    showActionMenu={false} // Hide action menu if desired
  >
    <div className="custom-protected-content">
      {/* Your content */}
    </div>
  </PasswordProtect>
</div>
```

## Troubleshooting

### Common Issues

1. **Hash not working**: Make sure you're using the exact hash generated by `window.generatePasswordHash()`
2. **Import errors**: Ensure you're importing from `@/modules/password-protection`
3. **Console function not available**: The `window.generatePasswordHash` function is only available in the browser
4. **Context errors**: Make sure components are wrapped in `PasswordProtectProvider`
5. **Hook errors**: `usePasswordProtection` must be used within a `PasswordProtectProvider`

### Debug Mode

You can enable debug logging by opening the browser console and checking for any error messages during password verification.

## Browser Compatibility

This module uses the Web Crypto API, which is supported in:
- Chrome 37+
- Firefox 34+
- Safari 7+
- Edge 12+

## Contributing

When contributing to this module:

1. Maintain TypeScript types
2. Follow the existing code style
3. Test in multiple browsers
4. Update this README if adding new features
5. Ensure backward compatibility

## License

This module is part of the larger project and follows the same license terms. 