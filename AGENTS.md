***

description: Development guide for the Next.js + Convex monorepo
globs: "\*\*"
alwaysApply: true
-----------------

# Development Guidelines

A quick reference for working with the Next.js + Convex monorepo.

***

## Architecture

* **apps/webapp** — Next.js frontend application
* **services/backend** — Convex backend

***

## Frontend (apps/webapp)

### Dark Mode — Critical for All Components

Use semantic colors that adapt to both light and dark modes:

| Purpose | Preferred | Avoid |
|---------|-----------|-------|
| Primary text | `text-foreground` | `text-black` |
| Secondary text | `text-muted-foreground` | `text-gray-600` |
| Card background | `bg-card` | `bg-white` |
| Hover states | `hover:bg-accent/50` | `hover:bg-gray-50` |
| Borders | `border-border` | `border-gray-200` |

**Brand/Status colors must include dark variants:**

```tsx
// Good
bg-red-50 dark:bg-red-950/20
text-red-600 dark:text-red-400

// Bad - single mode only
bg-red-50  // white text on light red in dark mode
```

**Testing**: Verify components in light mode, dark mode, and system mode.

### UI Components & Icons

* **Components**: ShadCN UI
* **Icons**: @radix-ui/react-icons, lucide-react, react-icons

**Add a new ShadCN component:**

```bash
cd apps/webapp && npx shadcn@latest add <component-name>
```

### Next.js App Router

The `params` prop is a Promise — must await it:

```tsx
export default async function MyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

### Authentication (Frontend)

Use session-aware hooks from convex-helpers:

```tsx
import { useSessionQuery, useSessionMutation } from "convex-helpers/react/sessions";

const data = useSessionQuery(api.my.query);
const mutate = useSessionMutation(api.my.mutation);
```

***

## Backend (services/backend)

### Authentication

All authenticated Convex functions require `SessionIdArg`:

```ts
import { SessionIdArg } from "convex-helpers/server/sessions";

export const myQuery = query({
  args: { ...SessionIdArg, /* other args */ },
  handler: async (ctx, args) => {
    // Authenticated
  },
});
```

### Feature Flags

Configured in `services/backend/config/featureFlags.ts`.

When adding flags:

* Use safe defaults (off/false)
* Keep reads centralized and typed
* Plan migration path for removal

***

## Core Principles

### Code Approach

**Size of changes**: For complex work, prefer incremental changes or create new code and migrate. Large migrations need a plan — verify as you go.

**Performance**: Use indexes for large volume lookups or ordered columns. In Convex, computations run in the DB — n+1 queries are often fine.

**Naming**: Function names should match their actions. Mutations: `create`, `write`, `update`. Queries: `get`, `list`, `fetch`. No mutations in "get" methods.

### DAFT Abstraction Principles

* **Dimensionality**: High-dimension problems (UI layer) can't be solved by abstraction alone
* **Atomicity**: One responsibility per abstraction
* **Friction**: Good defaults with few props beat many mandatory props
* **Testing**: Simple functions are easier to test than complex classes

***

## Common Tasks

### Running the Project

```bash
# Start dev server
pnpm dev

# Run initial setup
pnpm setup
```

### Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

### Type Checking & Linting

```bash
# Type check both apps
pnpm typecheck

# Lint with fixes
pnpm lint:fix

# Format code
pnpm format:fix
```

### Nx Commands

```bash
# Run a target on specific project
nx run @workspace/webapp:dev
nx run @workspace/backend:typecheck

# Run many targets
nx run-many --target=test --projects=@workspace/webapp,@workspace/backend
```

***

## Project Structure

```
next-convex-starter-app/
├── apps/webapp/           # Next.js frontend
├── services/backend/      # Convex backend
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```
