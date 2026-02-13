# Code Quality Cleanup Routine

## Main Process

**Follow this 3-step process to systematically clean up all modified files:**

### 1. List All New and Modified Files

Run this command to identify files that need cleanup:

```bash
git status --porcelain | grep -E '\.(ts|tsx|js|jsx)$' | awk '{print $2}'
```

### 2. Create Tasks for Each File

Create a todo list with one task per file that needs to be cleaned up. Mark each task as you complete it.

### 3. Apply Code Improvements to Each File

For each file, work through the 6 cleanup steps below until all files are complete.

---

## Core Principles

1. **Readability First**: Code MUST tell a story from top to bottom
2. **Intentional Organization**: Most important elements MUST be immediately visible
3. **Clear Boundaries**: Internal vs. external APIs MUST be obvious through TSDoc annotations
4. **Self-Documenting**: Functions and interfaces MUST explain their purpose
5. **Type Safety**: The `any` type MUST NOT be used - all code MUST use proper TypeScript types

## File Cleanup Steps (Apply to Each File)

**For each file identified in step 1, you MUST follow these 5 steps in order:**

### Step 1: Add Comprehensive TSDoc Documentation

**Action**: You MUST add comprehensive TSDoc documentation to all elements using proper TSDoc tags.

**Requirements:**

- **Public Functions**: MUST use `@public` tag with `@param`, `@returns`, and SHOULD include `@throws` and `@example` where applicable
- **Internal Functions**: MUST use `@internal` tag to mark as private API
- **Interfaces & Types**: MUST document purpose and all properties with meaningful descriptions
- **Constants**: MUST use `@public` or `@internal` tags appropriately
- **Components**: SHOULD include usage examples with `@example` for complex public APIs
- Documentation MUST use present tense ("Creates", "Validates", "Displays")
- Deprecated APIs MUST be marked with `@deprecated` tag

**Public Functions:**

```typescript
/**
 * Creates a new user account with the provided information.
 * Validates the email format and checks for duplicate accounts before creation.
 *
 * @public
 * @param userData - The user data required for account creation
 * @returns Promise resolving to the newly created user ID
 * @throws {ValidationError} When email format is invalid
 * @throws {DuplicateUserError} When user with email already exists
 *
 * @example
 * const userId = await createUser({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   role: 'user'
 * });
 */
export async function createUser(userData: CreateUserRequest): Promise<string> {
  // Implementation
}
```

**Internal Functions:**

```typescript
/**
 * Validates email format using RFC 5322 compliant regex pattern.
 *
 * @internal
 * @param email - Email address to validate
 * @returns True if email format is valid, false otherwise
 */
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Formats user's full name from first and last name components.
 * Handles missing values gracefully by returning available parts.
 *
 * @internal
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Formatted full name string
 */
function formatDisplayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}
```

**Interfaces & Types:**

```typescript
/**
 * Configuration for user profile display and editing capabilities.
 * Controls rendering behavior and interaction handling in the UserProfile component.
 *
 * @public
 *
 * @example
 * const props: UserProfileProps = {
 *   userId: '123',
 *   editable: true,
 *   onSave: (data) => console.log('Saved:', data),
 *   onError: (error) => console.error('Error:', error)
 * };
 */
export interface UserProfileProps {
  /** Unique identifier of the user to display */
  userId: string;

  /** Whether the profile can be edited by the current user. Defaults to false. */
  editable?: boolean;

  /** Callback fired when profile data is successfully saved */
  onSave?: (data: UserData) => void;

  /** Callback fired when an error occurs during save operation */
  onError?: (error: Error) => void;
}

/**
 * Available user roles in the system with different permission levels.
 * - admin: Full system access including user management
 * - user: Standard user access to own data
 * - guest: Read-only access to public content
 *
 * @public
 */
export type UserRole = "admin" | "user" | "guest";

/**
 * Internal state for managing user profile form data.
 *
 * @internal
 */
interface UserFormState {
  /** Whether the form is currently submitting */
  isSubmitting: boolean;

  /** Current form validation errors */
  errors: Record<string, string>;

  /** Whether the form has unsaved changes */
  isDirty: boolean;
}
```

**Constants:**

```typescript
/**
 * Default timeout duration for API requests in milliseconds.
 * Used across the application for consistent timeout behavior.
 * Requests exceeding this duration will be automatically cancelled.
 *
 * @public
 */
export const DEFAULT_API_TIMEOUT = 5000;

/**
 * Maximum number of retry attempts for failed API requests.
 *
 * @internal
 */
const MAX_RETRY_ATTEMPTS = 3;
```

### Step 2: Eliminate All `any` Types

**Action**: You MUST replace every instance of `any` with proper types.

**Requirements:**

- You MUST search for all occurrences of `any` in the file
- You MUST replace with specific interfaces, types, or `unknown` with type guards
- You MUST use proper React event types (e.g., `React.MouseEvent<HTMLButtonElement>`)
- You MUST use proper Convex context types (e.g., `QueryCtx`, `MutationCtx`)

```typescript
// ❌ MUST NOT use any
function processData(data: any): any {}

// ✅ MUST use specific types
interface DataItem {
  id: string;
  value: number;
}
function processData(data: DataItem[]): number[] {}

// ✅ MUST use proper React event types
function handleClick(event: React.MouseEvent<HTMLButtonElement>) {}

// ✅ MUST use proper Convex context types
import { type MutationCtx, type QueryCtx } from "./_generated/server";
```

### Step 3: Reorganize File Structure

**Action**: You MUST rearrange the entire file contents in this exact order for optimal readability.

**Requirements:**

1. Imports MUST be at the top (external libraries first, then internal imports)
2. Exported interfaces and types MUST follow imports
3. Internal interfaces and types (marked with `@internal`) MUST follow exported types
4. Exported functions/components MUST follow all type definitions
5. Internal helper functions (marked with `@internal`) MUST be at the bottom of the file

**Properly Organized File:**

```typescript
import React, { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Configuration for user profile display and editing capabilities.
 * @public
 */
export interface UserProfileProps {
  /** Unique identifier of the user to display */
  userId: string;
  /** Whether the profile can be edited by the current user */
  editable?: boolean;
}

/**
 * Available user roles in the system with different permission levels.
 * @public
 */
export type UserRole = "admin" | "user" | "guest";

/**
 * Internal state for managing user profile form data.
 * @internal
 */
interface UserFormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
}

/**
 * Result of user data validation.
 * @internal
 */
type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * Displays and manages user profile information with edit capabilities.
 * @public
 */
export function UserProfile({ userId, editable }: UserProfileProps) {
  const [state, setState] = useState<UserFormState>({
    isSubmitting: false,
    errors: {},
  });

  // Implementation
}

/**
 * Creates a new user account with the provided information.
 * @public
 */
export async function createUser(userData: CreateUserRequest): Promise<string> {
  const validation = validateUserData(userData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }
  // Implementation
}

/**
 * Validates user data before account creation.
 * @internal
 */
function validateUserData(userData: CreateUserRequest): ValidationResult {
  const errors: string[] = [];

  if (!validateEmail(userData.email)) {
    errors.push("Invalid email format");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format using RFC 5322 compliant regex.
 * @internal
 */
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Formats user's full name from first and last name components.
 * @internal
 */
function formatDisplayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}
```

### Step 4: Apply React Performance Optimizations

**Action**: You MUST add `useCallback` and `useMemo` where appropriate.

**Requirements:**

- Functions passed as props MUST be wrapped in `useCallback`
- Functions used as dependencies in other hooks MUST be wrapped in `useCallback`
- Expensive calculations SHOULD be wrapped in `useMemo`
- Primitive values (strings, booleans, numbers) MUST NOT be memoized
- Simple operations (string concatenation, basic arithmetic) MUST NOT be memoized

```typescript
// ✅ MUST wrap functions passed as props
const handleUserClick = useCallback((userId: string) => {
  setSelectedId(userId);
}, []);

// ✅ SHOULD wrap expensive calculations
const analytics = useMemo(() => {
  return users.reduce((acc, user) => {
    // Complex calculation
  }, {});
}, [users, filter]);

// ❌ MUST NOT memoize primitive values or simple operations
const displayName = `${user.firstName} ${user.lastName}`; // Simple string concatenation
const isAdult = user.age >= 18; // Simple boolean comparison
const count = users.length; // Simple property access
```

### Step 5: Final Quality Check

**Action**: You MUST verify the file meets all quality standards before proceeding.

**Checklist for each file (all items MUST be satisfied):**

**General Structure:**

- [ ] All exports MUST have comprehensive TSDoc documentation with `@public` tag
- [ ] All internal elements MUST be marked with `@internal` tag
- [ ] Interface properties MUST have individual property documentation
- [ ] Complex APIs SHOULD include usage examples with `@example`
- [ ] Functions MUST document parameters with `@param` and return values with `@returns`
- [ ] Functions that throw errors MUST document them with `@throws`
- [ ] File MUST follow the exact organization structure (imports → public types → internal types → exported functions → internal functions)

**TypeScript Quality:**

- [ ] The `any` type MUST NOT appear anywhere in the file
- [ ] All React event handlers MUST use proper event types (e.g., `React.MouseEvent<T>`)
- [ ] All Convex functions MUST use `QueryCtx`/`MutationCtx` types
- [ ] All function parameters and return types MUST be explicitly typed

**React Performance:**

- [ ] Functions passed as props MUST be wrapped in `useCallback`
- [ ] Functions used as hook dependencies MUST be wrapped in `useCallback`
- [ ] Expensive calculations SHOULD be wrapped in `useMemo`
- [ ] Simple values (strings, booleans, numbers) MUST NOT be memoized

## Complete Example: Before and After

### Before Cleanup

```typescript
import React from "react";

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export function UserForm({ onSubmit }: UserFormProps) {
  const handleSubmit = (data: any) => {
    if (validateEmail(data.email)) {
      onSubmit(data);
    }
  };
  return <form onSubmit={handleSubmit}>...</form>;
}

interface UserFormProps {
  onSubmit: (data: FormData) => void;
}
```

### After Cleanup (Following All 5 Steps)

```typescript
import React, { useCallback, useState } from "react";

/**
 * Props for the UserForm component handling user registration.
 * Provides callbacks for form submission and error handling.
 *
 * @public
 *
 * @example
 * <UserForm
 *   onSubmit={(data) => console.log('Form submitted:', data)}
 *   onError={(error) => console.error('Validation failed:', error)}
 * />
 */
export interface UserFormProps {
  /** Callback fired when the form is successfully submitted with valid data */
  onSubmit: (data: FormData) => void;

  /** Callback fired when form validation fails */
  onError?: (error: Error) => void;
}

/**
 * Form data structure for user registration.
 * Contains all required fields for creating a new user account.
 *
 * @internal
 */
interface FormData {
  /** User's email address (must be valid format) */
  email: string;

  /** User's full name */
  name: string;
}

/**
 * User registration form with email validation and submission handling.
 * Validates email format before allowing submission and provides error feedback.
 *
 * @public
 *
 * @param props - Component props
 * @returns Rendered form component
 */
export function UserForm({ onSubmit, onError }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (data: FormData) => {
      if (!validateEmail(data.email)) {
        const error = new Error("Invalid email format");
        onError?.(error);
        return;
      }

      setIsSubmitting(true);
      try {
        onSubmit(data);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onError]
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

/**
 * Validates email format using RFC 5322 compliant regex pattern.
 * Checks for basic email structure: local@domain.tld
 *
 * @internal
 *
 * @param email - Email address to validate
 * @returns True if email format is valid, false otherwise
 */
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## Usage Instructions

**You MUST execute the main 3-step process:**

1. **Run git status command** to list all modified TypeScript/JavaScript files
2. **Create todo tasks** - You MUST create one task per file that needs cleanup
3. **Process each file systematically**:
   - You MUST work through cleanup steps 1-5 in exact order for each file
   - You MUST complete the checklist in Step 5 before moving to the next file
   - You MUST mark the todo task as complete after verification
   - You MUST repeat until all files are processed

This systematic approach ensures no files are missed and all code meets consistent quality standards.

## RFC 2119 Key Words

This document uses RFC 2119 terminology:

- **MUST** / **MUST NOT**: Absolute requirement
- **SHOULD** / **SHOULD NOT**: Recommended but not required
- **MAY**: Optional

---
<!-- Ignore section if arguments are not replaced -->
<userinput>
$ARGUMENTS
</userinput>
