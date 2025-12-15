'use client';

import { useEffect } from 'react';

/**
 * Detects if the current device is an iPhone.
 * This hook is specifically needed for iPhone devices where
 * react-remove-scroll blocks text selection handle dragging.
 */
function isIphone(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone/i.test(navigator.userAgent);
}

/**
 * Fixes iOS text selection handles not being draggable in dialogs.
 *
 * This hook intercepts touchmove events and stops propagation when
 * a text selection is active, preventing react-remove-scroll from
 * blocking the native iOS text selection handle dragging behavior.
 *
 * @see https://github.com/theKashey/react-remove-scroll/pull/144
 * @see https://github.com/shadcn-ui/ui/issues/5919
 */
export function useAllowTouchSelection(): void {
  useEffect(() => {
    if (!isIphone()) {
      return;
    }

    const nonPassive = { passive: false } as const;

    const checkTouchingSelection = (event: TouchEvent): void => {
      // If there's an active text selection, stop react-remove-scroll listeners
      // from intercepting the touch event
      if (document.getSelection()?.anchorNode) {
        event.stopImmediatePropagation();
        return;
      }
      // Let other listeners execute as usual
    };

    document.addEventListener('touchmove', checkTouchingSelection, nonPassive);

    return () => {
      document.removeEventListener(
        'touchmove',
        checkTouchingSelection,
        nonPassive as EventListenerOptions
      );
    };
  }, []);
}
