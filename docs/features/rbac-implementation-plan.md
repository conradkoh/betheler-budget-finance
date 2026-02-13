# Role-Based Access Control (RBAC) Implementation Plan

## Overview

This document outlines the plan to migrate from the current simple `accessLevel` system to a proper Role-Based Access Control (RBAC) system with granular permissions.

---

## Current State Analysis

### Existing Implementation

**Schema (`services/backend/convex/schema.ts`):**
- Users have an optional `accessLevel` field: `'user' | 'system_admin'`
- Default is `'user'` when undefined

**Access Control (`services/backend/modules/auth/accessControl.ts`):**
- `getAccessLevel(user)` - Returns user's access level (defaults to 'user')
- `isSystemAdmin(user)` - Checks if user is system_admin
- `hasAccessLevel(user, requiredLevel)` - Checks if user meets required level

**Usage Locations:**
- `AdminGuard.tsx` - Frontend component for admin-only pages
- `system/auth/google.ts` - System admin endpoints for OAuth configuration
- `AuthState.ts` - Includes `accessLevel` and `isSystemAdmin` in auth state

### Limitations of Current System
1. Only two levels (binary admin/not-admin)
2. No granular permissions (can't allow user to do X but not Y)
3. Can't create custom roles
4. No permission inheritance or grouping

---

## Proposed RBAC Architecture

### Core Concepts

1. **Permissions** - Individual actions a user can perform (e.g., `users.read`, `settings.write`)
2. **Roles** - Named collections of permissions (e.g., `moderator`, `admin`)
3. **User-Role Assignment** - Users are assigned one or more roles
4. **Permission Inheritance** - Users inherit all permissions from their assigned roles

### Database Schema

```typescript
// New tables in schema.ts

/**
 * RBAC Roles - Named collections of permissions
 */
rbac_roles: defineTable({
  name: v.string(),           // Unique role name (e.g., 'admin', 'moderator')
  displayName: v.string(),    // Human-readable name
  description: v.string(),    // Description of the role
  isSystemRole: v.boolean(),  // If true, cannot be deleted (system_admin, user)
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_name', ['name']),

/**
 * RBAC Permissions - Granular permission definitions
 */
rbac_permissions: defineTable({
  name: v.string(),           // Unique permission identifier (e.g., 'users.read')
  displayName: v.string(),    // Human-readable name
  description: v.string(),    // What this permission allows
  resource: v.string(),       // Resource category (e.g., 'users', 'settings', 'attendance')
  action: v.string(),         // Action type (e.g., 'read', 'write', 'delete', 'manage')
  createdAt: v.number(),
})
  .index('by_name', ['name'])
  .index('by_resource', ['resource']),

/**
 * RBAC Role-Permission mapping (many-to-many)
 */
rbac_rolePermissions: defineTable({
  roleId: v.id('rbac_roles'),
  permissionId: v.id('rbac_permissions'),
})
  .index('by_role', ['roleId'])
  .index('by_permission', ['permissionId'])
  .index('by_role_permission', ['roleId', 'permissionId']),

/**
 * User-Role assignments (many-to-many)
 */
rbac_userRoles: defineTable({
  userId: v.id('users'),
  roleId: v.id('rbac_roles'),
  assignedAt: v.number(),
  assignedBy: v.optional(v.id('users')),  // Who assigned this role
})
  .index('by_user', ['userId'])
  .index('by_role', ['roleId'])
  .index('by_user_role', ['userId', 'roleId']),
```

### Default Roles and Permissions

**System Roles (cannot be deleted):**

| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Default role for all users | Basic access permissions |
| `system_admin` | Full system access | All permissions (wildcard `*`) |

**Permission Categories:**

| Resource | Permissions |
|----------|-------------|
| `users` | `users.read`, `users.write`, `users.delete`, `users.manage` |
| `settings` | `settings.read`, `settings.write` |
| `auth` | `auth.provider.read`, `auth.provider.write`, `auth.provider.manage` |
| `attendance` | `attendance.read`, `attendance.write`, `attendance.manage` |
| `presentation` | `presentation.read`, `presentation.write`, `presentation.manage` |
| `discussion` | `discussion.read`, `discussion.write`, `discussion.manage` |
| `checklist` | `checklist.read`, `checklist.write`, `checklist.manage` |

### Permission Naming Convention

Format: `{resource}.{action}`

**Actions:**
- `read` - View/list resources
- `write` - Create/update resources
- `delete` - Delete resources
- `manage` - Full control including admin operations

**Special Permissions:**
- `*` - Wildcard, grants all permissions (system_admin only)
- `{resource}.*` - All actions on a resource

---

## Implementation Phases

### Phase 1: Foundation (Non-breaking)

**Goal:** Add RBAC tables and utilities without breaking existing functionality.

**Tasks:**
1. Add new RBAC tables to schema
2. Create RBAC module with core utilities:
   - `hasPermission(user, permission)` - Check if user has permission
   - `getUserPermissions(user)` - Get all user permissions
   - `getUserRoles(user)` - Get all user roles
3. Create seed data mutation for default roles/permissions
4. Maintain backward compatibility with `isSystemAdmin`

**Files to Create:**
- `services/backend/modules/rbac/permissions.ts` - Permission checking
- `services/backend/modules/rbac/roles.ts` - Role management
- `services/backend/modules/rbac/types.ts` - RBAC types
- `services/backend/convex/rbac.ts` - RBAC queries/mutations

### Phase 2: Migration

**Goal:** Migrate existing users to RBAC system.

**Tasks:**
1. Create migration to assign roles based on current `accessLevel`:
   - `accessLevel: 'user'` → assign `user` role
   - `accessLevel: 'system_admin'` → assign `system_admin` role
2. Update `AuthState` to include user permissions
3. Add RBAC data to session/auth responses

### Phase 3: Integration

**Goal:** Replace `accessLevel` checks with permission checks.

**Tasks:**
1. Update backend endpoints to use `hasPermission()`
2. Update `AdminGuard` to check for specific permissions
3. Create frontend permission utilities
4. Add permission-based UI rendering

### Phase 4: Admin UI (Optional)

**Goal:** Allow admins to manage roles and permissions.

**Tasks:**
1. Create admin UI for role management
2. Create admin UI for user-role assignment
3. Create admin UI for custom role creation

---

## Migration Strategy

### Backward Compatibility

During migration, maintain both systems:

```typescript
// Updated accessControl.ts
export function isSystemAdmin(user: Doc<'users'>): boolean {
  // Legacy check (for transition period)
  if (user.accessLevel === 'system_admin') {
    return true;
  }
  // New RBAC check
  return hasRole(user, 'system_admin');
}

export function hasPermission(ctx: Context, user: Doc<'users'>, permission: string): boolean {
  // System admins have all permissions
  if (isSystemAdmin(user)) {
    return true;
  }
  // Check permission via RBAC
  return checkUserPermission(ctx, user._id, permission);
}
```

### Deprecation Path

1. **Phase 1-2:** Both systems work, `accessLevel` is source of truth
2. **Phase 3:** RBAC is source of truth, `accessLevel` kept for fallback
3. **Phase 4:** Remove `accessLevel` field from users table

---

## API Design

### Permission Checking (Backend)

```typescript
// In Convex functions
import { requirePermission } from '../modules/rbac/permissions';

export const updateUserSettings = mutation({
  args: { ...SessionIdArg, settings: v.object({...}) },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx, args);
    
    // Throws if user lacks permission
    await requirePermission(ctx, user, 'settings.write');
    
    // ... rest of handler
  },
});
```

### Permission Checking (Frontend)

```typescript
// React hook
import { useHasPermission } from '@/modules/auth/permissions';

function AdminSettings() {
  const canWriteSettings = useHasPermission('settings.write');
  
  if (!canWriteSettings) {
    return <AccessDenied />;
  }
  
  return <SettingsForm />;
}
```

### Role Management

```typescript
// Assign role to user
await ctx.runMutation(api.rbac.assignRole, {
  userId: user._id,
  roleName: 'moderator',
});

// Remove role from user
await ctx.runMutation(api.rbac.removeRole, {
  userId: user._id,
  roleName: 'moderator',
});

// Get user's roles
const roles = await ctx.runQuery(api.rbac.getUserRoles, {
  userId: user._id,
});
```

---

## Security Considerations

1. **Permission Caching:** Cache permissions per-request to avoid repeated DB lookups
2. **Role Validation:** Validate role existence before assignment
3. **Audit Logging:** Log role/permission changes for security audits
4. **Immutable System Roles:** Prevent deletion/modification of system roles
5. **Admin Self-Protection:** Prevent admins from removing their own admin role

---

## Testing Strategy

1. **Unit Tests:** Permission checking logic, role assignment
2. **Integration Tests:** End-to-end permission flows
3. **Migration Tests:** Verify user migration preserves access
4. **Security Tests:** Verify unauthorized access is blocked

---

## Open Questions for Review

1. Should we support role hierarchies (e.g., `admin` inherits from `moderator`)?
2. Should permissions be resource-instance specific (e.g., can edit only their own attendance)?
3. Do we need time-limited role assignments (e.g., temporary admin access)?
4. Should we support permission negation (explicitly deny a permission)?

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Finalize permission list** based on application features
3. **Begin Phase 1** implementation
4. **Create migration script** for existing users

---

## Appendix: Initial Permissions List

Based on current codebase analysis:

```typescript
const INITIAL_PERMISSIONS = [
  // User management
  { name: 'users.read', resource: 'users', action: 'read' },
  { name: 'users.write', resource: 'users', action: 'write' },
  { name: 'users.delete', resource: 'users', action: 'delete' },
  { name: 'users.manage', resource: 'users', action: 'manage' },
  
  // Auth provider configuration
  { name: 'auth.provider.read', resource: 'auth', action: 'read' },
  { name: 'auth.provider.write', resource: 'auth', action: 'write' },
  { name: 'auth.provider.manage', resource: 'auth', action: 'manage' },
  
  // System settings
  { name: 'settings.read', resource: 'settings', action: 'read' },
  { name: 'settings.write', resource: 'settings', action: 'write' },
  
  // Feature-specific permissions
  { name: 'attendance.read', resource: 'attendance', action: 'read' },
  { name: 'attendance.write', resource: 'attendance', action: 'write' },
  { name: 'attendance.manage', resource: 'attendance', action: 'manage' },
  
  { name: 'presentation.read', resource: 'presentation', action: 'read' },
  { name: 'presentation.write', resource: 'presentation', action: 'write' },
  { name: 'presentation.manage', resource: 'presentation', action: 'manage' },
  
  { name: 'discussion.read', resource: 'discussion', action: 'read' },
  { name: 'discussion.write', resource: 'discussion', action: 'write' },
  { name: 'discussion.manage', resource: 'discussion', action: 'manage' },
  
  { name: 'checklist.read', resource: 'checklist', action: 'read' },
  { name: 'checklist.write', resource: 'checklist', action: 'write' },
  { name: 'checklist.manage', resource: 'checklist', action: 'manage' },
];
```
