import { UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface AttendanceEmptyStateProps {
  message: string;
  onJoin: () => void;
  showJoinButton?: boolean;
}

export const AttendanceEmptyState = ({
  message,
  onJoin,
  showJoinButton = true,
}: AttendanceEmptyStateProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4 py-10">
      <p className="font-bold">{message}</p>
      {showJoinButton && (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-muted-foreground text-sm">Don't see your name?</p>
          <Button variant="outline" onClick={onJoin} className="flex items-center">
            <UserPlus className="h-4 w-4 mr-2" /> Join the list now
          </Button>
        </div>
      )}
    </div>
  );
};
