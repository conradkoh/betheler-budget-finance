# Code Quality Check

## Purpose

Run comprehensive code quality checks to verify that typechecks, lints, and tests all pass before committing changes or deploying.

## Process

When executing this command, run the following checks in order:

### 1. Typecheck

Run typechecking to verify TypeScript compilation succeeds:

```bash
pnpm run typecheck
```

**Expected outcome**: No TypeScript errors or type mismatches.

### 2. Lint

Run linting to verify code follows project style guidelines:

```bash
pnpm run lint
```

**Expected outcome**: No linting errors or warnings.

### 3. Tests

Run the test suite to verify all tests pass:

```bash
pnpm run test
```

**Expected outcome**: All tests pass without failures.

## Verification

After running all checks:

- ✅ **All checks pass**: Code is ready for commit or deployment
- ❌ **Any check fails**: Fix reported issues before proceeding

## Usage

Execute this command whenever you need to verify code quality:
- Before committing changes
- After making code modifications
- Before creating pull requests
- After merging branches
- As part of a pre-deployment verification


---
<!-- Ignore section if arguments are not replaced -->
<userinput>
$ARGUMENTS
</userinput>
