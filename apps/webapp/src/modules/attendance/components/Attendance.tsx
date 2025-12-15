import { CheckCircle2, ChevronDown, Copy, MoreVertical, UserPlus, X, XCircle } from 'lucide-react';
// External imports
import { Suspense, useCallback, useEffect, useState } from 'react';

// UI component imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Internal imports
import { isCurrentUser, useAttendanceData } from '../hooks/useAttendanceData';
import { AttendanceCopyDialog } from './AttendanceCopyDialog';
import { AttendanceDialog } from './AttendanceDialog';
import { AttendanceEmptyState } from './AttendanceEmptyState';

/**
 * Props for the Attendance component.
 */
export interface AttendanceModuleProps {
  attendanceKey: string;
  title: string;
  expectedNames?: string[];
  remarksPlaceholder?: string;
}

/**
 * Main attendance content component that handles attendance list display and interactions.
 * Uses useSearchParams internally so it's wrapped in Suspense by the parent component.
 */
const _AttendanceContent = ({
  attendanceKey,
  title = 'Attendance',
  expectedNames = [],
  remarksPlaceholder,
}: AttendanceModuleProps) => {
  // Use the custom hook for all data management
  const {
    attendanceData,
    attendanceRecords,
    attendanceMap,
    allNames,
    pendingNames,
    filteredRespondedNames,
    modalFilteredNames,
    attendingCount,
    notAttendingCount,
    pendingCount,
    respondedAttendingCount,
    respondedNotAttendingCount,
    activeTab,
    searchQuery,
    modalSearchQuery,
    statusFilter,
    isAuthenticated,
    currentUser,
    isCurrentUserRegistered,
    setSearchQuery,
    setModalSearchQuery,
    setStatusFilter,
    handleTabChange,
  } = useAttendanceData({ attendanceKey, expectedNames });

  // Local component state
  const [_expanded, _setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [isManualJoin, setIsManualJoin] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  /**
   * Handle successful attendance submission by switching to responded tab.
   */
  const handleAttendanceSuccess = useCallback(() => {
    handleTabChange('responded');
  }, [handleTabChange]);

  /**
   * Handle joining the attendance list by opening the dialog with appropriate defaults.
   */
  const handleJoin = useCallback(() => {
    const defaultName = isAuthenticated && currentUser ? currentUser.name : '';
    setSelectedPerson(defaultName);
    setIsManualJoin(true);
    setDialogOpen(true);
  }, [isAuthenticated, currentUser]);

  /**
   * Handle clicking on a person's name to edit their attendance status.
   */
  const handlePersonClick = useCallback(
    (name: string) => {
      setSelectedPerson(name);
      const wasInExpectedList = expectedNames?.includes(name);
      setIsManualJoin(!wasInExpectedList);
      setDialogOpen(true);
    },
    [expectedNames]
  );

  /**
   * Handle closing the attendance dialog and resetting state.
   */
  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setSelectedPerson('');
    setIsManualJoin(false);
  }, []);

  /**
   * Reset modal search when the full list modal is opened.
   */
  useEffect(() => {
    if (showFullListModal) {
      setModalSearchQuery('');
    }
  }, [showFullListModal, setModalSearchQuery]);

  return (
    <>
      <div className="pb-3">
        <h2 className="text-lg flex justify-between items-center">
          <span>{title}</span>
          <div className="flex items-center space-x-2">
            {attendanceData === undefined ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {attendingCount}
                </Badge>
                <Badge variant="outline" className="bg-red-50 dark:bg-red-950/20">
                  <XCircle className="h-3 w-3 mr-1" /> {notAttendingCount}
                </Badge>
                {pendingCount > 0 && <Badge variant="outline">{pendingCount} pending</Badge>}

                {/* Action Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setShowCopyDialog(true)}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy List as Text
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </h2>
      </div>

      <div>
        {attendanceData === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search names..."
                className="w-full px-3 py-2 border rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Tabs
              defaultValue="responded"
              value={activeTab}
              onValueChange={(value) => handleTabChange(value as 'pending' | 'responded')}
            >
              <TabsList className="w-full mb-4">
                <TabsTrigger value="responded" className="flex-1">
                  Responded ({filteredRespondedNames.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-1">
                  Pending ({pendingNames.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="responded">
                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={statusFilter === 'attending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('attending')}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Attending
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {respondedAttendingCount}
                    </Badge>
                  </Button>
                  <Button
                    variant={statusFilter === 'not_attending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('not_attending')}
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-3 w-3 text-red-500" />
                    Not Attending
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {respondedNotAttendingCount}
                    </Badge>
                  </Button>
                  {statusFilter !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter('all')}
                      className="flex items-center gap-1 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {filteredRespondedNames.length === 0 ? (
                  <AttendanceEmptyState
                    message="No results found"
                    onJoin={handleJoin}
                    showJoinButton={!searchQuery.trim()}
                  />
                ) : (
                  <div className="space-y-2">
                    {filteredRespondedNames.slice(0, 7).map((name) => {
                      const record = attendanceMap.get(name);
                      const status = record?.status;
                      const reason = record?.reason;
                      const remarks = record?.remarks;
                      const isYou = isCurrentUser(
                        name,
                        attendanceMap,
                        isAuthenticated,
                        currentUser
                      );

                      return (
                        <div
                          key={name}
                          className="p-2 border rounded-md relative hover:bg-accent/50"
                        >
                          <button
                            className="cursor-pointer w-full text-left p-0 inline-block"
                            type="button"
                            onClick={() => handlePersonClick(name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handlePersonClick(name);
                              }
                            }}
                          >
                            <div className="flex items-center">
                              {status === 'attending' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              ) : status === 'not_attending' ? (
                                <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border mr-2 flex-shrink-0" />
                              )}
                              <span className="ml-2 text-sm">
                                {name}
                                {isYou && (
                                  <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                                )}
                              </span>
                            </div>

                            {/* Always show reason or remarks */}
                            {(status === 'not_attending' && reason) ||
                            (status === 'attending' && remarks) ? (
                              <div className="mt-1 text-sm text-muted-foreground">
                                {status === 'attending' && remarks && <p>Remarks: {remarks}</p>}
                                {status === 'not_attending' && reason && <p>Reason: {reason}</p>}
                              </div>
                            ) : null}
                          </button>
                        </div>
                      );
                    })}
                    {filteredRespondedNames.length > 7 && (
                      <Button
                        variant="ghost"
                        className="w-full mt-3 text-muted-foreground hover:text-foreground h-9 rounded-md transition-colors flex items-center justify-center"
                        onClick={() => setShowFullListModal(true)}
                      >
                        View {filteredRespondedNames.length - 7} more responses
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending">
                {pendingNames.length === 0 ? (
                  <AttendanceEmptyState
                    message="No results found"
                    onJoin={handleJoin}
                    showJoinButton={!searchQuery.trim()}
                  />
                ) : (
                  <div className="space-y-2">
                    {pendingNames.slice(0, 7).map((name) => {
                      const isYou = isCurrentUser(
                        name,
                        attendanceMap,
                        isAuthenticated,
                        currentUser
                      );
                      return (
                        <div
                          key={name}
                          className="p-2 border rounded-md relative hover:bg-accent/50"
                        >
                          <button
                            className="cursor-pointer w-full text-left p-0 inline-block"
                            type="button"
                            onClick={() => handlePersonClick(name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handlePersonClick(name);
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <div className="h-4 w-4 rounded-full border mr-2 flex-shrink-0" />
                              <span className="ml-2 text-sm">
                                {name}
                                {isYou && (
                                  <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                                )}
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                    {pendingNames.length > 7 && (
                      <Button
                        variant="ghost"
                        className="w-full mt-3 text-muted-foreground hover:text-foreground h-9 rounded-md transition-colors flex items-center justify-center"
                        onClick={() => setShowFullListModal(true)}
                      >
                        View {pendingNames.length} pending responses
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Join button below component */}
            {(!isAuthenticated || !isCurrentUserRegistered) && (
              <div className="mt-6 text-center">
                <p className="text-muted-foreground mb-2">Don't see your name?</p>
                <Button
                  onClick={handleJoin}
                  className="flex items-center justify-center mx-auto w-fit"
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join the list
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full list modal */}
      <Dialog open={showFullListModal} onOpenChange={setShowFullListModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'pending'
                ? 'Pending Responses'
                : statusFilter === 'all'
                  ? 'All Responses'
                  : statusFilter === 'attending'
                    ? 'Attending Responses'
                    : 'Not Attending Responses'}{' '}
              ({modalFilteredNames.length})
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search names..."
              className="w-full px-3 py-2 border rounded-md"
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
            />
          </div>
          <div className="h-[350px]">
            <ScrollArea className="h-full">
              {modalFilteredNames.length > 0 ? (
                <div className="space-y-2">
                  {modalFilteredNames.map((name) => {
                    const record = attendanceMap.get(name);
                    const status = record?.status;
                    const reason = record?.reason;
                    const remarks = record?.remarks;
                    const isYou = isCurrentUser(name, attendanceMap, isAuthenticated, currentUser);

                    return (
                      <div key={name} className="p-2 border rounded-md relative hover:bg-accent/50">
                        <button
                          className="cursor-pointer w-full text-left p-0 inline-block"
                          type="button"
                          onClick={() => {
                            setSelectedPerson(name);
                            const wasInExpectedList = expectedNames?.includes(name);
                            setIsManualJoin(!wasInExpectedList);
                            setDialogOpen(true);
                            setShowFullListModal(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setSelectedPerson(name);
                              const wasInExpectedList = expectedNames?.includes(name);
                              setIsManualJoin(!wasInExpectedList);
                              setDialogOpen(true);
                              setShowFullListModal(false);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            {status === 'attending' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            ) : status === 'not_attending' ? (
                              <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border mr-2 flex-shrink-0" />
                            )}
                            <span className="ml-2 text-sm">
                              {name}
                              {isYou && (
                                <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                              )}
                            </span>
                          </div>

                          {/* Always show reason or remarks */}
                          {(status === 'not_attending' && reason) ||
                          (status === 'attending' && remarks) ? (
                            <div className="mt-1 text-sm text-muted-foreground">
                              {status === 'attending' && remarks && <p>Remarks: {remarks}</p>}
                              {status === 'not_attending' && reason && <p>Reason: {reason}</p>}
                            </div>
                          ) : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <AttendanceEmptyState
                  message="No results found"
                  onJoin={() => {
                    setShowFullListModal(false);
                    handleJoin();
                  }}
                  showJoinButton={!modalSearchQuery.trim()}
                />
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Copy Configuration Dialog */}
      <AttendanceCopyDialog
        isOpen={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        title={title}
        activeTab={activeTab}
        statusFilter={statusFilter}
        allNames={allNames}
        attendanceMap={attendanceMap}
      />

      {dialogOpen && attendanceRecords && (
        <AttendanceDialog
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          personName={selectedPerson}
          attendanceKey={attendanceKey}
          attendanceRecords={attendanceRecords}
          onSuccess={handleAttendanceSuccess}
          isManuallyJoined={isManualJoin}
          remarksPlaceholder={remarksPlaceholder}
        />
      )}
    </>
  );
};

/**
 * Main Attendance component with Suspense boundary for handling async operations.
 * Provides attendance tracking functionality with tabs for pending and responded users.
 */
export const Attendance = (props: AttendanceModuleProps) => {
  return (
    <Suspense
      fallback={
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <_AttendanceContent {...props} />
    </Suspense>
  );
};
