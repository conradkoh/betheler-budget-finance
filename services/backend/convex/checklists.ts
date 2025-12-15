import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import { type MutationCtx, mutation, type QueryCtx, query } from './_generated/server';

/**
 * Internal type for checklist update data when toggling completion status.
 */
interface _ChecklistItemUpdateData {
  isCompleted: boolean;
  completedAt?: number;
  completedBy?: string;
}

/**
 * Retrieves the current state of a checklist by its key.
 * Returns default values if the checklist doesn't exist yet.
 * @param key - The unique identifier for the checklist
 * @returns The checklist state with existence flag
 */
export const getChecklistState = query({
  args: {
    key: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Look up the checklist state by key
    const state = await ctx.db
      .query('checklistState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (!state) {
      // If no state exists for this key, return default values
      return {
        key: args.key,
        exists: false,
        isActive: false,
      };
    }

    return {
      ...state,
      exists: true,
    };
  },
});

/**
 * Retrieves all items for a specific checklist, ordered by their order field.
 * @param key - The unique identifier for the checklist
 * @returns Array of checklist items sorted by order
 */
export const getChecklistItems = query({
  args: {
    key: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Look up items for this checklist, ordered by order field
    const items = await ctx.db
      .query('checklistItems')
      .withIndex('by_checklist_order', (q) => q.eq('checklistKey', args.key))
      .order('asc')
      .collect();

    return items;
  },
});

/**
 * Creates a new checklist with the specified key and title.
 * Returns existing checklist ID if one already exists with the same key.
 * @param key - The unique identifier for the checklist
 * @param title - The display title for the checklist
 * @returns The ID of the created or existing checklist
 */
export const createChecklist = mutation({
  args: {
    key: v.string(),
    title: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if a checklist with this key already exists
    const existingChecklist = await ctx.db
      .query('checklistState')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (existingChecklist) {
      // If it exists, return the existing checklist ID
      return existingChecklist._id;
    }

    // Create a new checklist
    return await ctx.db.insert('checklistState', {
      key: args.key,
      title: args.title,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

/**
 * Adds a new item to an existing active checklist.
 * The item is appended at the end with the next available order number.
 * @param checklistKey - The unique identifier for the checklist
 * @param text - The text content of the checklist item
 * @returns The ID of the created checklist item
 */
export const addChecklistItem = mutation({
  args: {
    checklistKey: v.string(),
    text: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the checklist exists and is active
    const checklist = await ctx.db
      .query('checklistState')
      .withIndex('by_key', (q) => q.eq('key', args.checklistKey))
      .first();

    if (!checklist) {
      throw new Error('Checklist not found');
    }

    if (!checklist.isActive) {
      throw new Error('Checklist is no longer active');
    }

    // Get the current max order to append the new item at the end
    const existingItems = await ctx.db
      .query('checklistItems')
      .withIndex('by_checklist', (q) => q.eq('checklistKey', args.checklistKey))
      .collect();

    const maxOrder = _calculateNextOrder(existingItems);

    // Add the item
    return await ctx.db.insert('checklistItems', {
      checklistKey: args.checklistKey,
      text: args.text,
      isCompleted: false,
      order: maxOrder,
      createdAt: Date.now(),
      createdBy: args.sessionId,
    });
  },
});

/**
 * Toggles the completion status of a checklist item.
 * Updates completion timestamp and user when marking as completed.
 * @param itemId - The ID of the checklist item to toggle
 * @returns The result of the patch operation
 */
export const toggleChecklistItem = mutation({
  args: {
    itemId: v.id('checklistItems'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get the item
    const item = await ctx.db.get('checklistItems', args.itemId);
    if (!item) {
      throw new Error('Checklist item not found');
    }

    // Check if the checklist is still active
    await _getActiveChecklist(ctx, item.checklistKey);

    // Toggle the completion status
    const updateData = _buildToggleUpdateData(!item.isCompleted, args.sessionId);

    return await ctx.db.patch('checklistItems', args.itemId, updateData);
  },
});

/**
 * Deletes a checklist item from an active checklist.
 * @param itemId - The ID of the checklist item to delete
 * @returns Success confirmation object
 */
export const deleteChecklistItem = mutation({
  args: {
    itemId: v.id('checklistItems'),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Get the item
    const item = await ctx.db.get('checklistItems', args.itemId);
    if (!item) {
      throw new Error('Checklist item not found');
    }

    // Check if the checklist is still active
    await _getActiveChecklist(ctx, item.checklistKey);

    // Delete the item
    await ctx.db.delete('checklistItems', args.itemId);
    return { success: true };
  },
});

/**
 * Concludes an active checklist, marking it as inactive.
 * Records the conclusion timestamp and user.
 * @param checklistKey - The unique identifier for the checklist
 * @returns The result of the patch operation
 */
export const concludeChecklist = mutation({
  args: {
    checklistKey: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the checklist exists
    const checklist = await _getChecklistByKey(ctx, args.checklistKey);

    // Mark the checklist as inactive
    return await ctx.db.patch('checklistState', checklist._id, {
      isActive: false,
      concludedAt: Date.now(),
      concludedBy: args.sessionId,
    });
  },
});

/**
 * Reopens a concluded checklist, making it active again.
 * Clears the conclusion timestamp and user data.
 * @param checklistKey - The unique identifier for the checklist
 * @returns The result of the patch operation
 */
export const reopenChecklist = mutation({
  args: {
    checklistKey: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the checklist exists
    const checklist = await _getChecklistByKey(ctx, args.checklistKey);

    // Mark the checklist as active and clear conclusion data
    return await ctx.db.patch('checklistState', checklist._id, {
      isActive: true,
      concludedAt: undefined,
      concludedBy: undefined,
    });
  },
});

/**
 * Removes all completed items from an active checklist.
 * @param checklistKey - The unique identifier for the checklist
 * @returns Object containing the count of deleted items
 */
export const clearCompletedItems = mutation({
  args: {
    checklistKey: v.string(),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the checklist exists and is active
    await _getActiveChecklist(ctx, args.checklistKey);

    // Get all completed items
    const completedItems = await ctx.db
      .query('checklistItems')
      .withIndex('by_checklist', (q) => q.eq('checklistKey', args.checklistKey))
      .filter((q) => q.eq(q.field('isCompleted'), true))
      .collect();

    // Delete all completed items
    await Promise.all(completedItems.map((item) => ctx.db.delete('checklistItems', item._id)));

    return { deletedCount: completedItems.length };
  },
});

/**
 * Updates the order of multiple checklist items in a single operation.
 * @param checklistKey - The unique identifier for the checklist
 * @param itemOrders - Array of item IDs and their new order values
 * @returns Success confirmation object
 */
export const reorderChecklistItems = mutation({
  args: {
    checklistKey: v.string(),
    itemOrders: v.array(
      v.object({
        itemId: v.id('checklistItems'),
        newOrder: v.number(),
      })
    ),
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Check if the checklist exists and is active
    await _getActiveChecklist(ctx, args.checklistKey);

    // Update the order for each item
    await Promise.all(
      args.itemOrders.map(({ itemId, newOrder }) =>
        ctx.db.patch('checklistItems', itemId, { order: newOrder })
      )
    );

    return { success: true };
  },
});

/**
 * Calculates the next order number for a new checklist item.
 * Internal helper function for item ordering.
 */
function _calculateNextOrder(existingItems: { order: number }[]): number {
  return existingItems.length > 0 ? Math.max(...existingItems.map((item) => item.order)) + 1 : 0;
}

/**
 * Builds update data object for toggling checklist item completion status.
 * Internal helper function for toggle operations.
 */
function _buildToggleUpdateData(isCompleted: boolean, sessionId: string): _ChecklistItemUpdateData {
  const updateData: _ChecklistItemUpdateData = {
    isCompleted,
  };

  if (isCompleted) {
    updateData.completedAt = Date.now();
    updateData.completedBy = sessionId;
  } else {
    updateData.completedAt = undefined;
    updateData.completedBy = undefined;
  }

  return updateData;
}

/**
 * Retrieves a checklist by key and validates it exists.
 * Internal helper function for checklist lookup.
 */
async function _getChecklistByKey(ctx: QueryCtx | MutationCtx, checklistKey: string) {
  const checklist = await ctx.db
    .query('checklistState')
    .withIndex('by_key', (q) => q.eq('key', checklistKey))
    .first();

  if (!checklist) {
    throw new Error('Checklist not found');
  }

  return checklist;
}

/**
 * Retrieves a checklist by key and validates it exists and is active.
 * Internal helper function for active checklist operations.
 */
async function _getActiveChecklist(ctx: QueryCtx | MutationCtx, checklistKey: string) {
  const checklist = await _getChecklistByKey(ctx, checklistKey);

  if (!checklist.isActive) {
    throw new Error('Checklist is no longer active');
  }

  return checklist;
}
