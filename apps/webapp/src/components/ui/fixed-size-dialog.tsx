'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { DialogOverlay, DialogPortal } from './dialog';

import { useAllowTouchSelection } from '@/hooks/useAllowTouchSelection';
import { cn } from '@/lib/utils';

/**
 * FixedSizeDialog - A production-grade dialog component with fixed sizing and composition model
 *
 * Features:
 * - Fixed large size on desktop, fullscreen on mobile
 * - Fixed header (title) and footer (actions) via flexbox layout
 * - Scrollable content area
 * - Optional sidebar support
 * - Dark mode compatible with semantic tokens
 * - Composition-based API for flexible usage
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger>Open</DialogTrigger>
 *   <FixedSizeDialog>
 *     <FixedSizeDialogTitle>Dialog Title</FixedSizeDialogTitle>
 *     <FixedSizeDialogDescription>
 *       Optional description for accessibility
 *     </FixedSizeDialogDescription>
 *     <FixedSizeDialogContent>
 *       Main content goes here...
 *     </FixedSizeDialogContent>
 *     <FixedSizeDialogActions>
 *       <Button>Cancel</Button>
 *       <Button>Save</Button>
 *     </FixedSizeDialogActions>
 *   </FixedSizeDialog>
 * </Dialog>
 * ```
 *
 * @example With sidebar
 * ```tsx
 * <Dialog>
 *   <DialogTrigger>Open</DialogTrigger>
 *   <FixedSizeDialog>
 *     <FixedSizeDialogTitle>Main Title</FixedSizeDialogTitle>
 *     <div className="flex">
 *       <FixedSizeDialogSidebar title="Sidebar Title" widthClassName="w-80">
 *         Sidebar content...
 *       </FixedSizeDialogSidebar>
 *       <FixedSizeDialogContent>
 *         Main content...
 *       </FixedSizeDialogContent>
 *     </div>
 *     <FixedSizeDialogActions>
 *       <Button>Save</Button>
 *     </FixedSizeDialogActions>
 *   </FixedSizeDialog>
 * </Dialog>
 * ```
 */

interface FixedSizeDialogProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Whether to show the close button in the top-right corner
   * @default true
   */
  showCloseButton?: boolean;
}

/**
 * Root FixedSizeDialog component - wraps the dialog content with fixed sizing
 */
export const FixedSizeDialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  FixedSizeDialogProps
>(({ className, children, onEscapeKeyDown, showCloseButton = true, ...props }, ref) => {
  // Fix iOS text selection handles not being draggable
  useAllowTouchSelection();

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="fixed-size-dialog"
        className={cn(
          // Base positioning and size
          'fixed inset-0 z-50 m-auto h-full w-full',
          // Desktop: fixed large size with rounded corners
          'sm:h-[85vh] sm:max-h-[800px] sm:w-[90vw] sm:max-w-[1200px] sm:rounded-lg',
          // Styling
          'border bg-background shadow-lg',
          // Layout: flex column for sticky header/footer
          'flex flex-col overflow-hidden',
          // Animations
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'duration-200',
          className
        )}
        onEscapeKeyDown={onEscapeKeyDown}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              'absolute top-4 right-4 z-10',
              'rounded-xs opacity-70 transition-opacity hover:opacity-100',
              'ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus:outline-hidden',
              'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
              'disabled:pointer-events-none',
              '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4'
            )}
            data-slot="fixed-size-dialog-close"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
FixedSizeDialog.displayName = 'FixedSizeDialog';

/**
 * FixedSizeDialogTitle - Fixed header section that stays at the top
 *
 * The title remains at the top of the dialog (doesn't scroll) due to the parent's
 * flexbox layout with `flex-col` and this element's `shrink-0` property.
 */
export const FixedSizeDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="fixed-size-dialog-title"
      className={cn(
        // Fixed at top via parent flexbox (shrink-0 prevents shrinking)
        'shrink-0 border-b border-border',
        // Padding and spacing
        'px-6 py-4',
        // Typography
        'text-lg font-semibold leading-none text-foreground',
        // Background for proper overlay when scrolling
        'bg-background',
        className
      )}
      {...props}
    />
  );
});
FixedSizeDialogTitle.displayName = 'FixedSizeDialogTitle';

/**
 * FixedSizeDialogDescription - Optional description for accessibility
 *
 * Provides additional context for screen readers (WCAG requirement).
 */
export const FixedSizeDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="fixed-size-dialog-description"
      className={cn(
        'text-sm text-muted-foreground',
        // Padding to match dialog spacing
        'px-6 pt-4 pb-4',
        className
      )}
      {...props}
    />
  );
});
FixedSizeDialogDescription.displayName = 'FixedSizeDialogDescription';

interface FixedSizeDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * FixedSizeDialogContent - Scrollable main content area
 */
export const FixedSizeDialogContent = React.forwardRef<HTMLDivElement, FixedSizeDialogContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="fixed-size-dialog-content"
        className={cn(
          // Flex grow to fill available space
          'flex-1 overflow-y-auto',
          // Padding
          'p-6',
          // Add bottom padding when there are actions to prevent content from being hidden
          'pb-6',
          className
        )}
        {...props}
      />
    );
  }
);
FixedSizeDialogContent.displayName = 'FixedSizeDialogContent';

interface FixedSizeDialogSidebarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Optional title for the sidebar that aligns with the main dialog title
   */
  title?: React.ReactNode;
  /**
   * Custom width classes for the sidebar
   * @default 'w-full sm:w-64'
   */
  widthClassName?: string;
}

/**
 * FixedSizeDialogSidebar - Optional sidebar with its own title that aligns with main title
 */
export const FixedSizeDialogSidebar = React.forwardRef<HTMLDivElement, FixedSizeDialogSidebarProps>(
  ({ className, title, widthClassName = 'w-full sm:w-64', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="fixed-size-dialog-sidebar"
        className={cn(
          // Flex layout
          'flex shrink-0 flex-col',
          // Width (customizable via widthClassName)
          widthClassName,
          // Border
          'border-r border-border',
          // Background
          'bg-background',
          className
        )}
        {...props}
      >
        {title && (
          <div
            data-slot="fixed-size-dialog-sidebar-title"
            className={cn(
              // Match main title height and padding for alignment
              'shrink-0 border-b border-border px-6 py-4',
              // Typography
              'text-sm font-medium text-foreground',
              // Background
              'bg-background'
            )}
          >
            {title}
          </div>
        )}
        <div
          className={cn(
            // Scrollable sidebar content
            'flex-1 overflow-y-auto',
            // Padding
            'p-4'
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
FixedSizeDialogSidebar.displayName = 'FixedSizeDialogSidebar';

interface FixedSizeDialogActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * FixedSizeDialogActions - Fixed footer section for action buttons
 *
 * The actions remain at the bottom of the dialog (doesn't scroll) due to the parent's
 * flexbox layout with `flex-col` and this element's `shrink-0` property.
 */
export const FixedSizeDialogActions = React.forwardRef<HTMLDivElement, FixedSizeDialogActionsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="fixed-size-dialog-actions"
        className={cn(
          // Fixed at bottom via parent flexbox (shrink-0 prevents shrinking)
          'shrink-0 border-t border-border',
          // Padding and spacing
          'px-6 py-4',
          // Flex layout for buttons
          'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
          // Background for proper overlay when scrolling
          'bg-background',
          className
        )}
        {...props}
      />
    );
  }
);
FixedSizeDialogActions.displayName = 'FixedSizeDialogActions';

// Re-export base Dialog components for convenience
export { Dialog, DialogTrigger, DialogClose, DialogDescription } from './dialog';
