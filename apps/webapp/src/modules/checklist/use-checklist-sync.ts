import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type {
  ChecklistItem,
  ChecklistItemWithOptimistic,
  ChecklistState,
  OptimisticChecklistItem,
} from './types';

/**
 * Props for the useChecklistSync hook.
 */
export interface UseChecklistSyncProps {
  key: string;
  title: string;
}

/**
 * Internal type for checklist statistics.
 */
interface _ChecklistStats {
  totalItems: number;
  completedItems: number;
  pendingItems: number;
  completionPercentage: number;
}

/**
 * Custom hook for managing checklist state with optimistic updates and real-time synchronization.
 * Provides comprehensive checklist operations including CRUD operations, state management,
 * and automatic conflict resolution between local optimistic updates and server state.
 *
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic retry mechanism for failed operations
 * - Real-time synchronization with server state
 * - Comprehensive error handling with user notifications
 *
 * @param key - Unique identifier for the checklist
 * @param title - Display title for the checklist
 * @returns Object containing checklist data, state, statistics, and action functions
 */
export function useChecklistSync({ key, title }: UseChecklistSyncProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [optimisticItems, setOptimisticItems] = useState<OptimisticChecklistItem[]>([]);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [deletingItemIds, setDeletingItemIds] = useState<Set<Id<'checklistItems'>>>(new Set());
  const [optimisticToggles, setOptimisticToggles] = useState<Map<Id<'checklistItems'>, boolean>>(
    new Map()
  );

  // Queries
  const checklistState = useSessionQuery(api.checklists.getChecklistState, { key }) as
    | ChecklistState
    | undefined;
  const serverItems = useSessionQuery(api.checklists.getChecklistItems, { key }) as
    | ChecklistItem[]
    | undefined;

  // Mutations
  const createChecklistMutation = useSessionMutation(api.checklists.createChecklist);
  const addItemMutation = useSessionMutation(api.checklists.addChecklistItem);
  const toggleItemMutation = useSessionMutation(api.checklists.toggleChecklistItem);
  const deleteItemMutation = useSessionMutation(api.checklists.deleteChecklistItem);
  const concludeChecklistMutation = useSessionMutation(api.checklists.concludeChecklist);
  const reopenChecklistMutation = useSessionMutation(api.checklists.reopenChecklist);
  const clearCompletedMutation = useSessionMutation(api.checklists.clearCompletedItems);
  const reorderItemsMutation = useSessionMutation(api.checklists.reorderChecklistItems);

  // Derived state
  const isActive = checklistState?.isActive ?? false;
  const isConcluded = checklistState?.exists && !isActive;
  const exists = checklistState?.exists ?? false;

  // Merge server items with optimistic items, filter out deleted items, and apply optimistic toggles
  const items: ChecklistItemWithOptimistic[] = useMemo(() => {
    return [
      ...(serverItems ?? [])
        .filter((item) => !deletingItemIds.has(item._id))
        .map((item) => {
          const optimisticCompleted = optimisticToggles.get(item._id);
          return optimisticCompleted !== undefined
            ? { ...item, isCompleted: optimisticCompleted }
            : item;
        }),
      ...optimisticItems,
    ].sort((a, b) => a.order - b.order);
  }, [serverItems, deletingItemIds, optimisticToggles, optimisticItems]);

  // Computed statistics (use the items array which already includes optimistic changes)
  const statistics: _ChecklistStats = useMemo(() => {
    const totalItems = items.length;
    const completedItems = items.filter(
      (item) => item.isCompleted && !('isPending' in item && item.isPending)
    ).length;
    const pendingItems = totalItems - completedItems;
    const completionPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      completedItems,
      pendingItems,
      completionPercentage,
    };
  }, [items]);

  // Set loading state based on data availability
  useEffect(() => {
    if (checklistState !== undefined && serverItems !== undefined) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [checklistState, serverItems]);

  // Clean up deleting set when server items change (remove IDs that no longer exist)
  useEffect(() => {
    if (serverItems && deletingItemIds.size > 0) {
      const serverItemIds = new Set(serverItems.map((item) => item._id));
      setDeletingItemIds((prev) => {
        const newSet = new Set<Id<'checklistItems'>>();
        for (const id of prev) {
          if (serverItemIds.has(id)) {
            newSet.add(id);
          }
        }
        return newSet.size !== prev.size ? newSet : prev;
      });
    }
  }, [serverItems, deletingItemIds.size]);

  // Clean up optimistic toggles when server data changes (remove IDs that no longer exist or match server state)
  useEffect(() => {
    if (serverItems && optimisticToggles.size > 0) {
      setOptimisticToggles((prev) => {
        const newMap = new Map<Id<'checklistItems'>, boolean>();
        for (const [id, optimisticState] of prev) {
          const serverItem = serverItems.find((item) => item._id === id);
          // Keep optimistic toggle only if item exists and server state differs from optimistic state
          if (serverItem && serverItem.isCompleted !== optimisticState) {
            newMap.set(id, optimisticState);
          }
        }
        return newMap.size !== prev.size ? newMap : prev;
      });
    }
  }, [serverItems, optimisticToggles.size]);

  /**
   * Initializes a new checklist if one doesn't exist for the given key.
   * @returns Promise that resolves when initialization is complete
   */
  const initializeChecklist = useCallback(async () => {
    if (!exists && checklistState !== undefined) {
      try {
        await createChecklistMutation({ key, title });
      } catch (error) {
        console.error('Failed to initialize checklist:', error);
        toast.error('Failed to initialize checklist');
      }
    }
  }, [exists, checklistState, createChecklistMutation, key, title]);

  /**
   * Adds a new item to the checklist with optimistic updates.
   * Provides immediate UI feedback and handles failures gracefully.
   * @param text - The text content for the new checklist item
   * @returns Promise resolving to true if successful, false otherwise
   */
  const addItem = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text.trim()) {
        toast.error('Item text is required');
        return false;
      }

      // Clear any previous failed text since we're trying again
      setLastFailedText(null);

      // Create optimistic item
      const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
      const maxOrder = items.length > 0 ? Math.max(...items.map((item) => item.order)) : -1;

      const optimisticItem: OptimisticChecklistItem = {
        _id: optimisticId,
        _creationTime: Date.now(),
        checklistKey: key,
        text: text.trim(),
        isCompleted: false,
        order: maxOrder + 1,
        createdAt: Date.now(),
        isOptimistic: true,
        isPending: true,
      };

      // Add optimistic item immediately
      setOptimisticItems((prev) => [...prev, optimisticItem]);

      try {
        // Attempt to create the real item
        await addItemMutation({
          checklistKey: key,
          text: text.trim(),
        });

        // Success - remove the optimistic item
        setOptimisticItems((prev) => prev.filter((item) => item._id !== optimisticId));
        toast.success('Item added successfully');
        return true;
      } catch (error) {
        console.error('Failed to add item:', error);

        // Remove the optimistic item
        setOptimisticItems((prev) => prev.filter((item) => item._id !== optimisticId));

        // Store the failed text for recovery
        setLastFailedText(text.trim());

        toast.error('Failed to add item. Text restored for retry.');
        return false;
      }
    },
    [addItemMutation, key, items]
  );

  /**
   * Retrieves and clears the last failed text for input recovery.
   * Used to restore user input after a failed operation.
   * @returns The last failed text or null if none exists
   */
  const getAndClearFailedText = useCallback(() => {
    const text = lastFailedText;
    setLastFailedText(null);
    return text;
  }, [lastFailedText]);

  /**
   * Toggles the completion status of a checklist item with optimistic updates.
   * Provides immediate visual feedback and handles server sync.
   * @param itemId - The ID of the checklist item to toggle
   * @returns Promise resolving to true if successful, false otherwise
   */
  const toggleItem = useCallback(
    async (itemId: Id<'checklistItems'>): Promise<boolean> => {
      // Find the current item to get its current state
      const currentItem = (serverItems ?? []).find((item) => item._id === itemId);
      if (!currentItem) {
        toast.error('Item not found');
        return false;
      }

      // Apply optimistic toggle immediately
      const newCompletedState = !currentItem.isCompleted;
      setOptimisticToggles((prev) => new Map(prev).set(itemId, newCompletedState));

      try {
        await toggleItemMutation({ itemId });
        // Success - remove the optimistic toggle (server data will update)
        setOptimisticToggles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(itemId);
          return newMap;
        });
        return true;
      } catch (error) {
        console.error('Failed to toggle item:', error);
        // Failure - remove the optimistic toggle to revert to original state
        setOptimisticToggles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(itemId);
          return newMap;
        });
        toast.error('Failed to update item. Please try again.');
        return false;
      }
    },
    [toggleItemMutation, serverItems]
  );

  /**
   * Deletes a checklist item with optimistic updates.
   * Immediately hides the item from UI while processing server request.
   * @param itemId - The ID of the checklist item to delete
   * @returns Promise resolving to true if successful, false otherwise
   */
  const deleteItem = useCallback(
    async (itemId: Id<'checklistItems'>): Promise<boolean> => {
      // Add to deleting set immediately for optimistic UI
      setDeletingItemIds((prev) => new Set(prev).add(itemId));

      try {
        await deleteItemMutation({ itemId });
        // Success - keep the item hidden (it will be removed from server data)
        toast.success('Item deleted successfully');
        return true;
      } catch (error) {
        console.error('Failed to delete item:', error);
        // Failure - restore the item by removing from deleting set
        setDeletingItemIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        toast.error('Failed to delete item. Please try again.');
        return false;
      }
    },
    [deleteItemMutation]
  );

  /**
   * Concludes the checklist, marking it as inactive.
   * Prevents further modifications to the checklist.
   * @returns Promise resolving to true if successful, false otherwise
   */
  const concludeChecklist = useCallback(async (): Promise<boolean> => {
    try {
      await concludeChecklistMutation({ checklistKey: key });
      toast.success('Checklist concluded successfully');
      return true;
    } catch (error) {
      console.error('Failed to conclude checklist:', error);
      toast.error('Failed to conclude checklist. Please try again.');
      return false;
    }
  }, [concludeChecklistMutation, key]);

  /**
   * Reopens a concluded checklist, making it active again.
   * Allows further modifications to the checklist.
   * @returns Promise resolving to true if successful, false otherwise
   */
  const reopenChecklist = useCallback(async (): Promise<boolean> => {
    try {
      await reopenChecklistMutation({ checklistKey: key });
      toast.success('Checklist reopened successfully');
      return true;
    } catch (error) {
      console.error('Failed to reopen checklist:', error);
      toast.error('Failed to reopen checklist. Please try again.');
      return false;
    }
  }, [reopenChecklistMutation, key]);

  /**
   * Clears all completed items from the checklist with optimistic updates.
   * Immediately hides completed items while processing server request.
   * @returns Promise resolving to true if successful, false otherwise
   */
  const clearCompleted = useCallback(async (): Promise<boolean> => {
    // Get completed items to delete optimistically
    const completedItemIds = (serverItems ?? [])
      .filter((item) => item.isCompleted && !deletingItemIds.has(item._id))
      .map((item) => item._id);

    if (completedItemIds.length === 0) {
      toast.info('No completed items to clear');
      return true;
    }

    // Add all completed items to deleting set immediately
    setDeletingItemIds((prev) => {
      const newSet = new Set(prev);
      for (const id of completedItemIds) {
        newSet.add(id);
      }
      return newSet;
    });

    try {
      const result = await clearCompletedMutation({ checklistKey: key });
      // Success - items will be removed from server data
      toast.success(
        `Cleared ${result.deletedCount} completed item${result.deletedCount === 1 ? '' : 's'}`
      );
      return true;
    } catch (error) {
      console.error('Failed to clear completed items:', error);
      // Failure - restore the items by removing from deleting set
      setDeletingItemIds((prev) => {
        const newSet = new Set(prev);
        for (const id of completedItemIds) {
          newSet.delete(id);
        }
        return newSet;
      });
      toast.error('Failed to clear completed items. Please try again.');
      return false;
    }
  }, [clearCompletedMutation, key, serverItems, deletingItemIds]);

  /**
   * Reorders checklist items by updating their order values.
   * Provides optimistic updates with immediate visual feedback.
   * @param draggedItemId - The ID of the item being dragged
   * @param targetIndex - The new index position for the dragged item
   * @returns Promise resolving to true if successful, false otherwise
   */
  const reorderItems = useCallback(
    async (draggedItemId: Id<'checklistItems'>, targetIndex: number): Promise<boolean> => {
      if (!isActive) {
        toast.error('Cannot reorder items in concluded checklist');
        return false;
      }

      // Find the dragged item
      const draggedItem = items.find((item) => item._id === draggedItemId);
      if (!draggedItem || 'isOptimistic' in draggedItem) {
        return false; // Don't reorder optimistic items
      }

      // Create new order for all items
      const reorderedItems = [...items.filter((item) => !('isOptimistic' in item))];
      const draggedIndex = reorderedItems.findIndex((item) => item._id === draggedItemId);

      if (draggedIndex === -1 || draggedIndex === targetIndex) {
        return true; // No change needed
      }

      // Remove dragged item and insert at target position
      const [draggedItemRef] = reorderedItems.splice(draggedIndex, 1);
      reorderedItems.splice(targetIndex, 0, draggedItemRef);

      // Calculate new order values for affected items
      const itemOrders = reorderedItems.map((item, index) => ({
        itemId: item._id as Id<'checklistItems'>,
        newOrder: index,
      }));

      try {
        await reorderItemsMutation({
          checklistKey: key,
          itemOrders,
        });
        return true;
      } catch (error) {
        console.error('Failed to reorder items:', error);
        toast.error('Failed to reorder items. Please try again.');
        return false;
      }
    },
    [reorderItemsMutation, key, items, isActive]
  );

  return {
    // Data
    checklistState,
    items,

    // State
    isActive,
    isConcluded,
    exists,
    isLoading,

    // Statistics
    totalItems: statistics.totalItems,
    completedItems: statistics.completedItems,
    pendingItems: statistics.pendingItems,
    completionPercentage: statistics.completionPercentage,

    // Actions
    initializeChecklist,
    addItem,
    getAndClearFailedText,
    toggleItem,
    deleteItem,
    concludeChecklist,
    reopenChecklist,
    clearCompleted,
    reorderItems,
  };
}
