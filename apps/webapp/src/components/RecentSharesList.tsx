'use client';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRight,
  Calendar,
  Infinity as InfinityIcon,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';

export function RecentSharesList() {
  // Get all shares for the current user
  const allShares = useSessionQuery(api.sharing.listUserShares);

  // Take only the most recent 3 shares
  const recentShares = useMemo(() => {
    if (!allShares) return [];
    return allShares.slice(0, 3);
  }, [allShares]);

  // Handler for copying share link
  const handleCopyLink = useCallback(async (shareId: string) => {
    try {
      const shareUrl = `${window.location.origin}/shared/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      // Optional: Add toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, []);

  // If shares are still loading
  if (allShares === undefined) {
    return (
      <div className="py-4 flex justify-center items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Loading shares...</span>
      </div>
    );
  }

  // If no shares found
  if (allShares.length === 0) {
    return (
      <div className="py-3 text-center">
        <p className="text-sm text-muted-foreground">No active share links.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentShares.map((share) => {
        // Format relative time (e.g., "2 days ago")
        const timeAgo = formatDistanceToNow(new Date(share.createdAt), { addSuffix: true });

        return (
          <div
            key={share._id}
            className="border rounded-md p-3 bg-card/50 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Expenses for {share.formattedPeriod}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {timeAgo}
                </span>
                {share.permanent && (
                  <span className="flex items-center gap-1">
                    <InfinityIcon className="h-3 w-3" />
                    Never expires
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => handleCopyLink(share.shareId)}
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}

      {allShares.length > 3 && (
        <div className="pt-1">
          <Link href="/shares">
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              View all shares
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
