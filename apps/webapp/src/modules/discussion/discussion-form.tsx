'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface DiscussionFormProps {
  initialName?: string;
  onSubmit: (name: string, message: string) => Promise<boolean>;
  onCancel?: () => void;
}

export function DiscussionForm({ initialName = '', onSubmit, onCancel }: DiscussionFormProps) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !message.trim()) return;

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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
