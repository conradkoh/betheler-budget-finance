# Testing Guide

This project uses [Vitest](https://vitest.dev/) for testing across both frontend and backend. This guide covers conventions, best practices, and examples for writing tests in this codebase.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Overview

### Testing Stack

- **Framework**: [Vitest](https://vitest.dev/) v4.0.6
- **Frontend**: React Testing Library, jsdom
- **Backend**: convex-test (for Convex function testing)
- **Test Runner**: NX (monorepo task runner)

### Test File Naming Conventions

- **Frontend**: Use `.test.tsx` or `.spec.tsx` extension
  - Place test files next to the component/utility being tested
  - Example: `button.tsx` → `button.test.tsx`
  
- **Backend**: Use `.spec.ts` extension
  - Place test files in the same directory as the module being tested
  - Example: `convex/auth.ts` → `convex/auth.spec.ts`

## Running Tests

### Run All Tests

```bash
# Run all tests (webapp + backend)
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Run Tests for Specific Projects

```bash
# Frontend tests only
cd apps/webapp && pnpm test
cd apps/webapp && pnpm test:watch

# Backend tests only
cd services/backend && pnpm test
cd services/backend && pnpm test:watch
```

### Run Tests with UI

```bash
# Frontend tests with Vitest UI
cd apps/webapp && pnpm test:ui
```

## Frontend Testing

### Setup

Frontend tests are configured in `apps/webapp/vitest.config.ts`:
- **Environment**: jsdom (simulates browser DOM)
- **Test Utilities**: Available in `apps/webapp/src/test-utils.tsx`
- **Path Aliases**: `@/*` resolves to `apps/webapp/src/*`

### Test Structure

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ComponentName } from './component-name';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<ComponentName onClick={handleClick} />);
    const button = screen.getByRole('button');
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Conventions

1. **Use React Testing Library queries in priority order**:
   - `getByRole` (preferred - most accessible)
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`
   - `getByTestId` (last resort)

2. **Test user-facing behavior**, not implementation details:
   - ✅ Test what users see and interact with
   - ❌ Don't test internal state or component structure

3. **Use `userEvent` for interactions**:
   - Prefer `userEvent` over `fireEvent` for more realistic user interactions
   - Always use `await` with `userEvent` methods

4. **Use `vi.fn()` for mocks**:
   - Vitest globals are enabled, so `vi` is available without import
   - Mock functions with `vi.fn()` or `vi.spyOn()`

5. **Test accessibility**:
   - Use semantic queries (`getByRole`, `getByLabelText`)
   - Verify ARIA attributes when testing complex components

### Example: Testing a Button Component

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    let button = screen.getByRole('button', { name: /delete/i });
    expect(button).toBeInTheDocument();

    rerender(<Button variant="outline">Cancel</Button>);
    button = screen.getByRole('button', { name: /cancel/i });
    expect(button).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Next.js Components

#### Testing Client Components

Client components (`'use client'`) can be tested normally with React Testing Library.

#### Testing Server Components

Server components require special handling. Consider:
- Testing the rendered output
- Testing client components that use server component data
- Using integration tests for full page flows

#### Mocking Next.js Router

For components that use `useRouter` from `next/navigation`:

```tsx
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/current-path',
  useSearchParams: () => new URLSearchParams(),
}));
```

#### Mocking Convex Hooks

For components using Convex hooks:

```tsx
import { vi } from 'vitest';

vi.mock('convex-helpers/react/sessions', () => ({
  useSessionQuery: vi.fn(() => ({ data: mockData })),
  useSessionMutation: vi.fn(() => vi.fn()),
  useSessionAction: vi.fn(() => vi.fn()),
}));
```

## Backend Testing

### Setup

Backend tests are configured in `services/backend/vitest.config.mts`:
- **Environment**: edge-runtime (matches Convex runtime)
- **Test Helper**: `t` exported from `services/backend/test.setup.ts`
- **Schema**: Automatically loaded from `convex/schema.ts`

### Test Structure

```ts
import { expect, test } from 'vitest';
import { t } from '../test.setup';
import { api } from './_generated/api';

test('functionName', async () => {
  // Arrange: Set up test data
  const sessionId = '123' as SessionId;
  
  // Act: Call the function
  const result = await t.mutation(api.module.functionName, { sessionId, arg: 'value' });
  
  // Assert: Verify the result
  expect(result).toBeDefined();
  expect(result.success).toBe(true);
});
```

### Conventions

1. **Use the `t` helper for all Convex operations**:
   - `t.query(api.module.queryName, args)` - Test queries
   - `t.mutation(api.module.mutationName, args)` - Test mutations
   - `t.action(api.module.actionName, args)` - Test actions

2. **Test files should match module structure**:
   - `convex/auth.ts` → `convex/auth.spec.ts`
   - Keep tests close to the code they test

3. **Use descriptive test names**:
   - Start with the function name being tested
   - Describe the scenario: `'loginAnon - creates new user when session is new'`

4. **Follow Arrange-Act-Assert pattern**:
   - Arrange: Set up test data and session state
   - Act: Call the function being tested
   - Assert: Verify the expected outcome

5. **Test authentication state**:
   - Many functions require `SessionIdArg`
   - Create sessions with `t.mutation(api.auth.loginAnon, { sessionId })`

### Example: Testing Authentication

```ts
import type { SessionId } from 'convex-helpers/server/sessions';
import { expect, test } from 'vitest';
import { t } from '../test.setup';
import { api } from './_generated/api';

test('loginAnon - creates new user when session is new', async () => {
  // Arrange
  const sessionId = 'test-session-123' as SessionId;
  
  // Act
  const login = await t.mutation(api.auth.loginAnon, { sessionId });
  
  // Assert
  expect(login.success).toBe(true);
  expect(login.userId).toBeDefined();
});

test('getState - returns authenticated state after login', async () => {
  // Arrange
  const sessionId = 'test-session-456' as SessionId;
  const login = await t.mutation(api.auth.loginAnon, { sessionId });
  const userId = login.userId;
  
  // Act
  const loginState = await t.query(api.auth.getState, { sessionId });
  
  // Assert
  expect(loginState.state).toBe('authenticated');
  if (loginState.state === 'authenticated') {
    expect(loginState.user._id).toBe(userId);
  }
});
```

### Testing Error Cases

```ts
test('functionName - throws error when validation fails', async () => {
  const sessionId = 'test-session' as SessionId;
  
  await expect(
    t.mutation(api.module.functionName, { sessionId, invalidArg: null })
  ).rejects.toThrow();
});
```

## Best Practices

### General

1. **Write tests before or alongside code** (TDD/BDD)
2. **Keep tests simple and focused** - one concept per test
3. **Use descriptive test names** that explain what is being tested
4. **Test behavior, not implementation** - tests should survive refactoring
5. **Keep tests fast** - prefer unit tests over integration tests when possible

### Frontend Specific

1. **Test user interactions**, not component internals
2. **Use accessibility-first queries** (`getByRole`, `getByLabelText`)
3. **Test error states and edge cases**
4. **Mock external dependencies** (API calls, router, etc.)
5. **Clean up after tests** (handled automatically by `vitest.setup.ts`)

### Backend Specific

1. **Test business logic**, not Convex framework code
2. **Test with realistic data** - use proper types and valid values
3. **Test error handling** - verify functions fail gracefully
4. **Test authentication and authorization** - verify access control
5. **Isolate tests** - each test should be independent

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use nested `describe` blocks** for complex components/modules
3. **Order tests logically** - happy path first, then edge cases
4. **Keep test files focused** - one file per component/module

## Common Patterns

### Frontend: Testing Form Submission

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={onSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

### Frontend: Testing Async Operations

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('DataLoader', () => {
  it('displays loading state, then data', async () => {
    const fetchData = vi.fn(() => Promise.resolve({ data: 'test' }));
    
    render(<DataLoader fetchData={fetchData} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });
    
    expect(fetchData).toHaveBeenCalledTimes(1);
  });
});
```

### Backend: Testing with Session State

```ts
import type { SessionId } from 'convex-helpers/server/sessions';
import { expect, test } from 'vitest';
import { t } from '../test.setup';
import { api } from './_generated/api';

test('userCanAccessResource - allows access for authenticated user', async () => {
  // Setup: Create authenticated session
  const sessionId = 'session-123' as SessionId;
  await t.mutation(api.auth.loginAnon, { sessionId });
  
  // Test: Verify access
  const result = await t.query(api.resources.getResource, { sessionId, resourceId: '123' });
  expect(result).toBeDefined();
});

test('userCanAccessResource - denies access for unauthenticated user', async () => {
  const sessionId = 'unauthenticated-session' as SessionId;
  
  await expect(
    t.query(api.resources.getResource, { sessionId, resourceId: '123' })
  ).rejects.toThrow();
});
```

### Backend: Testing Mutations with Side Effects

```ts
test('createItem - creates item and updates related data', async () => {
  const sessionId = 'session-123' as SessionId;
  await t.mutation(api.auth.loginAnon, { sessionId });
  
  // Create item
  const item = await t.mutation(api.items.create, {
    sessionId,
    name: 'Test Item',
  });
  
  expect(item._id).toBeDefined();
  
  // Verify related data was updated
  const list = await t.query(api.items.list, { sessionId });
  expect(list).toContainEqual(expect.objectContaining({ name: 'Test Item' }));
});
```

## Troubleshooting

### Frontend Tests

**Issue**: Tests fail with "window is not defined"
- **Solution**: Ensure `jsdom` environment is configured in `vitest.config.ts`

**Issue**: CSS imports cause errors
- **Solution**: `css: true` is already set in config. For Tailwind, ensure classes are properly processed.

**Issue**: Next.js router not working in tests
- **Solution**: Mock `next/navigation` as shown in the examples above

### Backend Tests

**Issue**: "convex-test module not found"
- **Solution**: Ensure `convex-test` is in `devDependencies` and modules are properly globbed in `test.setup.ts`

**Issue**: Schema changes not reflected in tests
- **Solution**: Restart test watcher - schema is loaded at startup

**Issue**: Tests fail with authentication errors
- **Solution**: Ensure you're creating a session with `t.mutation(api.auth.loginAnon, { sessionId })` before testing authenticated functions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Convex Testing Guide](https://docs.convex.dev/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

