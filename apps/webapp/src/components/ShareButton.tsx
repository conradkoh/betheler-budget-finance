import { api } from '@workspace/backend/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useSessionId } from 'convex-helpers/react/sessions';
import { Share } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShareModal } from './ShareModal';

interface ShareButtonProps {
  year: number;
  month: number;
  className?: string;
}

export function ShareButton({ year, month, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);

  const [sessionId] = useSessionId();
  const createShareLink = useMutation(api.sharing.createShareLink);

  const handleShare = useCallback(
    async (expirationValue: number | 'never') => {
      if (!sessionId) return;

      setIsLoading(true);

      try {
        // If 'never', pass undefined for expirationDays to make a permanent link
        const expirationDays = expirationValue === 'never' ? undefined : expirationValue;

        const result = await createShareLink({
          sessionId,
          year,
          month,
          expirationDays,
        });

        const shareUrl = `${window.location.origin}/shared/${result.shareId}`;
        setShareUrl(shareUrl);

        // Handle permanent links
        setIsPermanent(result.expiresAtLabel === 'Never');

        // Format expiry date if not permanent
        if (result.expiresAt) {
          const expiryDate = new Date(result.expiresAt);
          setExpiryDate(expiryDate.toLocaleDateString());
        } else {
          setExpiryDate(null);
        }

        setIsOpen(true);
      } catch (error) {
        console.error('Error creating share link:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, createShareLink, year, month]
  );

  const _handleOpenModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
      >
        <Share className="w-4 h-4 mr-2" />
        {isLoading ? 'Generating...' : 'Share'}
      </Button>

      <ShareModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        shareUrl={shareUrl}
        expiryDate={expiryDate}
        isPermanent={isPermanent}
        onGenerateNew={handleShare}
      />
    </>
  );
}
