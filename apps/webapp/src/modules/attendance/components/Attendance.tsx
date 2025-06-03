import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/modules/auth/AuthProvider';
import { api } from '@workspace/backend/convex/_generated/api';
import type { Doc } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { CheckCircle2, ChevronDown, LogIn, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { AttendanceDialog } from './AttendanceDialog';
import { AttendanceEmptyState } from './AttendanceEmptyState';

interface AttendanceModuleProps {
  attendanceKey: string;
  title: string;
  expectedNames?: string[];
}

// Internal component that uses useSearchParams
const AttendanceContent = ({
  attendanceKey,
  title = 'Attendance',
  expectedNames = [],
}: AttendanceModuleProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();
  const isAuthenticated = currentUser !== undefined;
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const attendanceData = useSessionQuery(api.attendance.getAttendanceData, {
    attendanceKey,
  });

  // Get attendance tab from URL or default
  const attendanceTabFromUrl = searchParams.get('attendanceTab');

  const [activeTab, setActiveTab] = useState<'pending' | 'responded'>(() => {
    if (attendanceTabFromUrl === 'pending' || attendanceTabFromUrl === 'responded') {
      return attendanceTabFromUrl;
    }
    // Fallback to default based on data only if no tab in URL
    if (attendanceData !== undefined && !currentUserResponse) {
      return 'pending';
    }
    return 'responded';
  });

  // Update URL when tab changes
  const handleTabChange = useCallback(
    (tab: 'pending' | 'responded') => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('attendanceTab', tab);
      // Keep the main tab parameter if it exists
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const attendanceRecords = attendanceData?.records || [];
  const currentUserResponse = attendanceData?.currentUserResponse;

  // Effect to update active tab based on URL changes (if not triggered by internal click)
  useEffect(() => {
    const tabFromUrl = searchParams.get('attendanceTab');
    if (tabFromUrl === 'pending' || tabFromUrl === 'responded') {
      setActiveTab(tabFromUrl);
    } else if (attendanceData !== undefined && !currentUserResponse) {
      // Set to pending only if no tab in URL and user hasn't responded
      setActiveTab('pending');
    } else {
      setActiveTab('responded');
    }
  }, [searchParams, attendanceData, currentUserResponse]); // Depend on searchParams to react to URL changes

  // Check if the current user is already in the attendance list
  const isCurrentUserRegistered = Boolean(currentUserResponse);

  // Create a map of names to their attendance records
  const attendanceMap = new Map<string, Doc<'attendanceRecords'>>();
  for (const record of attendanceRecords) {
    if (record.name) {
      attendanceMap.set(record.name, record);
    }
  }

  const handleJoin = () => {
    if (!isAuthenticated || !currentUser) {
      setLoginDialogOpen(true);
      return;
    }

    // Open the dialog with the current user's name pre-selected
    setSelectedPerson(currentUser.name);
    setDialogOpen(true);
  };

  const toggleExpand = (name: string) => {
    setExpanded(expanded === name ? null : name);
  };

  const handlePersonClick = (name: string) => {
    setSelectedPerson(name);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPerson('');
  };

  // Handle successful attendance submission
  const handleAttendanceSuccess = useCallback(() => {
    // Switch to responded tab after successful attendance submission
    handleTabChange('responded');
  }, [handleTabChange]);

  // Check if a record belongs to the current user by comparing user IDs
  const isCurrentUser = (name: string) => {
    const record = attendanceMap.get(name);
    return isAuthenticated && currentUser && record?.userId === currentUser._id;
  };

  // Prepare the combined list of names (expected + recorded)
  const allNames = new Set<string>();

  // Add expected names
  if (expectedNames) {
    for (const name of expectedNames) {
      allNames.add(name);
    }
  }

  // Add recorded names
  for (const record of attendanceRecords) {
    if (record.name) {
      allNames.add(record.name);
    }
  }

  // Convert set to array and filter by search query for main lists
  const filteredNames = Array.from(allNames).filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate names into pending and responded
  const pendingNames = filteredNames.filter((name) => {
    const record = attendanceMap.get(name);
    return !record?.status;
  });

  const respondedNames = filteredNames.filter((name) => {
    const record = attendanceMap.get(name);
    return record?.status;
  });

  // Get the names to display based on active tab
  const displayNames = activeTab === 'pending' ? pendingNames : respondedNames;

  // For the modal, we want to keep a separate list filtered by modalSearchQuery
  const modalFilteredNames = Array.from(allNames).filter((name) => {
    // If we're in the modal, use the activeTab to determine which list to show
    const record = attendanceMap.get(name);
    const isInActiveTabList = activeTab === 'pending' ? !record?.status : record?.status;

    // Then filter by the modal search query
    return isInActiveTabList && name.toLowerCase().includes(modalSearchQuery.toLowerCase());
  });

  const attendingCount = attendanceRecords.filter((r) => r.status === 'attending').length;
  const notAttendingCount = attendanceRecords.filter((r) => r.status === 'not_attending').length;
  const pendingCount = pendingNames.length;

  // Reset modal search when opening the modal
  useEffect(() => {
    if (showFullListModal) {
      setModalSearchQuery('');
    }
  }, [showFullListModal]);

  return (
    <>
      <div className="pb-3">
        <h2 className="text-lg flex justify-between items-center">
          <span>{title}</span>
          {attendanceData === undefined ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <div className="flex space-x-2">
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {attendingCount}
              </Badge>
              <Badge variant="outline" className="bg-red-50">
                <XCircle className="h-3 w-3 mr-1" /> {notAttendingCount}
              </Badge>
              {pendingCount > 0 && <Badge variant="outline">{pendingCount} pending</Badge>}
            </div>
          )}
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
                  Responded ({respondedNames.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-1">
                  Pending ({pendingNames.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="responded">
                {respondedNames.length === 0 ? (
                  <AttendanceEmptyState message="No results found" onJoin={handleJoin} />
                ) : (
                  <div className="space-y-2">
                    {respondedNames.slice(0, 7).map((name) => {
                      const record = attendanceMap.get(name);
                      const status = record?.status;
                      const reason = record?.reason;
                      const remarks = record?.remarks;
                      const isYou = isCurrentUser(name);

                      return (
                        <div key={name} className="p-2 border rounded-md relative hover:bg-gray-50">
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
                              <span className="ml-2">
                                {name}
                                {isYou && (
                                  <span className="ml-1 text-sm text-muted-foreground">(you)</span>
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
                    {respondedNames.length > 7 && (
                      <Button
                        variant="ghost"
                        className="w-full mt-3 text-muted-foreground hover:text-foreground h-9 rounded-md transition-colors flex items-center justify-center"
                        onClick={() => setShowFullListModal(true)}
                      >
                        View {respondedNames.length} more responses
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending">
                {pendingNames.length === 0 ? (
                  <AttendanceEmptyState message="No results found" onJoin={handleJoin} />
                ) : (
                  <div className="space-y-2">
                    {pendingNames.slice(0, 7).map((name) => {
                      const isYou = isCurrentUser(name);
                      return (
                        <div key={name} className="p-2 border rounded-md relative hover:bg-gray-50">
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
                              <span className="ml-2">
                                {name}
                                {isYou && (
                                  <span className="ml-1 text-sm text-muted-foreground">(you)</span>
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
          </>
        )}
      </div>

      {/* Login dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>You need to be logged in to mark your attendance.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => router.push('/login')} className="flex items-center">
              <LogIn className="h-4 w-4 mr-2" /> Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full list modal - update to show based on active tab */}
      <Dialog open={showFullListModal} onOpenChange={setShowFullListModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'pending' ? 'Pending Responses' : 'All Responses'} (
              {displayNames.length})
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
                    const isYou = isCurrentUser(name);

                    return (
                      <div key={name} className="p-2 border rounded-md relative hover:bg-gray-50">
                        <button
                          className="cursor-pointer w-full text-left p-0 inline-block"
                          type="button"
                          onClick={() => {
                            setSelectedPerson(name);
                            setDialogOpen(true);
                            setShowFullListModal(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setSelectedPerson(name);
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
                            <span className="ml-2">
                              {name}
                              {isYou && (
                                <span className="ml-1 text-sm text-muted-foreground">(you)</span>
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
                />
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {dialogOpen && attendanceRecords && (
        <AttendanceDialog
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          personName={selectedPerson}
          attendanceKey={attendanceKey}
          attendanceRecords={attendanceRecords}
          onSuccess={handleAttendanceSuccess}
        />
      )}
    </>
  );
};

// Main component with Suspense boundary
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
      <AttendanceContent {...props} />
    </Suspense>
  );
};
