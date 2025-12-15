# Convex 1.31.0 Upgrade Guide

This guide provides step-by-step instructions for upgrading your codebase to use the new Convex 1.31.0 API changes.

## Overview

Starting from Convex 1.31.0, the `db.get`, `db.patch`, `db.replace`, and `db.delete` functions now require the table name as the first argument. This change:

- ✅ Makes the API more consistent and symmetric
- ✅ Improves security by explicitly specifying the table
- ✅ Prepares for future support of custom document IDs (BYO-ID)

## Will This Break My Code?

**No, your existing code will continue to work.** The old APIs are still supported for backward compatibility, but they will be deprecated in the future. It's recommended to migrate your code proactively.

## Migration Methods

### Option 1: Automatic Migration with ESLint (Recommended)

The best way to update is using the Convex ESLint plugin, which also helps enforce Convex best practices.

#### Step 1: Install/Update the ESLint Plugin

If you haven't installed it yet, follow the instructions at [docs.convex.dev/eslint](https://docs.convex.dev/eslint).

If already installed, update to version 1.1.0 or later:

```bash
pnpm update @convex-dev/eslint-plugin
```

#### Step 2: Run the Auto-Fix

```bash
npx eslint . --fix
```

This will automatically add the missing table name arguments throughout your codebase.

### Option 2: Standalone Codemod Tool

If you can't use ESLint, use the standalone codemod tool:

```bash
npx @convex-dev/codemod@latest explicit-ids
```

### Option 3: Manual Migration

Follow the before/after examples below to manually update your code.

## API Changes: Before & After

### 1. `db.get()` - Fetching a Document

**❌ Old API (without table name):**

```typescript
const record = await ctx.db.get(args.recordId);
```

**✅ New API (with table name):**

```typescript
const record = await ctx.db.get("attendanceRecords", args.recordId);
```

#### Real Example from Our Codebase

```81:84:services/backend/convex/attendance.ts
// Get the record to check permissions
const record = await ctx.db.get(args.recordId);
if (!record) {
  throw new ConvexError('Attendance record not found');
```

**Should become:**

```typescript
// Get the record to check permissions
const record = await ctx.db.get("attendanceRecords", args.recordId);
if (!record) {
  throw new ConvexError("Attendance record not found");
}
```

### 2. `db.delete()` - Deleting a Document

**❌ Old API (without table name):**

```typescript
await ctx.db.delete(record._id);
```

**✅ New API (with table name):**

```typescript
await ctx.db.delete("attendanceRecords", record._id);
```

#### Real Example from Our Codebase

```50:50:services/backend/convex/attendance.ts
await Promise.all(existingRecords.map((record) => ctx.db.delete(record._id)));
```

**Should become:**

```typescript
await Promise.all(
  existingRecords.map((record) =>
    ctx.db.delete("attendanceRecords", record._id)
  )
);
```

Another example:

```97:97:services/backend/convex/attendance.ts
await ctx.db.delete(args.recordId);
```

**Should become:**

```typescript
await ctx.db.delete("attendanceRecords", args.recordId);
```

### 3. `db.patch()` - Partially Updating a Document

**❌ Old API (without table name):**

```typescript
await ctx.db.patch(args.itemId, updateData);
```

**✅ New API (with table name):**

```typescript
await ctx.db.patch("checklistItems", args.itemId, updateData);
```

#### Real Example from Our Codebase

```177:177:services/backend/convex/checklists.ts
return await ctx.db.patch(args.itemId, updateData);
```

**Should become:**

```typescript
return await ctx.db.patch("checklistItems", args.itemId, updateData);
```

Another example with nested object updates:

```513:515:services/backend/convex/auth/google.ts
await ctx.db.patch(user._id, {
  google: undefined,
});
```

**Should become:**

```typescript
await ctx.db.patch("users", user._id, {
  google: undefined,
});
```

### 4. `db.replace()` - Fully Replacing a Document

**❌ Old API (without table name):**

```typescript
await ctx.db.replace(id, {
  author: "Nicolas",
  message: "New message",
});
```

**✅ New API (with table name):**

```typescript
await ctx.db.replace("messages", id, {
  author: "Nicolas",
  message: "New message",
});
```

## Migration Checklist

Use this checklist to ensure you've covered all the changes:

- [ ] Update `convex` package to version 1.31.0 or later
- [ ] Update `convex-helpers` to version 0.1.107 or later (if using row-level security)
- [ ] Update `convex-test` to version 0.0.39 or later (if using for testing)
- [ ] Run ESLint auto-fix or codemod tool
- [ ] Search for remaining instances of:
  - [ ] `ctx.db.get(` - should have 2 arguments
  - [ ] `ctx.db.delete(` - should have 2 arguments
  - [ ] `ctx.db.patch(` - should have 3 arguments
  - [ ] `ctx.db.replace(` - should have 3 arguments
- [ ] Run TypeScript type checking: `pnpm typecheck`
- [ ] Run tests to ensure everything works: `pnpm test`

## Common Patterns in Our Codebase

### Pattern 1: Delete in Array.map()

```typescript
// Before
await Promise.all(records.map((record) => ctx.db.delete(record._id)));

// After
await Promise.all(
  records.map((record) => ctx.db.delete("attendanceRecords", record._id))
);
```

### Pattern 2: Get Then Patch

```typescript
// Before
const item = await ctx.db.get(args.itemId);
if (!item) throw new Error("Not found");
await ctx.db.patch(args.itemId, updateData);

// After
const item = await ctx.db.get("checklistItems", args.itemId);
if (!item) throw new Error("Not found");
await ctx.db.patch("checklistItems", args.itemId, updateData);
```

### Pattern 3: Get Then Delete

```typescript
// Before
const record = await ctx.db.get(args.recordId);
if (!record) throw new Error("Not found");
await ctx.db.delete(args.recordId);

// After
const record = await ctx.db.get("attendanceRecords", args.recordId);
if (!record) throw new Error("Not found");
await ctx.db.delete("attendanceRecords", args.recordId);
```

## Troubleshooting

### Type Errors After Migration

If you encounter type errors after running the migration tools, it's usually because:

1. **Union types**: Your ID type is a union (e.g., `Id<"users" | "admins">`). You'll need to refactor to disambiguate the types.

2. **Any types**: Your types aren't precise enough. The tools emit warnings like:

   ```
   Sorry, we can't infer the table type of `row._id` (which is a `any`)
   ```

   Solution: Add proper type annotations to your variables.

3. **Custom GenericDatabaseReader/Writer**: If you have custom implementations, update them to support the new method signatures.

### Migration Tool Limitations

Both ESLint and the codemod tool use TypeScript types to determine table names. If your types aren't precise enough, you'll need to manually add the table names where the tools couldn't infer them.

## Why This Change?

### 1. Consistency

All `ctx.db` APIs now follow a consistent pattern with the table name as the first argument.

### 2. Security

The new APIs are more secure when using `v.string()` instead of `v.id("tablename")` for validation. Previously, an attacker could pass an `Id<"someOtherTable">` when your code expected `Id<"someTable">`.

### 3. Future-Proofing

This change prepares for the upcoming "Bring Your Own ID" (BYO-ID) feature, which will allow you to:

- Migrate data from other databases with existing IDs
- Generate IDs optimistically on clients for offline-first apps

With custom IDs, the Convex ID encoding won't contain table information, so the API needs to explicitly specify the table name.

## Additional Resources

- [Official Convex Blog Post](https://news.convex.dev/db-table-name/)
- [Convex ESLint Plugin Documentation](https://docs.convex.dev/eslint)
- [Convex Documentation](https://docs.convex.dev)

## Questions?

If you encounter issues during migration, please:

1. Check the TypeScript types are correct
2. Review the troubleshooting section above
3. Open an issue on the [Convex GitHub repository](https://github.com/get-convex/convex-js)
