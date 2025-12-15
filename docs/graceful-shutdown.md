# Graceful Shutdown Guide

## Problem

When running multiple development servers in a monorepo, child processes may not be properly terminated when you stop the parent process. This leads to:

- Orphaned processes consuming resources
- Port conflicts on restart
- Memory leaks over time

## Prerequisites

- **Nx 21+** (required for continuous tasks)
- **pnpm** (or other workspace-aware package manager)
- Multiple dev servers in separate projects

Check your Nx version:
```bash
nx --version
```

## Solution: Nx Continuous Tasks

Nx 21 introduced continuous tasks, a native feature that properly manages long-running processes with:
- ✅ Automatic signal forwarding to child processes
- ✅ Task dependency ordering (start dependencies before dependents)
- ✅ Clean shutdown when interrupted (Ctrl+C)
- ✅ Terminal UI for organized log viewing
- ✅ Zero additional dependencies

## Implementation

### Step 1: Mark long-running tasks as continuous

Add `"continuous": true` to any task that runs indefinitely (dev servers, watch tasks, etc).

**services/backend/project.json**:
```json
{
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm dev",
        "cwd": "services/backend"
      },
      "continuous": true
    }
  }
}
```

### Step 2: Configure task dependencies

If a task depends on other services being ready, declare the dependency. The dependent task will not start until its dependencies are running.

**apps/webapp/project.json**:
```json
{
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm dev",
        "cwd": "apps/webapp"
      },
      "continuous": true,
      "dependsOn": [
        {
          "projects": ["@workspace/backend"],
          "target": "dev"
        }
      ]
    }
  }
}
```

Key points:
- List dependencies in `dependsOn` array
- Use full project name: `@workspace/backend`
- Reference the target name: `"target": "dev"`
- Nx will start these before the dependent task

### Step 3: Simplify root dev script

Update your root `package.json` to run the main project (which will pull in dependencies):

```json
{
  "scripts": {
    "dev": "nx run @workspace/webapp:dev"
  }
}
```

Nx automatically:
1. Starts backend:dev first (because webapp:dev depends on it)
2. Waits for backend to be running (continuous task)
3. Starts webapp:dev
4. Handles cleanup when you press Ctrl+C

### Step 4: Verify

Test that processes are properly cleaned up:

```bash
# Terminal 1: Start dev servers
pnpm run dev

# Terminal 2: Check running processes
ps aux | grep -E "(node|next|convex)" | grep -v grep

# Terminal 1: Stop with Ctrl+C

# Terminal 2: Verify all processes are gone
ps aux | grep -E "(node|next|convex)" | grep -v grep
```

The second check should return no processes.

## Using the Terminal UI

Nx 21 includes a new Terminal UI for managing multiple concurrent tasks:

- **Arrow keys or h/j/k/l** - Navigate between tasks
- **?** - Show keyboard shortcuts
- **q** - Quit and exit all tasks

The UI displays:
- Running tasks on the left
- Selected task's logs on the right

(Terminal UI is disabled on Windows in initial Nx 21 release)

## Multiple Dependencies

If a task depends on multiple services:

```json
{
  "targets": {
    "e2e": {
      "executor": "nx:run-commands",
      "options": { "command": "playwright test" },
      "continuous": true,
      "dependsOn": [
        {
          "projects": ["@workspace/webapp"],
          "target": "serve"
        },
        {
          "projects": ["@workspace/backend"],
          "target": "dev"
        }
      ]
    }
  }
}
```

Both services will start before e2e tests run.

## Troubleshooting

### Processes still running after Ctrl+C?

1. Verify continuous flag is set:
   ```bash
   nx show project @workspace/backend
   ```

2. Check for process group issues:
   ```bash
   pstree -p <parent_pid>
   ```

### Port conflicts on restart?

Kill processes on specific ports:
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

## References

- [Nx 21 Release: Continuous Tasks](https://nx.dev/blog/nx-21-release)
- [Nx Task Pipeline Configuration](https://nx.dev/concepts/task-pipeline-configuration)
- [Node.js Process Signals](https://nodejs.org/api/process.html#process_signal_events)
