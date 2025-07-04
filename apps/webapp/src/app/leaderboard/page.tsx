'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Calendar, Medal, Trophy, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { type DateRange, DateRangePicker } from '@/components/DateRangePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthState } from '@/modules/auth/AuthProvider';

type LeaderboardTab = 'transactions' | 'unique-days';

// Loading component for the suspense boundary
function LeaderboardLoading() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-yellow-500 dark:text-yellow-400 mr-2" />
            Finance Tracking Leaderboard <span className="ml-2">👑</span>
          </h1>
          <p className="text-muted-foreground mb-6">Loading leaderboard...</p>
        </div>
      </div>
    </div>
  );
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function LeaderboardContent() {
  const authState = useAuthState();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Date range state for the leaderboard - default to current month
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now),
    };
  });

  // Get active tab from URL, defaulting to 'transactions'
  const activeTab = useMemo((): LeaderboardTab => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'unique-days') {
      return 'unique-days';
    }
    return 'transactions';
  }, [searchParams]);

  // Handle tab change with URL update
  const handleTabChange = useCallback(
    (value: string) => {
      const newTab = value as LeaderboardTab;
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', newTab);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Get the client's timezone offset in minutes
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  // Get leaderboard data for transaction count
  const transactionLeaderboardData = useQuery(api.transactions.getPublicLeaderboardByDateRange, {
    startDateISO: selectedDateRange.startDate.toISOString(),
    endDateISO: selectedDateRange.endDate.toISOString(),
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Get leaderboard data for unique days
  const uniqueDaysLeaderboardData = useQuery(api.transactions.getPublicLeaderboardByUniqueDays, {
    startDateISO: selectedDateRange.startDate.toISOString(),
    endDateISO: selectedDateRange.endDate.toISOString(),
    timezoneOffsetMinutes, // Pass timezone offset
  });

  // Function to get medal color - improved for dark mode compatibility
  const getMedalColor = (position: number) => {
    switch (position) {
      case 0:
        return 'text-yellow-500 dark:text-yellow-400'; // Gold
      case 1:
        return 'text-gray-400 dark:text-gray-300'; // Silver
      case 2:
        return 'text-amber-700 dark:text-amber-500'; // Bronze
      default:
        return 'text-gray-400 dark:text-gray-500'; // Other positions
    }
  };

  // Function to render leaderboard content
  const renderLeaderboard = (
    data: Array<{ userId: string; name: string; [key: string]: string | number }>,
    _metricName: string,
    metricKey: string,
    isLoading: boolean
  ) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-16">
          <div className="animate-pulse text-center">
            <p>Loading leaderboard data...</p>
          </div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10">
          No transaction data available for this date range
        </p>
      );
    }

    return (
      <div className="divide-y">
        {/* Top 3 users with special styling */}
        {data.slice(0, 3).map((user, index) => {
          const isCurrentUser =
            authState?.state === 'authenticated' && authState.user._id === user.userId;
          const metricValue = user[metricKey];
          const metricLabel =
            metricKey === 'transactionCount'
              ? metricValue === 1
                ? 'transaction'
                : 'transactions'
              : metricValue === 1
                ? 'day'
                : 'days';

          return (
            <div
              key={user.userId}
              className={`grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_minmax(90px,auto)] 
                         grid-rows-[auto_auto] sm:grid-rows-[auto] 
                         gap-x-4 gap-y-2 sm:gap-4 
                         p-5 ${
                           index === 0
                             ? 'bg-warning-bg/50 text-warning-foreground'
                             : index === 1
                               ? 'bg-muted/30 text-foreground'
                               : index === 2
                                 ? 'bg-warning-bg/30 text-warning-foreground'
                                 : ''
                         } ${isCurrentUser ? 'border-l-4 border-primary' : ''}`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-background to-muted shadow-sm">
                <Medal className={`w-5 h-5 ${getMedalColor(index)}`} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center gap-1 flex-wrap">
                  <p className="font-semibold text-lg truncate">{user.name}</p>
                  {isCurrentUser && <span className="text-xs text-primary font-medium">(You)</span>}
                  {index === 0 && <span className="ml-1">👑</span>}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 font-mono font-bold text-base sm:text-lg bg-background/60 px-3 py-1 rounded-full text-center break-all mt-1 sm:mt-0 sm:justify-self-end">
                {metricValue}
                <span className="break-normal"> {metricLabel}</span>
              </div>
            </div>
          );
        })}

        {/* Rest of users up to top 50 */}
        {data.slice(3, 50).map((user, index) => {
          const isCurrentUser =
            authState?.state === 'authenticated' && authState.user._id === user.userId;
          const metricValue = user[metricKey];
          const metricLabel =
            metricKey === 'transactionCount'
              ? metricValue === 1
                ? 'transaction'
                : 'transactions'
              : metricValue === 1
                ? 'day'
                : 'days';

          return (
            <div
              key={user.userId}
              className={`grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_minmax(90px,auto)]
                         grid-rows-[auto_auto] sm:grid-rows-[auto]
                         gap-x-3 gap-y-2 sm:gap-3
                         py-4 px-5 
                         ${isCurrentUser ? 'bg-muted/30 border-l-4 border-primary' : ''}
                         hover:bg-muted/10 transition-colors`}
            >
              <div className="flex items-center justify-center w-8 text-center">
                <span className="text-muted-foreground font-medium">{index + 4}</span>
              </div>
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center gap-1 flex-wrap">
                  <p className="font-medium truncate">{user.name}</p>
                  {isCurrentUser && <span className="text-xs text-primary font-medium">(You)</span>}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 font-mono font-medium text-sm sm:text-base bg-muted/20 px-3 py-1 rounded-full text-center break-all mt-1 sm:mt-0 sm:justify-self-end">
                {metricValue}
                <span className="break-normal"> {metricLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-yellow-500 dark:text-yellow-400 mr-2" />
            Finance Tracking Leaderboard <span className="ml-2">👑</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            See who's tracking their finances the most in your selected date range
          </p>

          {/* Centered date range picker */}
          <div className="flex justify-center mb-4">
            <DateRangePicker
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              className="mx-auto max-w-md"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Transaction Count</span>
            </TabsTrigger>
            <TabsTrigger value="unique-days" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Active Days</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card className="shadow-md border-t-4 border-t-yellow-500">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex flex-col sm:flex-row items-center justify-center text-xl">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" /> Top Finance Trackers by Transactions
                  </div>
                  <span className="text-sm font-normal sm:ml-2 mt-1 sm:mt-0">(Top 50 shown)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderLeaderboard(
                  transactionLeaderboardData || [],
                  'transactions',
                  'transactionCount',
                  transactionLeaderboardData === undefined
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unique-days">
            <Card className="shadow-md border-t-4 border-t-blue-500">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex flex-col sm:flex-row items-center justify-center text-xl">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" /> Most Active Days
                  </div>
                  <span className="text-sm font-normal sm:ml-2 mt-1 sm:mt-0">(Top 50 shown)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderLeaderboard(
                  uniqueDaysLeaderboardData || [],
                  'active days',
                  'uniqueDaysCount',
                  uniqueDaysLeaderboardData === undefined
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Main component that wraps LeaderboardContent in Suspense
export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardLoading />}>
      <LeaderboardContent />
    </Suspense>
  );
}
