'use client';

import { Button } from '@/components/ui/button';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { useState } from 'react';
import { toast } from 'sonner';

export function NameEditForm() {
  const authState = useAuthState();
  const updateUserName = useSessionMutation(api.auth.updateUserName);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(authState?.state === 'authenticated' ? authState.user.name : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateUserName({
        newName: name,
      });

      if (result.success) {
        toast.success(result.message);
        setIsEditing(false);
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Failed to update name:', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to update name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(authState?.state === 'authenticated' ? authState.user.name : '');
    setError(null);
    setIsEditing(false);
  };

  if (authState?.state !== 'authenticated') {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Display Name</h2>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit Name
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="p-4 bg-secondary/50 rounded-md">
          <p className="font-medium">{authState.user.name}</p>
          {authState.user.type === 'anonymous' && (
            <p className="mt-2 text-sm text-muted-foreground">
              You can personalize your anonymous account by changing your display name.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Display Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${
                error ? 'border-destructive' : 'border-input'
              } rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring`}
              placeholder="Enter your display name"
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
            <p className="mt-1 text-sm text-muted-foreground">
              Your name must be between 3 and 30 characters.
            </p>
          </div>

          <div className="flex space-x-2 justify-end">
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Name'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
