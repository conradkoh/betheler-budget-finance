'use client';

import { usePresentationContext } from '../../modules/presentation/presentation-container';

import { cn } from '@/lib/utils';

interface SlideProps {
  index: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Slide component - Renders a single presentation slide
 * Only renders when it's the active slide (matching currentSlide)
 * Uses flex layout for proper content centering and responsive design
 */
export function Slide({ index, children, className }: SlideProps) {
  const { currentSlide } = usePresentationContext();
  const isActive = currentSlide === index;

  if (!isActive) return null;

  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center p-2 lg:p-8',
        'animate-in fade-in duration-500',
        className
      )}
    >
      {children}
    </div>
  );
}
