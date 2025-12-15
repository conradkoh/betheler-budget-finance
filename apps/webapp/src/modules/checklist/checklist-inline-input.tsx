'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

/**
 * Props for the ChecklistInlineInput component.
 */
export interface ChecklistInlineInputProps {
  onSubmit: (text: string) => Promise<boolean>;
  getAndClearFailedText?: () => string | null;
  placeholder?: string;
  className?: string;
}

/**
 * Inline input component for adding new checklist items.
 * Provides a streamlined interface for quick item creation with automatic focus management,
 * error recovery, and optimistic submission handling.
 *
 * Features:
 * - Automatic focus management after submission
 * - Failed text recovery for retry scenarios
 * - Optimistic submission with immediate text clearing
 * - Keyboard shortcuts (Enter to submit)
 * - Visual feedback with dashed border styling
 *
 * @param onSubmit - Function to handle item submission, returns success status
 * @param getAndClearFailedText - Optional function to recover failed submission text
 * @param placeholder - Placeholder text for the input field
 * @param className - Additional CSS classes for the container
 */
export function ChecklistInlineInput({
  onSubmit,
  getAndClearFailedText,
  placeholder = 'Add new item...',
  className,
}: ChecklistInlineInputProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for failed text on mount and when getAndClearFailedText changes
  useEffect(() => {
    if (getAndClearFailedText) {
      const failedText = getAndClearFailedText();
      if (failedText) {
        setText(failedText);
        // Focus the input to draw attention to the recovered text
        _focusAndPositionCursor(inputRef, failedText);
      }
    }
  }, [getAndClearFailedText]);

  // Focus after successful submission (when text is cleared)
  useLayoutEffect(() => {
    if (shouldFocus && text === '' && !isSubmitting) {
      inputRef.current?.focus();
      setShouldFocus(false);
    }
  }, [text, shouldFocus, isSubmitting]);

  /**
   * Handles form submission with optimistic updates and error recovery.
   * Clears the input immediately for better UX and restores text on failure.
   */
  const handleSubmit = useCallback(async () => {
    // Allow submission even if another is in progress, but prevent empty submissions
    if (!text.trim()) return;

    const currentText = text.trim();
    setIsSubmitting(true);

    // Clear the text immediately to allow new input
    setText('');
    setShouldFocus(true);

    try {
      const success = await onSubmit(currentText);
      if (!success) {
        // If submission failed, restore the text
        setText(currentText);
        setShouldFocus(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [text, onSubmit]);

  /**
   * Handles keyboard events for form submission.
   * Submits on Enter key press (without Shift modifier).
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  /**
   * Memoized change handler to prevent unnecessary re-renders.
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  }, []);

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="border-dashed border-gray-300 focus:border-solid focus:border-gray-400 focus:ring-2 focus:ring-offset-1"
      />
    </div>
  );
}

/**
 * Focuses the input and positions cursor at the end of the text.
 * Internal helper function for focus management.
 */
function _focusAndPositionCursor(inputRef: React.RefObject<HTMLInputElement | null>, text: string) {
  setTimeout(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(text.length, text.length);
    }
  }, 100);
}
