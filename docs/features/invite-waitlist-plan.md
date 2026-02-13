# Invite and Waitlist Feature - Implementation Plan

## Overview

This document outlines the implementation plan for the **Invite and Waitlist** feature. The system provides flexible user access control with two primary modes:

1. **Invite Mode** (default) - Users can only join via invite links from existing users or admins
2. **Waitlist Mode** - Self-registration with limited access until promoted by an admin

### Goals

- Provide controlled access to the system while allowing self-registration
- Enable role-based permissions for granular access control
- Track invite metrics (sender, acceptance rate)
- Allow users to view their role and permissions in their profile

---

## Database Schema

### New User Type: `waitlist`

Add a new user type variant to the existing `users` table union:

```typescript
v.object({
  type: v.literal('waitlist'),
  name: v.string(),
  email: v.string(),
  createdAt: v.number(),
  // Minimal information, no recoveryCode or full access until promoted
});
```

### New Tables

#### `invites` Table

Stores invite links created by users/admins.

| Field                 | Type                                                | Description                                           |
| --------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| `code`                | `string`                                            | Unique invite code                                    |
| `createdBy`           | `Id<'users'>`                                       | User who created the invite                           |
| `createdAt`           | `number`                                            | Creation timestamp                                    |
| `expiresAt`           | `number`                                            | Expiration timestamp (default: 60 days)               |
| `maxUses`             | `number?`                                           | Optional limit on uses                                |
| `useCount`            | `number`                                            | Current use count                                     |
| `assignedRole`        | `string`                                            | Role to assign on acceptance (e.g., 'user', 'editor') |
| `assignedPermissions` | `Permission[]?`                                     | Optional custom permission overrides                  |
| `status`              | `'active' \| 'expired' \| 'exhausted' \| 'revoked'` | Invite status                                         |

**Indexes:** `by_code`, `by_createdBy`, `by_status`

#### `inviteAcceptances` Table

Tracks who accepted which invites.

| Field        | Type            | Description                  |
| ------------ | --------------- | ---------------------------- |
| `inviteId`   | `Id<'invites'>` | The invite that was accepted |
| `userId`     | `Id<'users'>`   | User who accepted            |
| `acceptedAt` | `number`        | Acceptance timestamp         |

**Indexes:** `by_inviteId`, `by_userId`

#### `roles` Table

Defines roles and their permissions.

| Field         | Type           | Description                                 |
| ------------- | -------------- | ------------------------------------------- |
| `name`        | `string`       | Role name (e.g., 'user', 'editor', 'admin') |
| `description` | `string?`      | Optional description                        |
| `isSystem`    | `boolean`      | System roles cannot be deleted              |
| `permissions` | `Permission[]` | Array of module/action permissions          |
| `createdAt`   | `number`       | Creation timestamp                          |
| `createdBy`   | `Id<'users'>?` | User who created (null for system roles)    |

**Indexes:** `by_name`

#### `modules` Table

Reference table for available modules and their actions.

| Field         | Type       | Description                               |
| ------------- | ---------- | ----------------------------------------- |
| `name`        | `string`   | Module identifier (e.g., 'presentations') |
| `displayName` | `string`   | Human-readable name                       |
| `description` | `string?`  | Optional description                      |
| `actions`     | `Action[]` | Available actions for this module         |

**Indexes:** `by_name`

### User Table Modifications

Add to all user types (`full`, `anonymous`, `waitlist`):

```typescript
role: v.optional(v.string()),          // Role name reference
customPermissions: v.optional(         // Override permissions
  v.array(v.object({
    module: v.string(),
    actions: v.array(v.string()),
  }))
),
invitedBy: v.optional(v.id('users')),  // Track invite source
```

### Permission Type

```typescript
type Permission = {
  module: string; // Module identifier
  actions: string[]; // Allowed actions
};
```

---

## Feature Flags

### Updated Configuration

```typescript
// services/backend/config/featureFlags.ts

export const featureFlags = {
  disableLogin: false,

  // Access control configuration
  accessControl: {
    // Mode: 'invite_only' | 'waitlist' | 'open'
    mode: 'invite_only' as const,

    // Waitlist settings (when mode === 'waitlist')
    waitlist: {
      enabled: false,
      autoPromoteAfter: null as number | null, // Auto-promote after N days (future)
    },

    // Invite settings (when mode === 'invite_only')
    invite: {
      enabled: true,
      defaultExpiryDays: 60,
      defaultRole: 'user',
      allowUserInvites: true, // Can non-admins create invites?
      maxInvitesPerUser: null as number | null, // Optional limit
    },
  },
};
```

### Mode Behaviors

| Mode          | Registration         | Access                             |
| ------------- | -------------------- | ---------------------------------- |
| `invite_only` | Via invite link only | Full access based on assigned role |
| `waitlist`    | Self-registration    | Limited until promoted             |
| `open`        | Anyone can register  | Full access based on default role  |

---

## Backend Implementation

### New Convex Files

```
services/backend/convex/
├── waitlist.ts       # Waitlist management
├── invites.ts        # Invite CRUD and acceptance
├── roles.ts          # Role management
├── permissions.ts    # Permission checking
└── modules.ts        # Module registry
```

### `convex/waitlist.ts`

| Function            | Type     | Description                                       |
| ------------------- | -------- | ------------------------------------------------- |
| `joinWaitlist`      | mutation | Self-registration for waitlist (email, name)      |
| `batchPromoteUsers` | action   | Promote waitlist users to full users (idempotent) |
| `listWaitlistUsers` | query    | List all waitlist users (admin only)              |

**`batchPromoteUsers` Specification:**

- Calls internal mutation to change user type from `waitlist` to `full`
- Assigns default role on promotion
- Idempotent: skips already-promoted users
- Extensible for future email notifications (add comments, no implementation needed now)

### `convex/invites.ts`

| Function          | Type     | Description                                      |
| ----------------- | -------- | ------------------------------------------------ |
| `createInvite`    | mutation | Create new invite with optional role/permissions |
| `acceptInvite`    | mutation | Accept invite and create user account            |
| `listMyInvites`   | query    | List invites created by current user             |
| `revokeInvite`    | mutation | Revoke an invite                                 |
| `listAllInvites`  | query    | List all invites (admin only)                    |
| `getInviteStats`  | query    | Get acceptance rate for a user's invites         |
| `getInviteByCode` | query    | Get invite details by code (public)              |

### `convex/roles.ts`

| Function        | Type     | Description                          |
| --------------- | -------- | ------------------------------------ |
| `listRoles`     | query    | List all roles                       |
| `createRole`    | mutation | Create custom role (admin only)      |
| `updateRole`    | mutation | Update role permissions (admin only) |
| `deleteRole`    | mutation | Delete non-system role (admin only)  |
| `getRoleByName` | query    | Get role details by name             |

### `convex/permissions.ts`

| Function               | Type             | Description                                |
| ---------------------- | ---------------- | ------------------------------------------ |
| `checkPermission`      | query            | Check if user has module/action permission |
| `getUserPermissions`   | query            | Get user's effective permissions           |
| `getPermissionsByRole` | query (internal) | Get permissions for a role                 |

### `convex/modules.ts`

Static module registry with available actions:

```typescript
export const MODULES = {
  presentations: {
    displayName: 'Presentations',
    actions: ['create', 'read', 'update', 'delete', 'present'],
  },
  discussions: {
    displayName: 'Discussions',
    actions: ['create', 'read', 'update', 'delete', 'conclude'],
  },
  checklists: {
    displayName: 'Checklists',
    actions: ['create', 'read', 'update', 'delete'],
  },
  attendance: {
    displayName: 'Attendance',
    actions: ['create', 'read', 'update', 'delete', 'mark'],
  },
  users: {
    displayName: 'User Management',
    actions: ['read', 'update', 'delete', 'invite'],
  },
  admin: {
    displayName: 'Administration',
    actions: ['settings', 'roles', 'invites', 'waitlist'],
  },
};
```

### Backend Modules

```
services/backend/modules/auth/permissions/
├── checkPermission.ts   # Permission checking logic
├── moduleRegistry.ts    # Module definitions
└── types.ts             # Permission types
```

---

## Frontend Implementation

### New Pages

```
apps/webapp/src/app/
├── invite/
│   └── [code]/
│       └── page.tsx           # Invite landing & registration
├── app/
│   ├── admin/
│   │   ├── waitlist/
│   │   │   └── page.tsx       # Waitlist management
│   │   ├── invites/
│   │   │   └── page.tsx       # Invite management
│   │   └── roles/
│   │       └── page.tsx       # Role management
│   └── profile/
│       └── page.tsx           # (Update) Add role/permissions section
```

### Invite Landing Page (`/invite/[code]`)

**Flow:**

1. Validate invite code (check exists, not expired, uses remaining)
2. Display invite details (who sent, role assignment)
3. Show registration form (name, email)
4. On submit: create account, log in, redirect to app

**States:**

- Loading: Validating invite
- Invalid: Code not found or expired
- Valid: Show registration form
- Success: Redirect to app

### Admin Waitlist Page (`/app/admin/waitlist`)

- List all waitlist users with registration date
- Bulk selection for promotion
- "Promote Selected" button
- Filter/search by name or email

### Admin Invites Page (`/app/admin/invites`)

- List all invites with status, usage, creator
- Create new invite form
- Revoke invite action
- Filter by status (active, expired, revoked)

### Admin Roles Page (`/app/admin/roles`)

- List all roles with permissions summary
- Create/edit role modal
- Permission matrix editor
- Cannot delete system roles

### Profile Page Updates

Add new section showing:

- Current role name and description
- List of modules with allowed actions
- Invite management (if `allowUserInvites` is enabled):
  - Create invite button
  - List of user's invites with acceptance stats

---

## Default Roles & Permissions

### System Roles (Seed Data)

These roles are created on first run and cannot be deleted:

#### `user` (Default)

Basic access for regular users.

| Module        | Actions              |
| ------------- | -------------------- |
| presentations | read, present        |
| discussions   | create, read, update |
| checklists    | read, update         |
| attendance    | read, mark           |

#### `editor`

Enhanced access for content creators.

| Module        | Actions                                |
| ------------- | -------------------------------------- |
| presentations | create, read, update, delete, present  |
| discussions   | create, read, update, delete, conclude |
| checklists    | create, read, update, delete           |
| attendance    | create, read, update, delete, mark     |

#### `admin`

Full system access.

| Module | Actions                       |
| ------ | ----------------------------- |
| \*     | \* (all modules, all actions) |

---

## Migration Strategy

### Existing Users

1. All existing `full` users receive `role: 'user'`
2. All existing users with `accessLevel: 'system_admin'` receive `role: 'admin'`
3. Anonymous users remain unchanged (no role assigned)

### Migration Script

Add to `convex/migration.ts`:

```typescript
export const migrateUserRoles = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    let migrated = 0;

    for (const user of users) {
      if (user.type === 'full' || user.type === 'anonymous') {
        const role = user.accessLevel === 'system_admin' ? 'admin' : 'user';

        // Skip if already has a role
        if (user.role) continue;

        await ctx.db.patch(user._id, { role });
        migrated++;
      }
    }

    return { migrated };
  },
});
```

### Seed Roles

```typescript
export const seedDefaultRoles = internalMutation({
  handler: async (ctx) => {
    const existingRoles = await ctx.db.query('roles').collect();

    for (const [name, config] of Object.entries(DEFAULT_ROLES)) {
      if (existingRoles.some((r) => r.name === name)) continue;

      await ctx.db.insert('roles', {
        name,
        description: config.description,
        isSystem: true,
        permissions: config.permissions,
        createdAt: Date.now(),
      });
    }
  },
});
```

---

## Open Questions

Please clarify the following before implementation:

1. **Waitlist email verification**: Should waitlist users verify their email before joining, or is email just stored for contact purposes?

2. **Anonymous user handling**: Can anonymous users be promoted via invite, or must they re-register with email?

3. **Permission inheritance**: Should roles support inheritance (e.g., `editor` automatically includes all `user` permissions)?

4. **Invite link format**: Preferred URL format?
   - Option A: `/invite/CODE` (cleaner)
   - Option B: `/join?code=CODE` (more explicit)

5. **Module actions**: Are the proposed actions for each module sufficient? Any specific actions needed for your use case?

6. **Invite limits**: Should there be a global limit on active invites per user, or is unlimited acceptable?

---

## Implementation Order

### Iteration 1: Core Schema & Feature Flags

**Scope:** Foundation work

- [ ] Update `schema.ts` with new tables (`invites`, `inviteAcceptances`, `roles`, `modules`)
- [ ] Add `waitlist` user type to users table union
- [ ] Add `role`, `customPermissions`, `invitedBy` fields to user types
- [ ] Update `featureFlags.ts` with access control configuration
- [ ] Run schema migration

### Iteration 2: Permission System

**Scope:** Backend permission checking

- [ ] Create `modules.ts` with static module registry
- [ ] Create `roles.ts` with CRUD operations
- [ ] Create `permissions.ts` with permission checking functions
- [ ] Create seed migration for default roles
- [ ] Add permission checks to existing Convex functions

### Iteration 3: Waitlist Feature

**Scope:** Self-registration flow

- [ ] Create `waitlist.ts` with join/promote functions
- [ ] Update `loginAnon` to respect feature flags
- [ ] Create admin waitlist management page
- [ ] Add waitlist join page (if mode is `waitlist`)

### Iteration 4: Invite System

**Scope:** Invite-based registration

- [ ] Create `invites.ts` with full CRUD operations
- [ ] Create invite landing page (`/invite/[code]`)
- [ ] Create admin invite management page
- [ ] Add invite section to profile page

### Iteration 5: UI Polish & Profile Enhancement

**Scope:** User-facing improvements

- [ ] Update profile page with role/permissions display
- [ ] Add user invite management UI (if enabled)
- [ ] Add role management admin page
- [ ] Test all flows end-to-end

---

## Related Documentation

- [Account Recovery](./account-recovery.md) - Existing account recovery system
- [Authentication](../services/backend/convex/README.md) - Current auth implementation

---

## Revision History

| Date       | Author  | Changes              |
| ---------- | ------- | -------------------- |
| 2025-01-21 | Builder | Initial plan created |
