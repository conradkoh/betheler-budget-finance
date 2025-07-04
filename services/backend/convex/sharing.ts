import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';
import { getAuthUser } from '../modules/auth/getAuthUser';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { getMonthDateRange } from './utils';

// Generate a random share ID
function generateShareId(): string {
  return Math.random().toString(36).substring(2, 14);
}

// Create a share link for transactions and category summary
export const createShareLink = mutation({
  args: {
    ...SessionIdArg,
    year: v.number(),
    month: v.number(),
    expirationDays: v.optional(v.number()), // null or undefined means no expiration
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Generate a unique share ID
    const shareId = generateShareId();

    // Current timestamp
    const now = Date.now();

    // Handle expiration - if expirationDays is null or undefined, create a permanent link
    let expiresAt: number | null = null;
    let expiresAtLabel: string | null = null;

    if (args.expirationDays !== null && args.expirationDays !== undefined) {
      expiresAt = now + args.expirationDays * 24 * 60 * 60 * 1000;
      expiresAtLabel = new Date(expiresAt).toISOString();
    }

    // Create the share link record
    const shareLinkId = await ctx.db.insert('shareLinks', {
      userId: user._id,
      shareId,
      year: args.year,
      month: args.month,
      createdAt: now,
      // If expiresAt is null, the link does not expire
      expiresAt: expiresAt ?? Number.MAX_SAFE_INTEGER,
      // Store null to indicate no expiration, or the expiry date
      expiresAtLabel: expiresAtLabel ?? 'Never',
    });

    return {
      shareId,
      shareLinkId,
      expiresAt: expiresAt ?? null,
      expiresAtLabel: expiresAtLabel ?? 'Never',
      createdAt: now,
    };
  },
});

// List all share links for the current user
export const listUserShares = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get all share links for the user
    const shareLinks = await ctx.db
      .query('shareLinks')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .collect();

    // Filter out expired links
    const now = Date.now();
    const validShareLinks = shareLinks.filter((link) => link.expiresAt > now);

    return validShareLinks.map((link) => {
      // For display, calculate a formatted month/year
      const monthDate = new Date(link.year, link.month);
      const formattedPeriod = monthDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });

      return {
        ...link,
        formattedPeriod,
        formattedCreatedAt: new Date(link.createdAt).toLocaleString(),
        permanent: link.expiresAtLabel === 'Never',
      };
    });
  },
});

// Delete a share link
export const deleteShareLink = mutation({
  args: {
    ...SessionIdArg,
    shareLinkId: v.id('shareLinks'),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get the share link
    const shareLink = await ctx.db.get(args.shareLinkId);
    if (!shareLink) {
      throw new Error('Share link not found');
    }

    // Ensure the user owns the share link
    if (shareLink.userId !== user._id) {
      throw new Error('Not authorized to delete this share link');
    }

    // Delete the share link
    await ctx.db.delete(args.shareLinkId);

    return { success: true };
  },
});

// Delete all share links for a user
export const deleteAllShareLinks = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get all share links for the user
    const shareLinks = await ctx.db
      .query('shareLinks')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect();

    // Delete each share link
    for (const shareLink of shareLinks) {
      await ctx.db.delete(shareLink._id);
    }

    return {
      success: true,
      count: shareLinks.length,
    };
  },
});

// Get a share link by ID
export const getShareLink = query({
  args: {
    shareId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the share link
    const shareLink = await ctx.db
      .query('shareLinks')
      .withIndex('by_shareId', (q) => q.eq('shareId', args.shareId))
      .first();

    if (!shareLink) {
      return null;
    }

    // Check if the share link has expired (if it has an expiration)
    if (shareLink.expiresAt < Date.now() && shareLink.expiresAtLabel !== 'Never') {
      return null;
    }

    return shareLink;
  },
});

// Get shared transactions for a specific share link
export const getSharedTransactions = query({
  args: {
    shareId: v.string(),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the share link
    const shareLink = await ctx.db
      .query('shareLinks')
      .withIndex('by_shareId', (q) => q.eq('shareId', args.shareId))
      .first();

    if (!shareLink) {
      return null;
    }

    // Check if the share link has expired (if it has an expiration)
    if (shareLink.expiresAt < Date.now() && shareLink.expiresAtLabel !== 'Never') {
      return null;
    }

    // Get user information for displaying in the shared view
    const user = await ctx.db.get(shareLink.userId as Id<'users'>);
    if (!user) {
      return null;
    }

    // Use provided month/year if available, otherwise use the ones from shareLink
    const year = args.year !== undefined ? args.year : shareLink.year;
    const month = args.month !== undefined ? args.month : shareLink.month;

    // Get the date range for the specified month, passing the timezone offset if provided
    const { startDateISO, endDateISO } = getMonthDateRange(year, month, args.timezoneOffsetMinutes);

    // Get transactions for the user within the specified month
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) =>
        q
          .eq('userId', shareLink.userId as Id<'users'>)
          .gte('datetime', startDateISO)
          .lte('datetime', endDateISO)
      )
      .order('desc')
      .collect();

    return {
      transactions,
      month,
      year,
      expiresAt: shareLink.expiresAt,
      permanent: shareLink.expiresAtLabel === 'Never',
      userName: user.name || 'Anonymous User', // Include user's name
    };
  },
});

// Get shared category summary for a specific share link
export const getSharedCategorySummary = query({
  args: {
    shareId: v.string(),
    transactionType: v.optional(
      v.union(v.literal('expense'), v.literal('income'), v.literal('savings'))
    ),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the share link
    const shareLink = await ctx.db
      .query('shareLinks')
      .withIndex('by_shareId', (q) => q.eq('shareId', args.shareId))
      .first();

    if (!shareLink) {
      return null;
    }

    // Check if the share link has expired (if it has an expiration)
    if (shareLink.expiresAt < Date.now() && shareLink.expiresAtLabel !== 'Never') {
      return null;
    }

    // Use provided month/year if available, otherwise use the ones from shareLink
    const year = args.year !== undefined ? args.year : shareLink.year;
    const month = args.month !== undefined ? args.month : shareLink.month;

    // Get the date range for the specified month, passing the timezone offset if provided
    const { startDateISO, endDateISO } = getMonthDateRange(year, month, args.timezoneOffsetMinutes);

    // Get transactions for the user within the specified month
    let transactionsQuery = ctx.db.query('transactions').withIndex('by_userId_datetime', (q) =>
      q
        .eq('userId', shareLink.userId as Id<'users'>)
        .gte('datetime', startDateISO)
        .lte('datetime', endDateISO)
    );

    // Apply transaction type filter if specified
    if (args.transactionType) {
      transactionsQuery = transactionsQuery.filter((q) =>
        q.eq(q.field('transactionType'), args.transactionType)
      );
    }

    const transactions = await transactionsQuery.collect();

    // Calculate totals by category
    const categorySummary: Record<string, { amount: number; count: number }> = {};
    let totalSpent = 0;

    for (const transaction of transactions) {
      const category = transaction.category || 'Uncategorized';

      if (!categorySummary[category]) {
        categorySummary[category] = { amount: 0, count: 0 };
      }

      categorySummary[category].amount += Math.abs(transaction.amount);
      categorySummary[category].count += 1;
      totalSpent += Math.abs(transaction.amount);
    }

    // Calculate percentages and prepare final result
    const result = Object.entries(categorySummary).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalSpent !== 0 ? (data.amount / totalSpent) * 100 : 0,
    }));

    return {
      categories: result,
      totalSpent,
      month,
      year,
      expiresAt: shareLink.expiresAt,
      permanent: shareLink.expiresAtLabel === 'Never',
    };
  },
});

// Get a comprehensive financial summary for a shared transaction link
export const getSharedFinancialSummary = query({
  args: {
    shareId: v.string(),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    totalSavings: number;
    totalSpendableIncome: number;
    formattedMonth: string;
  } | null> => {
    // Get the share link
    const shareLink = await ctx.db
      .query('shareLinks')
      .withIndex('by_shareId', (q) => q.eq('shareId', args.shareId))
      .first();

    if (!shareLink) {
      return null;
    }

    // Check if the share link has expired (if it has an expiration)
    if (shareLink.expiresAt < Date.now() && shareLink.expiresAtLabel !== 'Never') {
      return null;
    }

    // Use provided month/year if available, otherwise use the ones from shareLink
    const year = args.year !== undefined ? args.year : shareLink.year;
    const month = args.month !== undefined ? args.month : shareLink.month;

    // Get the date range for the specified month, passing the timezone offset if provided
    const { startDate, startDateISO, endDateISO } = getMonthDateRange(
      year,
      month,
      args.timezoneOffsetMinutes
    );

    // Get all transactions for the user within the specified month
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) =>
        q
          .eq('userId', shareLink.userId as Id<'users'>)
          .gte('datetime', startDateISO)
          .lte('datetime', endDateISO)
      )
      .collect();

    // Calculate totals by transaction type
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSavingsDeposits = 0;
    let totalSavingsWithdrawals = 0;

    for (const transaction of transactions) {
      const amount = Math.abs(transaction.amount);

      switch (transaction.transactionType) {
        case 'income':
          totalIncome += amount;
          break;
        case 'expense':
          totalExpenses += amount;
          break;
        case 'savings':
          // Handle savings deposits (positive amounts) and withdrawals (negative amounts) separately
          if (transaction.amount > 0) {
            totalSavingsDeposits += transaction.amount;
          } else {
            totalSavingsWithdrawals += Math.abs(transaction.amount);
          }
          break;
      }
    }

    // Calculate net savings (deposits minus withdrawals)
    const totalSavings = totalSavingsDeposits - totalSavingsWithdrawals;

    // Calculate total spendable income (income minus savings)
    const totalSpendableIncome = totalIncome - totalSavings;

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalSpendableIncome,
      formattedMonth: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  },
});

// Get budget progress for a shared link
export const getSharedBudgetProgress = query({
  args: {
    shareId: v.string(),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the share link
    const shareLink = await ctx.db
      .query('shareLinks')
      .withIndex('by_shareId', (q) => q.eq('shareId', args.shareId))
      .first();

    if (!shareLink) {
      return null;
    }

    // Check if the share link has expired (if it has an expiration)
    if (shareLink.expiresAt < Date.now() && shareLink.expiresAtLabel !== 'Never') {
      return null;
    }

    // Use provided month/year if available, otherwise use the ones from shareLink
    const year = args.year !== undefined ? args.year : shareLink.year;
    const month = args.month !== undefined ? args.month : shareLink.month;

    // Get the date range for the specified month, passing the timezone offset if provided
    const { startDateISO, endDateISO } = getMonthDateRange(year, month, args.timezoneOffsetMinutes);

    // Get budgets for this month
    const budgets = await ctx.db
      .query('budgets')
      .withIndex('by_userId_yearMonth', (q) =>
        q
          .eq('userId', shareLink.userId as Id<'users'>)
          .eq('year', year)
          .eq('month', month)
      )
      .collect();

    // Get transactions for this user within the specified month
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) =>
        q
          .eq('userId', shareLink.userId as Id<'users'>)
          .gte('datetime', startDateISO)
          .lte('datetime', endDateISO)
      )
      // Filter to only include expense transactions for budget calculations
      .filter((q) => q.eq(q.field('transactionType'), 'expense'))
      .collect();

    // Calculate totals by category
    const spendingByCategory: Record<string, number> = {};

    for (const transaction of transactions) {
      const category = transaction.category || 'Uncategorized';
      if (!spendingByCategory[category]) {
        spendingByCategory[category] = 0;
      }

      // Add amounts (negative for expenses, positive for income)
      spendingByCategory[category] += transaction.amount;
    }

    // Combine budget and actual spending data
    const budgetProgress = budgets.map((budget) => {
      const spent = spendingByCategory[budget.category] || 0;
      const remaining = budget.amount - Math.abs(spent); // Use absolute value for expenses
      const percentage = budget.amount > 0 ? (Math.abs(spent) / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent: Math.abs(spent), // Always return as positive for UI
        remaining: remaining,
        percentage: percentage,
        status: remaining >= 0 ? 'within_budget' : 'over_budget',
      };
    });

    // Also include categories that have transactions but no budget
    const categoriesWithoutBudgets = Object.keys(spendingByCategory).filter(
      (category) => !budgets.some((budget) => budget.category === category)
    );

    const unbudgetedCategories = categoriesWithoutBudgets.map((category) => ({
      category,
      spent: Math.abs(spendingByCategory[category]),
      status: 'no_budget',
    }));

    return {
      budgeted: budgetProgress,
      unbudgeted: unbudgetedCategories,
    };
  },
});

// Get a high-level summary of budget totals and spending for a shared link
export const getSharedBudgetSummary = query({
  args: {
    shareId: v.string(),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the share link
    const shareLink = await ctx.db
      .query('shareLinks')
      .withIndex('by_shareId', (q) => q.eq('shareId', args.shareId))
      .first();

    if (!shareLink) {
      return null;
    }

    // Check if the share link has expired (if it has an expiration)
    if (shareLink.expiresAt < Date.now() && shareLink.expiresAtLabel !== 'Never') {
      return null;
    }

    // Use provided month/year if available, otherwise use the ones from shareLink
    const year = args.year !== undefined ? args.year : shareLink.year;
    const month = args.month !== undefined ? args.month : shareLink.month;

    // Get budgets for this month
    const budgets = await ctx.db
      .query('budgets')
      .withIndex('by_userId_yearMonth', (q) =>
        q
          .eq('userId', shareLink.userId as Id<'users'>)
          .eq('year', year)
          .eq('month', month)
      )
      .collect();

    // Calculate total budget amount
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);

    return {
      budgets,
      totalBudget,
      month,
      year,
    };
  },
});
