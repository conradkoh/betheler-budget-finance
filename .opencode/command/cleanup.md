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

1. **Readability First**: Code must tell a story from top to bottom
2. **Intentional Organization**: Most important elements must be immediately visible
3. **Clear Boundaries**: Internal vs. external APIs must be obvious
4. **Self-Documenting**: Functions and interfaces must explain their purpose

## File Cleanup Steps (Apply to Each File)

**For each file identified in step 1, follow these 6 steps in order:**

### Step 1: Add Comprehensive TSDoc Documentation

**Action**: Add comprehensive TSDoc documentation to all exported and internal elements.

**What to do:**

- **Functions**: Add TSDoc comments with `@param`, `@returns`, and `@example` where appropriate
- **Interfaces & Types**: Document purpose and all properties with meaningful descriptions
- **Constants**: Explain purpose and usage context
- **Components**: Include usage examples for complex public APIs
- Use present tense ("Creates", "Validates", "Displays")
- Note: Internal functions should already have `_` prefix (see Step 2)

**Functions:**

```typescript
/**
 * Creates a new user account with the provided information.
 * @param userData - The user data required for account creation
 * @returns Promise resolving to the new user ID
 */
export async function createUser(userData: CreateUserRequest): Promise<string> {
  // Implementation
}

/**
 * Validates email format using regex pattern.
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
function _validateEmail(email: string): boolean {
  // Implementation
}
```

**Interfaces & Types:**

````typescript
/**
 * Configuration for user profile display and editing capabilities.
 * Used by UserProfile component to control rendering and interaction behavior.
 *
 * @example
 * ```typescript
 * const props: UserProfileProps = {
 *   userId: '123',
 *   editable: true,
 *   onSave: (data) => console.log('Saved:', data)
 * };
 * ```
 */
export interface UserProfileProps {
  /** Unique identifier of the user to display */
  userId: string;
  /** Whether the profile can be edited by the current user */
  editable?: boolean;
  /** Callback fired when profile data is saved */
  onSave?: (data: UserData) => void;
}

/**
 * Available user roles in the system with different permission levels.
 */
export type UserRole = "admin" | "user" | "guest";
````

**Constants:**

```typescript
/**
 * Default timeout duration for API requests in milliseconds.
 * Used across the application for consistent timeout behavior.
 */
export const DEFAULT_API_TIMEOUT = 5000;
```

### Step 2: Prefix Internal Elements with Underscore

**Action**: Add `_` prefix to all non-exported functions, interfaces, types, and constants.

**What to do:**

- Scan through the file for any function, interface, type, or constant that is NOT exported
- Add `_` prefix to the name
- Update all references to use the new prefixed name

```typescript
// Functions
function _validateInput(input: string): boolean {}

// Interfaces and Types
interface _UserState {}
type _ValidationResult = {};

// Constants
const _DEFAULT_TIMEOUT = 5000;
```

### Step 3: Eliminate All `any` Types

**Action**: Replace every instance of `any` with proper types.

**What to do:**

- Search for all occurrences of `any` in the file
- Replace with specific interfaces, types, or `unknown` with type guards
- Use proper React event types and Convex context types

```typescript
// ❌ Replace this
function processData(data: any): any {}

// ✅ With this
interface DataItem {
  id: string;
  value: number;
}
function processData(data: DataItem[]): number[] {}

// ✅ Use proper event types
function handleClick(event: React.MouseEvent<HTMLButtonElement>) {}

// ✅ Use proper Convex context types
import { type MutationCtx, type QueryCtx } from "./_generated/server";
```

### Step 4: Reorganize File Structure

**Action**: Rearrange the entire file contents in this exact order.

**What to do:**

1. Move all imports to the top (external libraries first, then internal imports)
2. Move all exported interfaces and types to the top (after imports)
3. Move all internal interfaces and types (prefixed with `_`) next
4. Move all exported functions/components next
5. Move all internal helper functions to the bottom

Note: comments containing rules should be omitted from the final output

```typescript
// 1. Rule: Imports (external first, then internal)
import React from "react";
import { api } from "@/convex/_generated/api";

// 2. Rule: Public interfaces and types
export interface UserProfileProps {}
export type UserRole = "admin" | "user" | "guest";

// 3. Rule: Internal interfaces and types (prefixed with _)
interface _UserState {}
type _ValidationResult = {};

// 4. Rule: Main exported functions/components
export function UserProfile({ userId }: UserProfileProps) {}
export async function createUser(
  userData: CreateUserRequest
): Promise<string> {}

// 5. Internal helper functions (at bottom)
function _validateUserData(userData: CreateUserRequest): _ValidationResult {}
function _formatDisplayName(firstName: string, lastName: string): string {}
```

### Step 5: Apply React Performance Optimizations

**Action**: Add `useCallback` and `useMemo` where appropriate.

**What to do:**

- Wrap functions passed as props in `useCallback`
- Wrap functions used as dependencies in other hooks in `useCallback`
- Wrap expensive calculations in `useMemo`
- **Do NOT** wrap primitive values or simple operations

```typescript
// ✅ Use useCallback for functions passed as props
const handleUserClick = useCallback((userId: string) => {
  setSelectedId(userId);
}, []);

// ✅ Use useMemo for expensive calculations
const analytics = useMemo(() => {
  return users.reduce((acc, user) => {
    // Complex calculation
  }, {});
}, [users, filter]);

// ❌ Don't memoize these
const displayName = `${user.firstName} ${user.lastName}`; // String - no useMemo
const isAdult = user.age >= 18; // Boolean - no useMemo
const count = users.length; // Number - no useMemo
```

### Step 6: Final Quality Check

**Action**: Verify the file meets all quality standards.

**Checklist for each file:**

**General Structure:**

- [ ] All exports have comprehensive TSDoc documentation (functions, interfaces, types, constants)
- [ ] Interface properties have individual property documentation
- [ ] Complex APIs include usage examples with `@example`
- [ ] All non-exported items are prefixed with `_`
- [ ] File follows the exact organization structure (imports → public types → internal types → exported functions → internal functions)

**TypeScript Quality:**

- [ ] Zero usage of `any` type anywhere in the file
- [ ] All React event handlers use proper event types
- [ ] All Convex functions use `QueryCtx`/`MutationCtx` types
- [ ] All function parameters and return types are explicitly typed

**React Performance:**

- [ ] Functions passed as props are wrapped in `useCallback`
- [ ] Functions used as hook dependencies are wrapped in `useCallback`
- [ ] Expensive calculations are wrapped in `useMemo`
- [ ] Simple values (strings, booleans, numbers) are NOT memoized

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

### After Cleanup (Following All 6 Steps)

````typescript
// 1. Imports
import React, { useCallback } from "react";

// 2. Public interfaces
/**
 * Props for the UserForm component handling user registration.
 * @example
 * ```typescript
 * <UserForm onSubmit={(data) => console.log('Form submitted:', data)} />
 * ```
 */
export interface UserFormProps {
  /** Callback fired when the form is successfully submitted */
  onSubmit: (data: FormData) => void;
}

// 3. Internal types
interface _FormData {
  email: string;
  name: string;
}

// 4. Exported components
/**
 * User registration form with validation and submission handling.
 */
export function UserForm({ onSubmit }: UserFormProps) {
  /**
   * Handles form submission with email validation.
   */
  const handleSubmit = useCallback(
    (data: _FormData) => {
      if (_validateEmail(data.email)) {
        onSubmit(data);
      }
    },
    [onSubmit]
  );

  return <form onSubmit={handleSubmit}>...</form>;
}

// 5. Internal helper functions
/**
 * Validates email format using regex pattern.
 */
function _validateEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}
````

## Usage Instructions

**Execute the main 3-step process:**

1. **Run git status command** to list all modified TypeScript/JavaScript files
2. **Create todo tasks** - one task per file that needs cleanup
3. **Process each file systematically**:
   - Work through cleanup steps 1-6 in exact order for each file
   - Complete the checklist in Step 6 before moving to the next file
   - Mark the todo task as complete
   - Repeat until all files are processed

This systematic approach ensures no files are missed and all code meets consistent quality standards.

---
<!-- Ignore section if arguments are not replaced -->
<userinput>
$ARGUMENTS
</userinput>
