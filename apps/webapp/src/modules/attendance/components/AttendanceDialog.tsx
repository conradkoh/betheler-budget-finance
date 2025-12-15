import { api } from '@workspace/backend/convex/_generated/api';
import type { Doc, Id } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { Loader2, Trash2, UserCog, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AttendanceStatus } from '../types';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/modules/auth/AuthProvider';

interface AttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personName: string;
  attendanceKey?: string;
  attendanceRecords: Doc<'attendanceRecords'>[];
  onSuccess?: () => void;
  isManuallyJoined: boolean;
  remarksPlaceholder?: string;
}

/**
 * Dialog component for recording attendance with support for authenticated and anonymous users.
 * Handles attendance status, reasons, remarks, and allows editing/deleting existing records.
 */
export function AttendanceDialog({
  isOpen,
  onClose,
  personName,
  attendanceKey,
  attendanceRecords,
  onSuccess,
  isManuallyJoined,
  remarksPlaceholder,
}: AttendanceDialogProps) {
  const currentUser = useCurrentUser();
  const isAuthenticated = currentUser !== undefined;

  // Find existing record for this person
  const existingRecord = attendanceRecords.find((record) => record.name === personName);

  // If the existing record belongs to the current user
  const isCurrentUserResponse = existingRecord?.userId
    ? existingRecord?.userId === currentUser?._id
    : false;

  const userAlreadyResponded = isAuthenticated
    ? attendanceRecords.some((record) => record.userId === currentUser?._id)
    : false;
  const defaultRespondAs = isCurrentUserResponse
    ? 'self'
    : !existingRecord && isAuthenticated && !userAlreadyResponded
      ? 'self'
      : 'other';

  const [respondAs, setRespondAs] = useState<'self' | 'other'>(defaultRespondAs);
  const [status, setStatus] = useState<AttendanceStatus>(
    (existingRecord?.status as AttendanceStatus) || AttendanceStatus.ATTENDING
  );
  const [reason, setReason] = useState(existingRecord?.reason || '');
  const [remarks, setRemarks] = useState(existingRecord?.remarks || '');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [enteredName, setEnteredName] = useState(personName || '');

  const recordAttendance = useSessionMutation(api.attendance.recordAttendance);
  const deleteAttendanceRecord = useSessionMutation(api.attendance.deleteAttendanceRecord);

  useEffect(() => {
    // Automatically set the respond as to the default if the default changes
    setRespondAs(defaultRespondAs);
  }, [defaultRespondAs]);

  useEffect(() => {
    // Set initial status and reason from existing record if available
    if (existingRecord) {
      setStatus((existingRecord.status as AttendanceStatus) || AttendanceStatus.ATTENDING);
      setReason(existingRecord.reason || '');
      setRemarks(existingRecord.remarks || '');
    }
  }, [existingRecord]);

  useEffect(() => {
    setEnteredName(personName || '');
  }, [personName]);

  const handleSubmit = useCallback(async () => {
    const nameToUse = !isAuthenticated || !personName ? enteredName : personName;

    if (!nameToUse.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      if (respondAs === 'self' && isAuthenticated) {
        await recordAttendance({
          name: nameToUse,
          attendanceKey,
          status,
          reason: status === AttendanceStatus.NOT_ATTENDING ? reason : undefined,
          remarks: status === AttendanceStatus.ATTENDING ? remarks : undefined,
          self: true,
          isManuallyJoined,
        });
        toast.success('Your attendance has been recorded');
      } else {
        await recordAttendance({
          attendanceKey,
          name: nameToUse,
          status,
          reason: status === AttendanceStatus.NOT_ATTENDING ? reason : undefined,
          remarks: status === AttendanceStatus.ATTENDING ? remarks : undefined,
          self: false,
          isManuallyJoined,
        });
        toast.success(`Attendance recorded for ${nameToUse}`);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Failed to record attendance:', error);
      toast.error('Failed to record attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    attendanceKey,
    isAuthenticated,
    onClose,
    onSuccess,
    personName,
    enteredName,
    reason,
    recordAttendance,
    respondAs,
    status,
    remarks,
    isManuallyJoined,
  ]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Enter or Ctrl+Enter to save
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSubmit]);

  const handleDelete = useCallback(async () => {
    if (!existingRecord) return;

    const nameToUse = !isAuthenticated || !personName ? enteredName : personName;

    setDeleteLoading(true);
    try {
      await deleteAttendanceRecord({
        recordId: existingRecord._id as Id<'attendanceRecords'>,
      });
      toast.success(`Deleted attendance record for ${nameToUse}`);
      onClose();
    } catch (error) {
      console.error('Failed to delete attendance record:', error);
      toast.error('Failed to delete attendance record. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  }, [existingRecord, isAuthenticated, personName, enteredName, deleteAttendanceRecord, onClose]);

  // Check if current user can modify this record
  const canDelete =
    existingRecord &&
    // User can delete their own record
    ((isAuthenticated && existingRecord.userId === currentUser?._id) ||
      // User can delete anonymous records
      !existingRecord.userId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Record Attendance</DialogTitle>
          <DialogDescription className="text-sm opacity-80 mt-1">
            {isAuthenticated
              ? 'Record attendance for yourself or for someone else.'
              : personName
                ? `Record attendance for ${personName}.`
                : 'Enter your name and record your attendance.'}
          </DialogDescription>
        </DialogHeader>
        <div>
          <Separator className="mb-2" />

          <div className="space-y-2">
            {/* Name input for anonymous users or when no name is provided */}
            {(!isAuthenticated || !personName) && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <Label htmlFor="name-input" className="text-sm font-medium">
                  Your Name
                </Label>
                <Input
                  id="name-input"
                  value={enteredName}
                  onChange={(e) => setEnteredName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full"
                />
              </div>
            )}

            {isAuthenticated && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <Label htmlFor="respond-as" className="text-sm font-medium">
                  Who are you responding as?
                </Label>
                <Select
                  value={respondAs}
                  onValueChange={(value) => setRespondAs(value as 'self' | 'other')}
                >
                  <SelectTrigger id="respond-as" className="w-full">
                    <SelectValue placeholder="Select who to respond as" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">
                      <div className="flex items-center">
                        <UserRound className="mr-2 h-4 w-4" />
                        <span>Myself ({currentUser?.name})</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center">
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>{personName}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <Label htmlFor="status" className="text-sm font-medium mb-2">
                  Attendance Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as AttendanceStatus)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select attendance status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AttendanceStatus.ATTENDING}>Attending</SelectItem>
                    <SelectItem value={AttendanceStatus.NOT_ATTENDING}>Not Attending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === AttendanceStatus.NOT_ATTENDING && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="reason" className="text-sm font-medium">
                    Reason (optional)
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why can't you attend?"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}

              {status === AttendanceStatus.ATTENDING && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="remarks" className="text-sm font-medium">
                    Remarks (optional)
                  </Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={remarksPlaceholder || 'Any remarks or suggestions?'}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}
            </div>

            <div>
              {canDelete && (
                <>
                  <Separator className="my-4" />
                  <div className="flex justify-center items-center gap-4">
                    <div className="text-sm text-muted-foreground">OR</div>
                    <div className="flex justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="w-fit"
                      >
                        {deleteLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" /> Delete this response
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <Separator className="my-4" />
        </div>

        <DialogFooter className="flex justify-between items-end pt-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} size="sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
