# Code Review

## Purpose

Review code changes to ensure quality, safety, and maintainability before merging or deploying.

## RFC 2119 Terminology

This document uses RFC 2119 terminology:

- **MUST**: Absolute requirement
- **MUST NOT**: Absolute prohibition
- **SHOULD**: Recommended, but valid reasons may exist to ignore
- **SHOULD NOT**: Not recommended, but valid reasons may exist to proceed
- **MAY**: Optional, left to implementer discretion

## Process Flow

### Phase 1: Identify Commits to Review (REQUIRED)

**You MUST determine which commits need reviewing based on your current branch state.**

#### Determine Current Branch Type

Run these commands in parallel to understand your branch state:

```bash
# Check current branch and status
git status -sb

# Get the default branch name
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'

# Check if we're on the default branch
git branch --show-current
```

#### Case 1: Feature Branch with Commits Pushed

**Execute this case when you are NOT on the default branch and your commits are pushed to remote.**

1. **Fetch default branch:**

```bash
# Get the default branch name (e.g., main, master)
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')

# Fetch the latest commits from default branch
git fetch origin $DEFAULT_BRANCH
```

2. **Get list of commits to review:**

```bash
# List commits that will be included in the review
git log $DEFAULT_BRANCH..HEAD --oneline

# Show the diff of changes
git diff $DEFAULT_BRANCH...HEAD
```

3. **Review Scope:** The commits to review are ALL commits between the feature branch and the default branch.

#### Case 2: Default Branch with Unpushed Commits

**Execute this case when you ARE on the default branch (main/master) and have unpushed commits.**

1. **Get list of unpushed commits:**

```bash
# List commits that have not yet been pushed to origin
git log @{u}..HEAD --oneline

# Show the diff of unpushed changes
git diff @{u}..HEAD
```

2. **Review Scope:** The commits to review are ALL commits that have not been pushed to origin.

### Phase 2: Analyze Changes (REQUIRED)

**You MUST analyze the code changes deeply to understand their impact.**

#### Perform Analysis in Parallel

You MUST run these commands in parallel to gather comprehensive information:

```bash
# View detailed diff with context
git diff --no-color <branch-diff-spec>

# View statistics of changes
git diff --stat <branch-diff-spec>

# View commit messages for context
git log <branch-diff-spec> --pretty=format:"%h - %s%n%b" --no-merges

# View the affected files
git diff --name-only <branch-diff-spec>
```

Replace `<branch-diff-spec>` with:
- `$DEFAULT_BRANCH...HEAD` for Case 1 (feature branch)
- `@{u}..HEAD` for Case 2 (default branch unpushed)

#### Deep Understanding Checklist

For each file changed, you MUST understand:

1. **Purpose of the change** - Why was this change made?
2. **Impact scope** - Which parts of the codebase are affected?
3. **Breaking changes** - Does this change any public APIs?
4. **Side effects** - Are there unintended consequences?
5. **Edge cases** - How does this handle unusual inputs or states?

### Phase 3: Generate Review Report (REQUIRED)

**You MUST generate a comprehensive report covering all review aspects.**

## Review Aspects

The review report MUST cover the following aspects in order:

### 1. Type Safety Review

**Review Criteria:**

- No use of `any` type without justification
- No force unwrapping of possibly null values (e.g., `!`, `as any`)
- Proper use of TypeScript utility types (`Partial`, `Pick`, `Omit`, etc.)
- Correct typing of function parameters and return values
- Proper handling of optional/nullable types
- Type guards used correctly for narrowing types

**What to Flag:**

- ❌ **Critical**: Use of `any` type
- ❌ **Critical**: Force unwrapping without null checks
- ❌ **Critical**: Missing type annotations in complex logic
- ⚠️ **Warning**: Overly complex type definitions that could be simplified
- ⚠️ **Warning**: Implicit `any` in complex nested structures

**Report Format:**

```markdown
### Type Safety Review

**Status:** ✅ PASS / ❌ FAIL / ⚠️ WARNING

**Findings:**

#### Critical Issues
- **File:** `path/to/file.ts`
  - **Issue:** Using `any` type for user data
  - **Location:** Line 42
  - **Recommendation:** Define a proper interface for user data structure
  - **Code:**
    ```typescript
    // ❌ Current
    function processUser(data: any) { ... }

    // ✅ Recommended
    interface UserData {
      id: string;
      name: string;
      email: string;
    }
    function processUser(data: UserData) { ... }
    ```

#### Warnings
- **File:** `path/to/file.ts`
  - **Issue:** Complex type definition could be simplified
  - **Location:** Line 87
  - **Recommendation:** Extract to a named type alias
```

### 2. Design Patterns Review

**Review Criteria:**

- Adherence to codebase conventions and patterns
- Consistent architectural patterns (e.g., proper separation of concerns)
- Appropriate use of design patterns for the problem context
- Consistency with existing code style and patterns
- Proper abstraction levels

**What to Check:**

- Are existing patterns followed (e.g., hooks pattern, repository pattern, etc.)?
- Is the code structure consistent with the rest of the codebase?
- Are design patterns used appropriately, not forced?
- Is there unnecessary abstraction?
- Is the code overly complex for its purpose?

**Report Format:**

```markdown
### Design Patterns Review

**Status:** ✅ PASS / ❌ FAIL / ⚠️ WARNING

**Findings:**

#### Consistency Issues
- **File:** `path/to/file.ts`
  - **Issue:** Inconsistent with existing data fetching pattern
  - **Location:** Function `fetchData` (Line 23)
  - **Observation:** Other files use custom hooks for data fetching
  - **Recommendation:** Create a `useData` hook to follow established pattern
  - **Context:** See `hooks/useData.ts` for reference implementation

#### Architectural Concerns
- **File:** `path/to/file.tsx`
  - **Issue:** Component mixing business logic with UI rendering
  - **Location:** Lines 15-45
  - **Recommendation:** Extract business logic to a separate service or hook
  - **Reason:** Improves testability and reusability
```

### 3. Maintainability Review

**Review Criteria:**

- Readable and understandable code structure
- Reasonable function and component size
- Clear naming conventions
- Proper code organization and modularity
- Easy to extend in the future

**What to Check:**

- Are functions doing one thing and doing it well?
- Is there excessive nesting or complexity?
- Are variable and function names descriptive?
- Is code DRY (Don't Repeat Yourself)?
- Is it easy to understand what the code does without extensive comments?

**Report Format:**

```markdown
### Maintainability Review

**Status:** ✅ PASS / ❌ FAIL / ⚠️ WARNING

**Findings:**

#### Readability Issues
- **File:** `path/to/file.ts`
  - **Issue:** Function too long and doing multiple things
  - **Location:** `processOrder` (Lines 50-120)
  - **Observation:** Function handles validation, processing, and notification
  - **Recommendation:** Split into smaller functions:
    - `validateOrder()`
    - `processOrder()`
    - `sendOrderNotification()`
  - **Impact:** Makes each function testable and easier to understand

#### Code Duplication
- **File:** `path/to/file.ts` and `path/to/other.ts`
  - **Issue:** Duplicate date formatting logic
  - **Location:** Both files contain identical `formatDate()` function
  - **Recommendation:** Extract to shared utility file
  - **Target location:** `utils/date.ts`

#### Complexity Concerns
- **File:** `path/to/file.tsx`
  - **Issue:** Deeply nested ternary operators (5 levels)
  - **Location:** Lines 78-92
  - **Recommendation:** Refactor to early returns or separate component
  - **Impact:** Reduces cognitive load when reading code
```

### 4. Documentation Review

**Review Criteria:**

- Functions documented with clear comments
- Usage examples provided for complex APIs
- JSDoc/TSDoc comments for public APIs
- Explanations for non-obvious logic
- Inline comments for complex algorithms

**What to Check:**

- Are exported functions/components documented?
- Are parameters and return types documented?
- Are complex algorithms explained?
- Are usage examples provided for public APIs?
- Is there documentation for edge cases or constraints?

**Report Format:**

```markdown
### Documentation Review

**Status:** ✅ PASS / ❌ FAIL / ⚠️ WARNING

**Findings:**

#### Missing Documentation
- **File:** `path/to/file.ts`
  - **Issue:** Exported function lacks JSDoc
  - **Location:** `calculateDiscount` (Line 15)
  - **Recommendation:** Add comprehensive JSDoc with parameters and return type
  - **Example:**
    ```typescript
    /**
     * Calculates discount amount based on user tier and order value.
     * Applies tier-based percentage discount to the order total.
     *
     * @param orderValue - Total order value before discount
     * @param userTier - User's membership tier (bronze, silver, gold, platinum)
     * @returns Discount amount to be subtracted from order total
     * @throws {Error} When userTier is invalid
     *
     * @example
     * ```typescript
     * const discount = calculateDiscount(100, 'gold'); // Returns 10
     * ```
     */
    export function calculateDiscount(orderValue: number, userTier: string): number
    ```

#### Missing Examples
- **File:** `path/to/file.tsx`
  - **Issue:** Complex component lacks usage examples
  - **Location:** `DataGrid` component (Line 1)
  - **Recommendation:** Add JSDoc with usage examples showing different configurations
  - **Examples needed:** Pagination, sorting, and filtering scenarios

#### Complex Logic Not Explained
- **File:** `path/to/file.ts`
  - **Issue:** Complex regex pattern not explained
  - **Location:** Line 67
  - **Recommendation:** Add comment explaining what the regex pattern matches and why
```

## Final Report Structure

Your final review report MUST follow this structure:

```markdown
# Code Review Report

**Review Date:** YYYY-MM-DD
**Reviewer:** [Your Name]
**Branch/Commit:** [Branch name or commit range]
**Files Changed:** X files, Y insertions(+), Z deletions(-)

---

## Executive Summary

**Overall Status:** ✅ APPROVED / ❌ NEEDS CHANGES / ⚠️ APPROVED WITH COMMENTS

**Summary:** 2-3 sentences summarizing the overall quality of the changes.

---

## Detailed Findings

### Type Safety Review
[Findings from Type Safety Review section]

### Design Patterns Review
[Findings from Design Patterns Review section]

### Maintainability Review
[Findings from Maintainability Review section]

### Documentation Review
[Findings from Documentation Review section]

---

## Action Items

### Must Fix Before Merge
1. [ ] Fix type safety critical issue in `path/to/file.ts:42`
2. [ ] Add missing documentation for `export function` in `path/to/file.ts:15`

### Recommended Improvements
1. [ ] Refactor large function in `path/to/file.ts` for better maintainability
2. [ ] Extract duplicate code to shared utility

### Optional Enhancements
1. [ ] Add usage examples for `DataGrid` component
2. [ ] Simplify complex type definitions

---

## Positive Highlights

*Call out well-implemented features or good practices:*

- Excellent use of TypeScript generics in `api.ts`
- Clean component separation in `UserProfile.tsx`
- Comprehensive error handling in `auth.ts`

---

## Reviewer Comments

[Any additional context, suggestions, or observations]
```

## Important Constraints

- You MUST NOT review files you haven't actually read and understood
- You MUST provide specific code examples for every issue found
- You MUST explain WHY something is an issue, not just WHAT is wrong
- You MUST balance criticism with recognition of good practices
- You MUST consider the context of the change - is it a quick fix or major feature?

## Example Review Flow

```
User: "Review my changes"

Assistant actions:
1. Determine branch type with git commands
2. Get list of commits to review (Case 1 or Case 2)
3. Run parallel analysis commands to gather diff, stats, and commit messages
4. Read affected files to understand changes deeply
5. Analyze changes against review criteria (type safety, design patterns, maintainability, documentation)
6. Generate comprehensive review report following the structure above
7. Present report with clear action items and code examples
```

## Success Criteria

A successful review MUST meet all of these criteria:

- [ ] Correct commits identified for review
- [ ] All changed files analyzed thoroughly
- [ ] All four review aspects covered (type safety, design patterns, maintainability, documentation)
- [ ] Specific code examples provided for issues
- [ ] Clear, actionable recommendations given
- [ ] Report follows the required structure
- [ ] Overall status clearly stated (Approved, Needs Changes, or Approved with Comments)
