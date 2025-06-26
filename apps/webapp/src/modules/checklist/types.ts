import type { Id } from '@workspace/backend/convex/_generated/dataModel';

/**
 * Core checklist item entity representing a single task in a checklist.
 * Contains completion state, ordering, and audit trail information.
 */
export interface ChecklistItem {
  _id: Id<'checklistItems'>;
  _creationTime: number;
  checklistKey: string;
  text: string;
  isCompleted: boolean;
  order: number;
  createdAt: number;
  completedAt?: number;
  createdBy?: string;
  completedBy?: string;
}

/**
 * Optimistic checklist item for UI state management before server persistence.
 * Used to provide immediate feedback while waiting for server confirmation.
 */
export interface OptimisticChecklistItem {
  _id: string; // Temporary ID for optimistic items
  _creationTime: number;
  checklistKey: string;
  text: string;
  isCompleted: boolean;
  order: number;
  createdAt: number;
  completedAt?: number;
  createdBy?: string;
  completedBy?: string;
  isOptimistic: true;
  isPending: boolean;
}

/**
 * Union type for both real and optimistic checklist items.
 * Allows components to handle both persisted and pending items uniformly.
 */
export type ChecklistItemWithOptimistic = ChecklistItem | OptimisticChecklistItem;

/**
 * Checklist state entity representing the overall status and metadata of a checklist.
 * Tracks whether the checklist is active and provides audit information.
 */
export interface ChecklistState {
  _id: Id<'checklistState'>;
  _creationTime: number;
  key: string;
  title: string;
  isActive: boolean;
  createdAt: number;
  concludedAt?: number;
  concludedBy?: string;
  exists?: boolean;
}

/**
 * Props for the main Checklist component.
 * Defines the essential configuration for rendering a checklist.
 */
export interface ChecklistProps {
  title: string;
  checklistKey: string;
  description?: string;
  className?: string;
}

/**
 * Props for individual ChecklistItem components.
 * Provides item data and callback functions for user interactions.
 */
export interface ChecklistItemProps {
  item: ChecklistItem;
  onToggle: (itemId: Id<'checklistItems'>) => void;
  onDelete: (itemId: Id<'checklistItems'>) => void;
  isActive: boolean;
}

/**
 * Props for the ChecklistItemForm component.
 * Handles form submission and cancellation for creating new checklist items.
 */
export interface ChecklistItemFormProps {
  onSubmit: (text: string) => Promise<boolean>;
  onCancel?: () => void;
}
