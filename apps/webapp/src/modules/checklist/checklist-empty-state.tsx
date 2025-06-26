/**
 * Props for the ChecklistEmptyState component.
 */
export interface ChecklistEmptyStateProps {
  isActive: boolean;
  onAddItem: () => void;
}

/**
 * Empty state component for checklists with no items.
 * Displays contextual messages based on checklist status (active vs concluded).
 * Provides visual feedback and guidance for users when the checklist is empty.
 *
 * @param isActive - Whether the checklist is currently active and accepts new items
 * @param onAddItem - Callback function to trigger item addition (currently unused but kept for future extensibility)
 */
export function ChecklistEmptyState({ isActive }: ChecklistEmptyStateProps) {
  if (!isActive) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground italic">
          This checklist has been concluded.
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-sm text-muted-foreground italic">
        No items yet. Start typing below to add your first item!
      </div>
    </div>
  );
}
