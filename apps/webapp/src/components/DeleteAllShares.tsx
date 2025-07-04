'use client';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface DeleteAllSharesProps {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  compact?: boolean;
}

export function DeleteAllShares({
  variant = 'destructive',
  size = 'sm',
  className = '',
  compact = false,
}: DeleteAllSharesProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const deleteAllShareLinks = useSessionMutation(api.sharing.deleteAllShareLinks);

  const handleDeleteAll = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteAllShareLinks({});
      setOpen(false);
    } catch (error) {
      console.error('Error deleting all share links:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAllShareLinks]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isDeleting}>
          <Trash2 className={`h-4 w-4 ${compact ? '' : 'mr-2'}`} />
          {!compact && 'Delete All Shares'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Shares?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all your active share links. Anyone who has these links
            will no longer be able to access your shared expenses. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleDeleteAll();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete All'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
