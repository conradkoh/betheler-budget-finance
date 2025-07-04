import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRight,
  Calendar,
  Check,
  Copy,
  Infinity as InfinityIcon,
  Link,
  Loader2,
} from 'lucide-react';
import NextLink from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteAllShares } from './DeleteAllShares';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string | null;
  expiryDate: string | null;
  isPermanent?: boolean;
  onGenerateNew: (expirationDays: number | 'never') => void;
}

export function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  expiryDate,
  isPermanent = false,
  onGenerateNew,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [expirationDays, setExpirationDays] = useState('never');
  const [activeTab, setActiveTab] = useState<string>(shareUrl ? 'share' : 'create');

  // Get recent shares for the current user
  const allShares = useSessionQuery(api.sharing.listUserShares);

  // Take only the most recent 3 shares
  const recentShares = useMemo(() => {
    if (!allShares) return [];
    return allShares.slice(0, 3);
  }, [allShares]);

  const handleCopy = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [shareUrl]);

  const handleExpirationChange = useCallback((value: string) => {
    setExpirationDays(value);
  }, []);

  const handleGenerateNew = useCallback(() => {
    // Pass 'never' to indicate no expiration
    onGenerateNew(expirationDays === 'never' ? 'never' : Number.parseInt(expirationDays, 10));
    // Switch to share tab after generating
  }, [expirationDays, onGenerateNew]);

  // Handler for copying share link from recent shares
  const handleCopyRecentLink = useCallback(async (shareId: string) => {
    try {
      const shareUrl = `${window.location.origin}/shared/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      // Optional: Set copied state for feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Expenses</DialogTitle>
          <DialogDescription>
            Create and manage links to share your expenses with others.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="create">Create Link</TabsTrigger>
            <TabsTrigger value="share">Recent Shares</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            {shareUrl ? (
              <>
                <div className="flex items-center space-x-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button size="icon" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPermanent ? (
                    <span className="flex items-center gap-1">
                      <InfinityIcon className="h-4 w-4" /> This link will never expire
                    </span>
                  ) : (
                    `This link will expire on ${expiryDate}`
                  )}
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">Choose how long the share link should be valid:</p>
                <Select value={expirationDays} onValueChange={handleExpirationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="never">
                      <span className="flex items-center gap-1">
                        <InfinityIcon className="h-4 w-4" /> No expiration
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleGenerateNew} className="w-full">
                  Generate Link
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="share" className="space-y-4 min-h-[120px]">
            {allShares === undefined ? (
              <div className="py-4 flex justify-center items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading shares...</span>
              </div>
            ) : allShares.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No active share links.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Switch to "Create Link" tab to share your expenses.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Your Recent Shares</h3>
                  <DeleteAllShares
                    variant="ghost"
                    size="sm"
                    compact={true}
                    className="text-destructive h-7"
                  />
                </div>

                <div className="space-y-3">
                  {recentShares.map((share) => {
                    // Format relative time (e.g., "2 days ago")
                    const timeAgo = formatDistanceToNow(new Date(share.createdAt), {
                      addSuffix: true,
                    });

                    return (
                      <div
                        key={share._id}
                        className="border rounded-md p-3 bg-card/50 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{share.formattedPeriod}</p>
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
                          onClick={() => handleCopyRecentLink(share.shareId)}
                        >
                          <Link className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}

                  {allShares.length > 3 && (
                    <NextLink href="/shares" onClick={onClose}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between text-xs mt-2"
                      >
                        View all shares
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </NextLink>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-between mt-2">
          {shareUrl && activeTab === 'create' && (
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab('create');
                handleGenerateNew();
              }}
            >
              Create New Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
