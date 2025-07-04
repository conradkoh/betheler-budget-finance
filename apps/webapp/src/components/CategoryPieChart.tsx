'use client';

import { api } from '@workspace/backend/convex/_generated/api';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/formatCurrency';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define color palette for the chart
const CHART_COLORS = [
  'rgba(255, 99, 132, 0.7)',
  'rgba(54, 162, 235, 0.7)',
  'rgba(255, 206, 86, 0.7)',
  'rgba(75, 192, 192, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 159, 64, 0.7)',
  'rgba(199, 199, 199, 0.7)',
  'rgba(83, 102, 255, 0.7)',
  'rgba(78, 166, 134, 0.7)',
  'rgba(255, 99, 255, 0.7)',
];

const CHART_BORDER_COLORS = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(199, 199, 199, 1)',
  'rgba(83, 102, 255, 1)',
  'rgba(78, 166, 134, 1)',
  'rgba(255, 99, 255, 1)',
];

// Define props type for the component
interface SpendingBreakdownChartProps {
  data: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  totalSpent: number;
  year?: number;
  month?: number;
  showBudgetComparison?: boolean;
  includeSavings?: boolean;
  title?: string;
}

export function SpendingBreakdownChart({
  data,
  totalSpent,
  year,
  month,
  showBudgetComparison = false,
  includeSavings = false,
  title = 'Spending Breakdown',
}: SpendingBreakdownChartProps) {
  // Only fetch budget data if we're showing the comparison and have year/month
  const budgetProgress = useSessionQuery(
    api.budgets.getBudgetProgress,
    year !== undefined && month !== undefined && showBudgetComparison
      ? {
          year,
          month,
          timezoneOffsetMinutes: new Date().getTimezoneOffset(),
        }
      : 'skip'
  );

  // Fetch savings data from the specific month if we have year/month
  const savingsSummary = useSessionQuery(
    api.transactions.getSavingsSummary,
    includeSavings
      ? year !== undefined && month !== undefined
        ? {
            year,
            month,
            timezoneOffsetMinutes: new Date().getTimezoneOffset(),
          }
        : 'skip'
      : 'skip'
  );

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    // Sort data by amount (descending)
    const sortedData = [...data].sort((a, b) => b.amount - a.amount);

    // Create labels and data arrays for expense categories
    let labels = sortedData.map((item) => item.category);
    let amounts = sortedData.map((item) => Math.abs(item.amount));

    // Include savings if requested and available
    if (includeSavings && savingsSummary && savingsSummary.netSavings > 0) {
      // Check if we already have a savings category
      const savingsIndex = labels.findIndex((label) => label.toLowerCase() === 'savings');

      if (savingsIndex >= 0) {
        // Update existing savings amount instead of adding a new entry
        amounts[savingsIndex] = Math.max(amounts[savingsIndex], savingsSummary.netSavings);
      } else {
        // Add new savings entry
        labels = ['Savings', ...labels];
        amounts = [savingsSummary.netSavings, ...amounts];
      }
    }

    // Filter out zero or very small amounts (less than 0.01)
    const filteredLabels = [];
    const filteredAmounts = [];

    for (let i = 0; i < labels.length; i++) {
      if (amounts[i] > 0.01) {
        filteredLabels.push(labels[i]);
        filteredAmounts.push(amounts[i]);
      }
    }

    // Calculate color for each data point
    const backgroundColors = filteredLabels.map(
      (_, index) => CHART_COLORS[index % CHART_COLORS.length]
    );
    const borderColors = filteredLabels.map(
      (_, index) => CHART_BORDER_COLORS[index % CHART_BORDER_COLORS.length]
    );

    // Calculate total (including savings if included)
    const total = filteredAmounts.reduce((sum, amount) => sum + amount, 0);

    return {
      labels: filteredLabels,
      datasets: [
        {
          label: 'Amount',
          data: filteredAmounts,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
      total,
    };
  }, [data, includeSavings, savingsSummary]);

  // Create chart options
  const options = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 15,
            boxWidth: 15,
            usePointStyle: true,
            generateLabels: (chart: any) => {
              const original = ChartJS.overrides.pie.plugins.legend.labels.generateLabels(chart);

              // Add percentage and amount to legend labels
              return original.map((label: any, i: number) => {
                const dataIndex = i;
                const value = chart.data.datasets[0].data[dataIndex];
                const percentage = Math.round((value / chartData.total) * 100);

                label.text = `${label.text} · ${formatCurrency(value)} · ${percentage}%`;
                return label;
              });
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed;
              const label = context.label || '';
              const formattedValue = formatCurrency(value);
              const percentage = ((value / chartData.total) * 100).toFixed(1);

              // Add budget comparison if available
              if (showBudgetComparison && budgetProgress && label !== 'Savings') {
                const budgetItem = budgetProgress.budgeted.find((b) => b.category === label);

                if (budgetItem) {
                  const budgetAmount = formatCurrency(budgetItem.amount);
                  const status =
                    budgetItem.status === 'within_budget' ? 'Under budget' : 'Over budget';
                  const diff = formatCurrency(Math.abs(budgetItem.remaining));
                  return [
                    `${label}: ${formattedValue} (${percentage}%)`,
                    `Budget: ${budgetAmount}`,
                    `${status} by ${diff}`,
                  ];
                }
              }

              // Default tooltip
              return `${label}: ${formattedValue} (${percentage}%)`;
            },
          },
        },
      },
    }),
    [chartData.total, showBudgetComparison, budgetProgress]
  );

  return (
    <div className="pt-4">
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <Pie data={chartData} options={options} />
    </div>
  );
}

// Export CategoryPieChart as an alias for backward compatibility
export const CategoryPieChart = SpendingBreakdownChart;
