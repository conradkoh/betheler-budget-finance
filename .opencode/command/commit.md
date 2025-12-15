# Commit and Release Process

## Overview

This command guides the process of committing code changes and optionally releasing them through push or pull request.

## RFC 2119 Terminology

This document uses RFC 2119 terminology:

- **MUST**: Absolute requirement
- **MUST NOT**: Absolute prohibition
- **SHOULD**: Recommended, but valid reasons may exist to ignore
- **SHOULD NOT**: Not recommended, but valid reasons may exist to proceed
- **MAY**: Optional, left to implementer discretion

## Process Flow

### Phase 1: Pre-Commit Cleanup (REQUIRED)

**You MUST execute the cleanup process before proceeding with the commit.**

1. You MUST follow all instructions specified in `.ai/commands/cleanup.md`
2. You MUST complete all cleanup tasks before proceeding to Phase 2
3. You MUST NOT skip any files identified during the cleanup process

### Phase 2: Validation (REQUIRED)

**You MUST validate the codebase is in pristine condition before committing.**

#### Discovery Phase (REQUIRED)

**You MUST first discover what validation tools and scripts are available in the codebase.**

1. You MUST examine the codebase to identify available validation mechanisms:
   - Check `package.json` for scripts related to: `typecheck`, `test`, `lint`, `build`
   - Identify the testing framework (vitest, jest, bun:test, or none)
   - Identify the linting tool (eslint, biome, or none)
   - Check for monorepo tools (nx, turborepo, pnpm workspaces, npm workspaces)
   
2. You MUST NOT assume validation tools exist
3. You MUST NOT execute validation commands that are not configured in the project

#### Type Checking

**Execute ONLY if TypeScript is present in the project.**

1. You MUST verify TypeScript is configured (check for `tsconfig.json`)
2. If TypeScript exists, you MUST run type checking
3. You MUST resolve all type errors before proceeding
4. You SHOULD use available package.json scripts or appropriate commands:

```bash
# Examples (adapt to your codebase):
npm run typecheck          # If script exists
pnpm typecheck             # If using pnpm
npx nx run-many -t typecheck  # If using Nx
npx turbo typecheck        # If using Turborepo
npx tsc --noEmit           # Direct TypeScript check
```

#### Testing

**Execute ONLY if tests are configured in the project.**

1. You MUST verify tests exist in the codebase
2. You MUST identify the testing framework in use (vitest, jest, bun:test, etc.)
3. If tests exist, you MUST run all tests
4. You MUST ensure all tests pass before proceeding
5. You SHOULD use available package.json scripts or appropriate commands:

```bash
# Examples (adapt to your codebase):
npm test                   # If script exists
pnpm test                  # If using pnpm
npx nx run-many -t test    # If using Nx
npx turbo test             # If using Turborepo
npx vitest run             # If using Vitest
npx jest                   # If using Jest
bun test                   # If using Bun
```

#### Linting

**Execute ONLY if linting is configured in the project.**

1. You MUST verify linting is configured (check for eslint config, biome.json, etc.)
2. You MUST identify the linting tool in use (eslint, biome, etc.)
3. If linting exists, you MUST run linting
4. You MUST resolve all linting errors before proceeding
5. You SHOULD use available package.json scripts or appropriate commands:

```bash
# Examples (adapt to your codebase):
npm run lint               # If script exists
pnpm lint                  # If using pnpm
npx nx run-many -t lint    # If using Nx
npx turbo lint             # If using Turborepo
npx eslint .               # If using ESLint
npx biome check .          # If using Biome
```

#### Build Verification (OPTIONAL)

**Execute if a build step is critical for validation.**

1. You MAY run a build step if it's important for validation
2. You SHOULD only do this if explicitly configured or requested
3. Examples:

```bash
# Examples (adapt to your codebase):
npm run build              # If script exists
pnpm build                 # If using pnpm
npx nx run-many -t build   # If using Nx
npx turbo build            # If using Turborepo
```

#### Validation Failures

- If ANY validation step fails, you MUST fix the issues before proceeding
- You MAY need to repeat Phase 1 (cleanup) after fixing validation failures
- You MUST re-run all validation steps after making fixes

### Phase 3: Commit (REQUIRED)

**You MUST create a commit with all staged and relevant changes.**

#### Commit Message Guidelines

1. You MUST write a clear, concise commit message that:
   - Focuses on the "why" rather than the "what"
   - Uses imperative mood (e.g., "Add feature" not "Added feature")
   - Is 1-2 sentences maximum for the subject line
   - Accurately reflects the nature of changes (add, update, fix, refactor, etc.)
   
2. You MUST NOT use generic messages like "Update files" or "Fix issues"

3. You SHOULD review recent commit history to match the repository's commit style:

```bash
git log --oneline -10
```

#### Staging and Committing

1. You MUST stage all relevant files for the commit
2. You MUST NOT stage files unrelated to the current change
3. You MUST use the following git workflow:

```bash
# Review current status
git status

# Stage relevant files
git add <files>

# Create commit
git commit -m "Your commit message"

# Verify commit succeeded
git status
```

#### Pre-Commit Hook Handling

**Pre-commit hooks MAY modify files during the commit process.**

1. If the commit fails due to pre-commit hook changes:
   - You MAY retry the commit ONCE to include automated changes
   - If it fails again, you MUST investigate the pre-commit hook requirements
   
2. If the commit succeeds but pre-commit hooks modified files:
   - You MUST amend the commit to include the hook modifications:
   
   ```bash
   git add <modified-files>
   git commit --amend --no-edit
   ```

3. You MUST verify the final commit includes all changes:

```bash
git status
git show HEAD
```

### Phase 4: Release (CONDITIONAL)

**This phase is OPTIONAL and MUST only be executed if explicitly requested by the user.**

#### Case A: Push to Remote

**Execute this case when the user explicitly requests to push changes.**

1. You MUST verify the current branch tracks a remote branch:

```bash
git status
```

2. You MUST push changes using appropriate flags:

```bash
# Standard push for existing tracking branch
git push

# Push new branch with upstream tracking
git push -u origin <branch-name>

# Force push (ONLY if explicitly requested and necessary)
git push --force-with-lease
```

3. You SHOULD verify the push succeeded:

```bash
git status
```

#### Case B: Raise Pull Request

**Execute this case when the user explicitly requests to create a PR.**

##### Pre-PR Analysis (REQUIRED)

1. You MUST gather the following information in parallel:

```bash
# Check current status
git status

# View staged and unstaged changes
git diff

# Check branch tracking status
git status -sb

# Get all commits since divergence from main
git log main..HEAD

# View all changes since divergence
git diff main...HEAD
```

2. You MUST analyze ALL commits (not just the latest) that will be included in the PR

3. You MUST draft a PR summary that:
   - Is 1-3 bullet points maximum
   - Focuses on the "why" rather than the "what"
   - Uses clear, concise, non-generic language
   - Accurately reflects the changes (add, update, fix, refactor, etc.)
   - Summarizes the purpose and impact of the changes

##### PR Creation (REQUIRED)

1. You MUST ensure changes are pushed to remote before creating PR:

```bash
# Push if needed
git push -u origin <branch-name>
```

2. You MUST create the PR using the `gh` CLI with proper formatting:

```bash
gh pr create --title "Clear, descriptive PR title" --body "$(cat <<'EOF'
## Summary
- First key point about the changes and their purpose
- Second key point about the impact or motivation
- Third key point if necessary
EOF
)"
```

3. You MUST return the PR URL to the user upon successful creation

##### PR Formatting Requirements

- The PR title MUST be clear and descriptive
- The PR body MUST include a "Summary" section
- The summary MUST be 1-3 concise bullet points
- Each bullet point SHOULD focus on purpose and impact
- You MUST NOT include generic descriptions

## Important Constraints

### Git Configuration

- You MUST NOT update git config at any point
- You MUST NOT use interactive git commands (e.g., `git rebase -i`, `git add -i`)

### Empty Commits

- You MUST NOT create empty commits
- If there are no changes to commit, you SHOULD inform the user and exit

### Remote Operations

- You MUST NOT push to remote unless explicitly requested by the user
- You MUST NOT create PRs unless explicitly requested by the user

## Complete Example Flow

### Example 1: Commit Only

```
User: "Commit my changes"

Assistant actions:
1. Execute cleanup process from .ai/commands/cleanup.md
2. Examine package.json to identify available validation scripts
3. Run type checking (if TypeScript configured): npm run typecheck
4. Run tests (if tests exist): npm test
5. Run linting (if linting configured): npm run lint
6. Stage relevant files: git add <files>
7. Create commit: git commit -m "Add user authentication flow"
8. Verify: git status
```

### Example 2: Commit and Push

```
User: "Commit and push my changes"

Assistant actions:
1. Execute cleanup process from .ai/commands/cleanup.md
2. Discover and run all available validation steps
3. Stage and commit changes
4. Push to remote: git push (or git push -u origin <branch> for new branches)
5. Verify: git status
```

### Example 3: Commit and Create PR

```
User: "Commit and create a PR"

Assistant actions:
1. Execute cleanup process from .ai/commands/cleanup.md
2. Discover and run all available validation steps
3. Stage and commit changes
4. Gather PR analysis data (git status, git log, git diff main...HEAD)
5. Draft PR summary based on all commits since main
6. Push to remote: git push -u origin feature-branch
7. Create PR: gh pr create --title "..." --body "..."
8. Return PR URL to user
```

## Success Criteria

A successful execution MUST meet all of the following criteria:

- [ ] All cleanup tasks from `.ai/commands/cleanup.md` completed
- [ ] Type checking passes with zero errors
- [ ] All tests pass
- [ ] Linting passes with zero errors
- [ ] Commit created with meaningful message
- [ ] Pre-commit hooks satisfied (no blocking failures)
- [ ] If push requested: changes successfully pushed to remote
- [ ] If PR requested: PR created and URL returned to user

---
<!-- Ignore section if arguments are not replaced -->
<userinput>
$ARGUMENTS
</userinput>
