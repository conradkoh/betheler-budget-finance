'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { useAllowTouchSelection } from '@/hooks/useAllowTouchSelection';
import { cn } from '@/lib/utils';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" modal {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  onEscapeKeyDown,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  // Fix iOS text selection handles not being draggable
  // Must be called before react-remove-scroll attaches its listeners
  // https://github.com/theKashey/react-remove-scroll/pull/144
  useAllowTouchSelection();

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className
        )}
        onEscapeKeyDown={onEscapeKeyDown}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

/**
 * Fullscreen-safe dialog content variant optimized for mobile devices.
 *
 * ## Purpose
 * This component solves positioning issues that occur with the standard DialogContent
 * on mobile devices, particularly iOS Safari, where:
 * - The viewport height changes dynamically when the keyboard appears
 * - Transform-based centering (translate-x/y) can cause layout shifts
 * - Content may be cut off or positioned incorrectly
 *
 * ## How It Works
 * Instead of using `top-[50%] left-[50%] translate-x/y-[-50%]` for centering,
 * this component uses `fixed inset-0 m-auto` which:
 * - Adapts better to dynamic viewport changes
 * - Doesn't rely on CSS transforms that can conflict with other positioning
 * - Provides more predictable fullscreen behavior on touch devices
 *
 * ## Usage
 * Use this component instead of DialogContent when you need fullscreen or
 * near-fullscreen dialogs on mobile devices:
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger>Open</DialogTrigger>
 *   <FullscreenDialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Mobile-Optimized Dialog</DialogTitle>
 *     </DialogHeader>
 *     <div>Your content here</div>
 *   </FullscreenDialogContent>
 * </Dialog>
 * ```
 *
 * ## When to Use
 * - Mobile-first UIs where dialogs should take up most of the screen
 * - Forms with keyboards that push content around
 * - iOS Safari where viewport units behave unpredictably
 * - Touch-optimized interfaces that need consistent positioning
 *
 * ## When NOT to Use
 * - Desktop-only applications (use standard DialogContent)
 * - Small confirmation dialogs (standard DialogContent is better)
 * - When you need precise control over dialog width (use DialogContent with custom classes)
 *
 * ## Implementation Notes
 * This component uses DialogPrimitive.Content directly (not wrapping DialogContent)
 * to avoid CSS specificity conflicts. It includes its own overlay and close button.
 *
 * @see {@link DialogContent} for the standard centered dialog variant
 */
export const FullscreenDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onEscapeKeyDown, ...props }, ref) => {
  // Fix iOS text selection handles not being draggable
  // Must be called before react-remove-scroll attaches its listeners
  // https://github.com/theKashey/react-remove-scroll/pull/144
  useAllowTouchSelection();

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          'fixed inset-0 z-50 m-auto grid gap-4 border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg',
          className
        )}
        onEscapeKeyDown={onEscapeKeyDown}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
FullscreenDialogContent.displayName = 'FullscreenDialogContent';

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
