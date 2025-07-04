'use client';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { Loader2 } from 'lucide-react';
import { SharesListItem } from './SharesListItem';

export function SharesList() {
  // Get all shares for the current user with a refresh key to force refetching
  const shares = useSessionQuery(api.sharing.listUserShares);

  // If shares are still loading
  if (shares === undefined) {
    return (
      <div className="py-8 text-center flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading your shares...</span>
      </div>
    );
  }

  // If no shares found
  if (shares.length === 0) {
    return (
      <div className="py-6 text-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">You don't have any active share links.</p>
        <p className="mt-2">Create a share from the Dashboard to share your expenses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shares.map((share) => (
        <SharesListItem key={share._id} share={share} />
      ))}
    </div>
  );
}
