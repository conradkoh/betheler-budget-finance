'use client';

import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DiscussionFormProps {
  initialName?: string;
  onSubmit: (name: string, message: string) => Promise<boolean>;
  onCancel?: () => void;
}

export function DiscussionForm({ initialName = '', onSubmit, onCancel }: DiscussionFormProps) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!name.trim() || !message.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        const success = await onSubmit(name, message);
        if (success) {
          // Clear message but keep name for future submissions
          setMessage('');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, message, onSubmit, isSubmitting]
  );

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to submit the form
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" ref={formRef}>
      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Your Thoughts</Label>
        <Textarea
          id="message"
          placeholder="Share your thoughts..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          required
          disabled={isSubmitting}
          className="w-full min-h-[100px]"
        />
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !name.trim() || !message.trim()}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}
