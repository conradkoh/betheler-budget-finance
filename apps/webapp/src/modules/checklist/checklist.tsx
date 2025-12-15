'use client';

import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { CheckCheck, GripVertical, Loader2, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChecklistInlineInput } from './checklist-inline-input';
import type { ChecklistItemWithOptimistic, ChecklistProps } from './types';
import { useChecklistSync } from './use-checklist-sync';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

/**
 * Internal props for the ChecklistItemComponent.
 */
interface ChecklistItemComponentProps {
  item: ChecklistItemWithOptimistic;
  onToggle: (itemId: string | Id<'checklistItems'>) => void;
  onDelete: (itemId: string | Id<'checklistItems'>) => void;
  isActive: boolean;
  isDragging: boolean;
  isDraggedOver: boolean;
  onDragStart: (e: React.DragEvent, itemId: string | Id<'checklistItems'>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

/**
 * Main checklist component for displaying and managing collaborative task lists.
 * Provides a complete interface for viewing, adding, completing, and managing checklist items
 * with real-time synchronization and optimistic updates.
 *
 * Features:
 * - Real-time collaborative editing
 * - Optimistic updates for immediate feedback
 * - Progress tracking with visual indicators
 * - Checklist lifecycle management (active/concluded)
 * - Bulk operations (clear completed items)
 * - Responsive design with scrollable content
 */
export function Checklist({ title, checklistKey, description, className }: ChecklistProps) {
  const {
    items,
    isActive,
    isConcluded,
    totalItems,
    completedItems,
    completionPercentage,
    isLoading,
    initializeChecklist,
    addItem,
    getAndClearFailedText,
    toggleItem,
    deleteItem,
    concludeChecklist,
    reopenChecklist,
    clearCompleted,
    reorderItems,
  } = useChecklistSync({
    key: checklistKey,
    title,
  });

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<string | Id<'checklistItems'> | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  /**
   * Handles the start of a drag operation.
   * Records which item is being dragged.
   */
  const handleDragStart = useCallback(
    (e: React.DragEvent, itemId: string | Id<'checklistItems'>) => {
      setDraggedItemId(itemId);
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  /**
   * Handles drag over events for drop zone indication.
   * Determines the target drop index based on mouse position.
   */
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  /**
   * Handles the drop operation to reorder items.
   * Calls the reorder function with the new index.
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();

      if (
        draggedItemId &&
        !(typeof draggedItemId === 'string' && draggedItemId.startsWith('optimistic-'))
      ) {
        await reorderItems(draggedItemId as Id<'checklistItems'>, targetIndex);
      }

      // Reset drag state
      setDraggedItemId(null);
      setDragOverIndex(null);
    },
    [draggedItemId, reorderItems]
  );

  // Initialize checklist on mount
  useEffect(() => {
    initializeChecklist();
  }, [initializeChecklist]);

  /**
   * Handles adding a new item to the checklist.
   * Wrapped in useCallback to prevent unnecessary re-renders.
   */
  const handleAddItem = useCallback(
    async (text: string) => {
      return await addItem(text);
    },
    [addItem]
  );

  /**
   * Handles toggling the completion status of a checklist item.
   * Prevents toggling optimistic items that haven't been persisted yet.
   */
  const handleToggleItem = useCallback(
    (itemId: string | Id<'checklistItems'>) => {
      // Only allow toggling real items, not optimistic ones
      if (typeof itemId === 'string' && itemId.startsWith('optimistic-')) {
        return;
      }
      toggleItem(itemId as Id<'checklistItems'>);
    },
    [toggleItem]
  );

  /**
   * Handles deleting a checklist item.
   * Prevents deleting optimistic items that haven't been persisted yet.
   */
  const handleDeleteItem = useCallback(
    (itemId: string | Id<'checklistItems'>) => {
      // Only allow deleting real items, not optimistic ones
      if (typeof itemId === 'string' && itemId.startsWith('optimistic-')) {
        return;
      }
      deleteItem(itemId as Id<'checklistItems'>);
    },
    [deleteItem]
  );

  /**
   * Handles concluding the entire checklist.
   * Marks the checklist as inactive and prevents further modifications.
   */
  const handleConcludeChecklist = useCallback(() => {
    concludeChecklist();
  }, [concludeChecklist]);

  /**
   * Handles reopening a concluded checklist.
   * Makes the checklist active again for further modifications.
   */
  const handleReopenChecklist = useCallback(() => {
    reopenChecklist();
  }, [reopenChecklist]);

  /**
   * Handles clearing all completed items from the checklist.
   * Removes all checked items in a single operation.
   */
  const handleClearCompleted = useCallback(() => {
    clearCompleted();
  }, [clearCompleted]);

  /**
   * Memoized progress section to avoid unnecessary re-renders.
   * Only recalculates when progress-related values change.
   */
  const progressSection = useMemo(() => {
    if (totalItems === 0) return null;

    return (
      <div className="space-y-2 mt-3">
        <Progress value={completionPercentage} className="h-2" />
        <div className="text-sm text-muted-foreground">
          {completedItems} of {totalItems} completed ({Math.round(completionPercentage)}%)
        </div>
      </div>
    );
  }, [totalItems, completedItems, completionPercentage]);

  /**
   * Memoized dropdown menu content to avoid unnecessary re-renders.
   * Only recalculates when state or completion status changes.
   */
  const dropdownMenuContent = useMemo(
    () => (
      <DropdownMenuContent align="end">
        {isActive && (
          <>
            {completedItems > 0 && (
              <DropdownMenuItem onClick={handleClearCompleted}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Clear Completed
              </DropdownMenuItem>
            )}
            {completedItems > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={handleConcludeChecklist}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Conclude Checklist
            </DropdownMenuItem>
          </>
        )}
        {isConcluded && (
          <DropdownMenuItem onClick={handleReopenChecklist}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reopen Checklist
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    ),
    [
      isActive,
      isConcluded,
      completedItems,
      handleClearCompleted,
      handleConcludeChecklist,
      handleReopenChecklist,
    ]
  );

  if (isLoading) {
    return (
      <Card className={`${className} flex flex-col gap-3`}>
        <CardHeader className="pb-0">
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} flex flex-col gap-3`}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {dropdownMenuContent}
          </DropdownMenu>
        </div>
        {progressSection}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[250px] overflow-y-auto px-1 pb-1">
          {items.length === 0 && !isActive ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground italic">
                This checklist has been concluded.
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <ChecklistItemComponent
                  key={item._id}
                  item={item}
                  onToggle={handleToggleItem}
                  onDelete={handleDeleteItem}
                  isActive={isActive}
                  isDragging={draggedItemId === item._id}
                  isDraggedOver={dragOverIndex === index}
                  onDragStart={handleDragStart}
                  onDragOver={(e: React.DragEvent) => handleDragOver(e, index)}
                  onDrop={(e: React.DragEvent) => handleDrop(e, index)}
                />
              ))}
              {isActive && (
                <ChecklistInlineInput
                  onSubmit={handleAddItem}
                  getAndClearFailedText={getAndClearFailedText}
                  placeholder="Add new item..."
                  className="mt-3 px-1"
                />
              )}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual checklist item component with completion status and delete functionality.
 * Handles both persisted and optimistic items with appropriate visual states.
 * Internal component for checklist item rendering.
 */
function ChecklistItemComponent({
  item,
  onToggle,
  onDelete,
  isActive,
  isDragging,
  isDraggedOver,
  onDragStart,
  onDragOver,
  onDrop,
}: ChecklistItemComponentProps) {
  const isOptimistic = 'isOptimistic' in item && item.isOptimistic;
  const isPending = 'isPending' in item && item.isPending;
  const canDrag = isActive && !isOptimistic && !isPending;

  /**
   * Memoized toggle handler to prevent unnecessary re-renders.
   */
  const handleToggle = useCallback(() => {
    onToggle(item._id);
  }, [onToggle, item._id]);

  /**
   * Memoized delete handler to prevent unnecessary re-renders.
   */
  const handleDelete = useCallback(() => {
    onDelete(item._id);
  }, [onDelete, item._id]);

  /**
   * Memoized drag start handler to prevent unnecessary re-renders.
   */
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      onDragStart(e, item._id);
    },
    [onDragStart, item._id]
  );

  /**
   * Memoized item styling to avoid recalculating on every render.
   */
  const itemClassName = useMemo(() => {
    const baseClasses =
      'flex items-center gap-3 p-2 rounded-lg border bg-card transition-colors group';
    const stateClasses = isPending ? 'bg-muted/50 opacity-75' : 'hover:bg-accent/50';
    const dragClasses = isDragging
      ? 'opacity-50 scale-95'
      : isDraggedOver
        ? 'border-primary bg-primary/5'
        : '';
    return `${baseClasses} ${stateClasses} ${dragClasses}`.trim();
  }, [isPending, isDragging, isDraggedOver]);

  /**
   * Memoized text styling to avoid recalculating on every render.
   */
  const textClassName = useMemo(() => {
    const baseClasses = 'text-sm';
    const completedClasses = item.isCompleted ? 'line-through text-muted-foreground' : '';
    const pendingClasses = isPending ? 'text-muted-foreground' : '';
    return `${baseClasses} ${completedClasses} ${pendingClasses}`.trim();
  }, [item.isCompleted, isPending]);

  return (
    <li
      className={itemClassName}
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => {}} // Prevent default behavior
    >
      {canDrag && (
        <div className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <Checkbox
        checked={item.isCompleted}
        onCheckedChange={handleToggle}
        disabled={!isActive || isOptimistic}
      />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={textClassName}>{item.text}</span>
        {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <div className="w-8 h-8 flex items-center justify-center">
        {isActive && !isOptimistic && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </li>
  );
}
