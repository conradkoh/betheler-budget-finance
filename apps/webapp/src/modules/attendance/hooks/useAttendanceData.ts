import { api } from '@workspace/backend/convex/_generated/api';
import type { Doc } from '@workspace/backend/convex/_generated/dataModel';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { useRouter, useSearchParams } from 'next/navigation';
// External imports
import { useCallback, useEffect, useMemo, useState } from 'react';

// Internal imports
import { useCurrentUser } from '@/modules/auth/AuthProvider';

/**
 * Props for the useAttendanceData hook.
 */
export interface UseAttendanceDataProps {
  attendanceKey: string;
  expectedNames?: string[];
}

/**
 * Return type for the useAttendanceData hook containing all attendance-related data and functions.
 */
export interface UseAttendanceDataReturn {
  // Data
  attendanceData:
    | ReturnType<typeof useSessionQuery<typeof api.attendance.getAttendanceData>>
    | undefined;
  attendanceRecords: Doc<'attendanceRecords'>[];
  attendanceMap: Map<string, Doc<'attendanceRecords'>>;
  allNames: Set<string>;
  pendingNames: string[];
  filteredRespondedNames: string[];
  modalFilteredNames: string[];

  // Counts
  attendingCount: number;
  notAttendingCount: number;
  pendingCount: number;
  respondedAttendingCount: number;
  respondedNotAttendingCount: number;

  // State
  activeTab: 'pending' | 'responded';
  searchQuery: string;
  modalSearchQuery: string;
  statusFilter: 'all' | 'attending' | 'not_attending';
  isAuthenticated: boolean;
  currentUser: ReturnType<typeof useCurrentUser>;
  isCurrentUserRegistered: boolean;

  // Actions
  setSearchQuery: (query: string) => void;
  setModalSearchQuery: (query: string) => void;
  setStatusFilter: (filter: 'all' | 'attending' | 'not_attending') => void;
  handleTabChange: (tab: 'pending' | 'responded') => void;
}

/**
 * Check if a record belongs to the current user by comparing user IDs.
 * Utility function for determining if a name represents the current authenticated user.
 */
export function isCurrentUser(
  name: string,
  attendanceMap: Map<string, Doc<'attendanceRecords'>>,
  isAuthenticated: boolean,
  currentUser: ReturnType<typeof useCurrentUser>
): boolean {
  const record = attendanceMap.get(name);
  return Boolean(isAuthenticated && currentUser && record?.userId === currentUser._id);
}

/**
 * Custom hook for managing attendance data, state, and computed values.
 * Provides comprehensive attendance tracking functionality with search, filtering, and URL state management.
 */
export const useAttendanceData = ({
  attendanceKey,
  expectedNames = [],
}: UseAttendanceDataProps): UseAttendanceDataReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();
  const isAuthenticated = currentUser !== undefined;

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'not_attending'>('all');

  // Data fetching
  const attendanceData = useSessionQuery(api.attendance.getAttendanceData, {
    attendanceKey,
  });

  // Get attendance tab from URL or determine default
  const attendanceTabFromUrl = searchParams.get('attendanceTab');
  const [activeTab, setActiveTab] = useState<'pending' | 'responded'>(() => {
    if (attendanceTabFromUrl === 'pending' || attendanceTabFromUrl === 'responded') {
      return attendanceTabFromUrl;
    }
    // Fallback to default based on data only if no tab in URL
    if (attendanceData !== undefined && !_getCurrentUserResponse(attendanceData)) {
      return 'pending';
    }
    return 'responded';
  });

  // Memoized computed values
  const attendanceRecords = useMemo(() => attendanceData?.records || [], [attendanceData?.records]);

  const currentUserResponse = useMemo(
    () => _getCurrentUserResponse(attendanceData),
    [attendanceData]
  );

  // Create a map of names to their attendance records for efficient lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Doc<'attendanceRecords'>>();
    for (const record of attendanceRecords) {
      if (record.name) {
        map.set(record.name, record);
      }
    }
    return map;
  }, [attendanceRecords]);

  // Prepare the combined list of names (expected + recorded)
  const allNames = useMemo(() => {
    const names = new Set<string>();

    // Add expected names
    if (expectedNames) {
      for (const name of expectedNames) {
        names.add(name);
      }
    }

    // Add recorded names
    for (const record of attendanceRecords) {
      if (record.name) {
        names.add(record.name);
      }
    }

    return names;
  }, [expectedNames, attendanceRecords]);

  // Convert set to array and filter by search query for main lists
  const filteredNames = useMemo(() => {
    return Array.from(allNames).filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allNames, searchQuery]);

  // Separate names into pending and responded categories
  const pendingNames = useMemo(() => {
    return filteredNames.filter((name) => {
      const record = attendanceMap.get(name);
      return !record?.status;
    });
  }, [filteredNames, attendanceMap]);

  const respondedNames = useMemo(() => {
    return filteredNames.filter((name) => {
      const record = attendanceMap.get(name);
      return record?.status;
    });
  }, [filteredNames, attendanceMap]);

  // Apply status filter to responded names
  const filteredRespondedNames = useMemo(() => {
    return respondedNames.filter((name) => {
      if (statusFilter === 'all') return true;
      const record = attendanceMap.get(name);
      return record?.status === statusFilter;
    });
  }, [respondedNames, statusFilter, attendanceMap]);

  // For the modal, maintain separate list filtered by modalSearchQuery
  const modalFilteredNames = useMemo(() => {
    return Array.from(allNames).filter((name) => {
      const record = attendanceMap.get(name);
      const isInActiveTabList = activeTab === 'pending' ? !record?.status : record?.status;

      // Apply status filter for responded tab in modal
      if (activeTab === 'responded' && statusFilter !== 'all') {
        if (record?.status !== statusFilter) return false;
      }

      // Then filter by the modal search query
      return isInActiveTabList && name.toLowerCase().includes(modalSearchQuery.toLowerCase());
    });
  }, [allNames, activeTab, statusFilter, modalSearchQuery, attendanceMap]);

  // Calculate attendance counts
  const attendingCount = useMemo(() => {
    return attendanceRecords.filter((r) => r.status === 'attending').length;
  }, [attendanceRecords]);

  const notAttendingCount = useMemo(() => {
    return attendanceRecords.filter((r) => r.status === 'not_attending').length;
  }, [attendanceRecords]);

  const pendingCount = useMemo(() => pendingNames.length, [pendingNames.length]);

  // Filter counts for responded names (after search but before status filter)
  const respondedAttendingCount = useMemo(() => {
    return respondedNames.filter((name) => {
      const record = attendanceMap.get(name);
      return record?.status === 'attending';
    }).length;
  }, [respondedNames, attendanceMap]);

  const respondedNotAttendingCount = useMemo(() => {
    return respondedNames.filter((name) => {
      const record = attendanceMap.get(name);
      return record?.status === 'not_attending';
    }).length;
  }, [respondedNames, attendanceMap]);

  // Check if the current user is already in the attendance list
  const isCurrentUserRegistered = useMemo(() => {
    return Boolean(currentUserResponse);
  }, [currentUserResponse]);

  /**
   * Update URL when tab changes and reset related filters.
   */
  const handleTabChange = useCallback(
    (tab: 'pending' | 'responded') => {
      setActiveTab(tab);
      // Reset status filter when switching tabs
      setStatusFilter('all');

      // Update URL with new tab
      const params = new URLSearchParams(searchParams.toString());
      params.set('attendanceTab', tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Update active tab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('attendanceTab');
    if (tabFromUrl === 'pending' || tabFromUrl === 'responded') {
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]);

  return {
    // Data
    attendanceData,
    attendanceRecords,
    attendanceMap,
    allNames,
    pendingNames,
    filteredRespondedNames,
    modalFilteredNames,

    // Counts
    attendingCount,
    notAttendingCount,
    pendingCount,
    respondedAttendingCount,
    respondedNotAttendingCount,

    // State
    activeTab,
    searchQuery,
    modalSearchQuery,
    statusFilter,
    isAuthenticated,
    currentUser,
    isCurrentUserRegistered,

    // Actions
    setSearchQuery,
    setModalSearchQuery,
    setStatusFilter,
    handleTabChange,
  };
};

/**
 * Get the current user's response from attendance data.
 * Internal helper function for extracting current user's attendance record.
 */
function _getCurrentUserResponse(
  attendanceData:
    | ReturnType<typeof useSessionQuery<typeof api.attendance.getAttendanceData>>
    | undefined
) {
  return attendanceData?.currentUserResponse;
}
