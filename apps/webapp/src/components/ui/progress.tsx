'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import type * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Progress bar component built on top of Radix UI primitives.
 * Displays a horizontal progress indicator with smooth animations.
 * Supports values from 0 to 100 representing completion percentage.
 *
 * Features:
 * - Smooth transition animations
 * - Accessible progress semantics
 * - Customizable styling via className
 * - Responsive design
 * - Support for indeterminate state (when value is undefined)
 *
 * @param className - Additional CSS classes to apply to the progress container
 * @param value - Progress value between 0 and 100, or undefined for indeterminate state
 * @param props - All other props are forwarded to the underlying Radix progress primitive
 */
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
