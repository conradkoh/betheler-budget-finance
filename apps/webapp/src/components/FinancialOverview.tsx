'use client';

import { useState } from 'react';
import { MonthlySummaryCard } from '@/components/MonthlySummaryCard';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { ShareButton } from '@/components/ShareButton';
import { SpendingGraph } from '@/components/SpendingGraph';

interface FinancialOverviewProps {
  /**
   * Initial date for the financial overview
   * @default new Date()
   */
  initialDate?: Date;

  /**
   * Whether the component should be in read-only mode (for shared views)
   * @default false
   */
  readOnly?: boolean;

  /**
   * Callback when data changes (e.g., when date changes)
   */
  onDataChange?: () => void;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * A reusable financial overview component that can be used in both
 * the main dashboard and shared views.
 */
export function FinancialOverview({
  initialDate = new Date(),
  readOnly = false,
  onDataChange,
  className,
}: FinancialOverviewProps) {
  // Shared date state for the financial view
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // Handler for date changes
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    onDataChange?.();
  };

  // Handler for data refresh
  const handleDataChange = () => {
    // Force a refresh of the component by creating a new date object
    // This will trigger the useSessionQuery hooks to refetch data
    setSelectedDate(new Date(selectedDate.getTime()));
    onDataChange?.();
  };

  return (
    <div className={`bg-card rounded-lg border p-4 sm:p-6 ${className || ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Financial Overview</h2>
        {!readOnly && (
          <div className="flex items-center gap-3">
            <ShareButton year={selectedDate.getFullYear()} month={selectedDate.getMonth()} />
          </div>
        )}
      </div>

      <div className="mb-3 flex justify-center">
        <div className="w-1/2">
          <MonthYearPicker value={selectedDate} onChange={handleDateChange} disabled={readOnly} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Summary Section */}
        <div>
          <MonthlySummaryCard
            selectedDate={selectedDate}
            noCard={true}
            onDataChange={handleDataChange}
            readOnly={readOnly}
          />
        </div>

        {/* Spending Section */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-medium">Spending</h3>
          </div>
          <SpendingGraph
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            showDatePicker={false}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
