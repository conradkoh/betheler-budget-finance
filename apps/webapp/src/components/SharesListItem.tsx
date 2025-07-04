'use client';
import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Infinity as InfinityIcon, Link, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SharesListItemProps {
  share: {
    _id: Id<'shareLinks'>;
    shareId: string;
    formattedPeriod: string;
    createdAt: number;
    formattedCreatedAt: string;
    permanent: boolean;
    expiresAtLabel: string;
  };
}

export function SharesListItem({ share }: SharesListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteShareLink = useSessionMutation(api.sharing.deleteShareLink);

  // Generate share URL
  const shareUrl = `${window.location.origin}/shared/${share.shareId}`;

  // Format relative time (e.g., "2 days ago")
  const timeAgo = formatDistanceToNow(new Date(share.createdAt), { addSuffix: true });

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Optional: Add toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [shareUrl]);

  const handleDelete = useCallback(async () => {
    if (confirm('Are you sure you want to delete this share link? This cannot be undone.')) {
      try {
        setIsDeleting(true);
        await deleteShareLink({
          shareLinkId: share._id,
        });
      } catch (error) {
        console.error('Error deleting share link:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  }, [deleteShareLink, share._id]);

  return (
    <div className="border rounded-lg p-3 bg-card flex items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <h3 className="font-medium text-sm truncate">Expenses for {share.formattedPeriod}</h3>
        </div>

        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {timeAgo}
          </span>

          {share.permanent ? (
            <span className="flex items-center gap-1">
              <InfinityIcon className="h-3 w-3" />
              Never expires
            </span>
          ) : (
            <span>Expires on {new Date(share.expiresAtLabel).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopyLink}
          title="Copy share link"
        >
          <Link className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete share"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
