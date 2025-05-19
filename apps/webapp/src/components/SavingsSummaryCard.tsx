import { formatCurrency } from '@/lib/formatCurrency';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { ArrowUpRight, PiggyBank } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function SavingsSummaryCard() {
  const timezoneOffsetMinutes = useMemo(() => new Date().getTimezoneOffset(), []);

  const savingsSummary = useSessionQuery(api.transactions.getSavingsSummary, {
    timezoneOffsetMinutes,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Savings
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {savingsSummary === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-info">
                {formatCurrency(savingsSummary.netSavings)}
              </div>
              <div className="text-xs text-muted-foreground">Total Savings</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="space-y-1">
                <div className="text-sm font-medium text-info">
                  {formatCurrency(savingsSummary.totalSaved)}
                </div>
                <div className="text-xs text-muted-foreground">Amount Saved</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-error flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {formatCurrency(savingsSummary.totalWithdrawn)}
                </div>
                <div className="text-xs text-muted-foreground">Withdrawals</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
