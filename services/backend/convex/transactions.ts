import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';
import { getAuthUser } from '../modules/auth/getAuthUser';
import { api } from './_generated/api';
import { mutation, query } from './_generated/server';
import { getDateRange, getMonthDateRange } from './utils';

export const create = mutation({
  args: {
    ...SessionIdArg,
    amount: v.number(),
    category: v.optional(v.string()),
    datetime: v.string(),
    description: v.string(),
    transactionType: v.union(v.literal('expense'), v.literal('income'), v.literal('savings')),
  },
  handler: async (ctx, args) => {
    //ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // For income, ensure amount is positive; for expenses, ensure amount is negative
    // For savings, allow both positive (adding to savings) and negative (withdrawing from savings)
    let adjustedAmount = args.amount;
    if (args.transactionType === 'expense' && adjustedAmount > 0) {
      adjustedAmount = -adjustedAmount; // Make expense amounts negative
    } else if (args.transactionType === 'income' && adjustedAmount < 0) {
      adjustedAmount = Math.abs(adjustedAmount); // Make income amounts positive
    }
    // Note: Savings amounts can be either positive (adding to savings) or negative (withdrawing from savings)

    // Set default category based on transaction type
    let category = args.category || '';
    if (args.transactionType === 'income' && !category) {
      category = 'Income';
    } else if (args.transactionType === 'savings' && !category) {
      category = 'Savings';
    }

    // Create the transaction
    const transactionId = await ctx.db.insert('transactions', {
      userId: user._id,
      amount: adjustedAmount,
      category,
      datetime: args.datetime,
      description: args.description,
      transactionType: args.transactionType,
    });

    return transactionId;
  },
});

export const listForPastMonth = query({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Calculate date from one month ago
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // Format as ISO string for comparison (matching datetime format in schema)
    const oneMonthAgoStr = oneMonthAgo.toISOString();

    // Get transactions for this user from the past month
    // Using the by_userId_datetime index
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) =>
        q.eq('userId', user._id).gte('datetime', oneMonthAgoStr)
      )
      .order('desc')
      .collect();

    return transactions;
  },
});

export const remove = mutation({
  args: {
    ...SessionIdArg,
    transactionId: v.id('transactions'),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Fetch the transaction to verify ownership
    const transaction = await ctx.db.get(args.transactionId);

    // Verify the transaction exists and belongs to the user
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.userId !== user._id) {
      throw new Error('Not authorized to delete this transaction');
    }

    // Delete the transaction
    await ctx.db.delete(args.transactionId);

    return true;
  },
});

export const listByMonth = query({
  args: {
    ...SessionIdArg,
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
    transactionType: v.union(
      v.literal('expense'),
      v.literal('income'),
      v.literal('savings'),
      v.literal('all')
    ),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get the date range for the specified month, using the timezone offset
    const { startDateISO, endDateISO } = getMonthDateRange(
      args.year,
      args.month,
      args.timezoneOffsetMinutes
    );
    // Get transactions for this user within the specified month
    // Using the by_userId_datetime index
    let transactionsQuery = ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) =>
        q.eq('userId', user._id).gte('datetime', startDateISO).lte('datetime', endDateISO)
      );

    // Apply transaction type filter only if not 'all'
    if (args.transactionType !== 'all') {
      transactionsQuery = transactionsQuery.filter((q) =>
        q.eq(q.field('transactionType'), args.transactionType)
      );
    }

    const transactions = await transactionsQuery.order('desc').collect();

    return transactions;
  },
});

// Add a function to get category summaries for the month
export const getCategorySummary = query({
  args: {
    ...SessionIdArg,
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
    transactionType: v.union(v.literal('expense'), v.literal('income'), v.literal('savings')),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get the date range for the specified month, using the timezone offset
    const { startDateISO, endDateISO } = getMonthDateRange(
      args.year,
      args.month,
      args.timezoneOffsetMinutes
    );

    // Get transactions for this user within the specified month
    // Using the by_userId_datetime index
    let transactionsQuery = ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) =>
        q.eq('userId', user._id).gte('datetime', startDateISO).lte('datetime', endDateISO)
      );

    // Apply transaction type filter
    transactionsQuery = transactionsQuery.filter((q) =>
      q.eq(q.field('transactionType'), args.transactionType)
    );

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
    };
  },
});

// Add getSavingsSummary query
export const getSavingsSummary = query({
  args: {
    ...SessionIdArg,
    year: v.optional(v.number()),
    month: v.optional(v.number()),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Start with user's transactions
    let transactionsQuery = ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('transactionType'), 'savings'));

    // Apply month/year filter if specified
    if (args.year !== undefined && args.month !== undefined) {
      // Timezone offset is required if year/month are provided
      const { startDateISO, endDateISO } = getMonthDateRange(
        args.year,
        args.month,
        args.timezoneOffsetMinutes
      );
      transactionsQuery = transactionsQuery.filter((q) =>
        q.and(q.gte(q.field('datetime'), startDateISO), q.lte(q.field('datetime'), endDateISO))
      );
    }
    // If year/month are not provided, timezone offset isn't used,
    // but it's still required by the args definition.
    // Consider if the logic should change or if the frontend MUST always provide it.

    const transactions = await transactionsQuery.collect();

    // Calculate totals
    let totalSaved = 0;
    let totalWithdrawn = 0;

    for (const transaction of transactions) {
      if (transaction.amount > 0) {
        totalSaved += transaction.amount;
      } else {
        totalWithdrawn += Math.abs(transaction.amount);
      }
    }

    const netSavings = totalSaved - totalWithdrawn;

    return {
      totalSaved,
      totalWithdrawn,
      netSavings,
      count: transactions.length,
    };
  },
});

// Get a comprehensive monthly financial summary with income, expenses, budgeted amounts, and savings
export const getMonthlyFinancialSummary = query({
  args: {
    ...SessionIdArg,
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
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
    remainder: number;
    status: 'balanced' | 'unbudgeted' | 'overbudgeted';
    formattedMonth: string;
  }> => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get the date range for the specified month, using the timezone offset
    const { startDate, startDateISO, endDateISO } = getMonthDateRange(
      args.year,
      args.month,
      args.timezoneOffsetMinutes
    );

    // Get all transactions for this user within the specified month
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) =>
        q.eq('userId', user._id).gte('datetime', startDateISO).lte('datetime', endDateISO)
      )
      .collect();

    // Get budget data from budget service
    const _budgetData: {
      totalBudget: number;
      totalSpent: number;
      totalRemaining: number;
      percentSpent: number;
      budgetCount: number;
      status: string;
    } = await ctx.runQuery(api.budgets.getTotalBudgetSummary, {
      sessionId: args.sessionId,
      year: args.year,
      month: args.month,
      timezoneOffsetMinutes: args.timezoneOffsetMinutes,
    });

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

    // Calculate the remainder (spendable income minus expenses)
    const remainder = totalSpendableIncome - totalExpenses;

    // Determine the status of the remainder
    let status: 'balanced' | 'unbudgeted' | 'overbudgeted' = 'balanced';
    if (remainder > 0) {
      status = 'unbudgeted'; // Positive remainder means unbudgeted money
    } else if (remainder < 0) {
      status = 'overbudgeted'; // Negative remainder means overbudgeting
    }

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalSpendableIncome,
      remainder,
      status,
      formattedMonth: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  },
});

// Migration function to update any transactions without transactionType
export const migrateTransactionTypes = mutation({
  args: {
    ...SessionIdArg,
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get all transactions for this user that don't have a transactionType
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) => q.eq('userId', user._id))
      .collect();

    let updatedCount = 0;

    for (const transaction of transactions) {
      // If transaction doesn't have a transactionType or it's undefined
      if (transaction.transactionType === undefined) {
        let transactionType: 'expense' | 'income' | 'savings';

        // Determine type based on amount and category
        if (transaction.amount < 0) {
          transactionType = 'expense';
        } else if (transaction.category?.toLowerCase() === 'savings') {
          transactionType = 'savings';
        } else {
          transactionType = 'income';
        }

        // Update the transaction
        await ctx.db.patch(transaction._id, {
          transactionType,
        });

        updatedCount++;
      }
    }

    return { updatedCount };
  },
});

// Get transaction counts for all users in a specific month/year for leaderboard
export const getUserTransactionLeaderboard = query({
  args: {
    ...SessionIdArg,
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get the date range for the specified month, using the timezone offset
    const { startDateISO, endDateISO } = getMonthDateRange(
      args.year,
      args.month,
      args.timezoneOffsetMinutes
    );

    // Get all users
    const users = await ctx.db.query('users').collect();

    // For each user, get their transaction count for the month
    const leaderboardData = await Promise.all(
      users.map(async (userData) => {
        // Count transactions for this user within the specified month
        const transactions = await ctx.db
          .query('transactions')
          .withIndex('by_userId_datetime', (q) =>
            q.eq('userId', userData._id).gte('datetime', startDateISO).lte('datetime', endDateISO)
          )
          .collect();

        return {
          userId: userData._id,
          name: userData.name,
          transactionCount: transactions.length,
        };
      })
    );

    // Sort by transaction count (highest first)
    return leaderboardData.sort((a, b) => b.transactionCount - a.transactionCount);
  },
});

// Public leaderboard endpoint that doesn't require authentication
export const getPublicLeaderboard = query({
  args: {
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the date range for the specified month, using the timezone offset
    const { startDateISO, endDateISO } = getMonthDateRange(
      args.year,
      args.month,
      args.timezoneOffsetMinutes
    );

    // Get all users
    const users = await ctx.db.query('users').collect();

    // For each user, get their transaction count for the month
    const leaderboardData = await Promise.all(
      users.map(async (userData) => {
        // Count transactions for this user within the specified month
        const transactions = await ctx.db
          .query('transactions')
          .withIndex('by_userId_datetime', (q) =>
            q.eq('userId', userData._id).gte('datetime', startDateISO).lte('datetime', endDateISO)
          )
          .collect();

        return {
          userId: userData._id,
          name: userData.name,
          transactionCount: transactions.length,
        };
      })
    );

    // Sort by transaction count (highest first)
    return leaderboardData.sort((a, b) => b.transactionCount - a.transactionCount);
  },
});

// Get transaction counts for all users in a specific date range for leaderboard
export const getUserTransactionLeaderboardByDateRange = query({
  args: {
    ...SessionIdArg,
    startDateISO: v.string(),
    endDateISO: v.string(),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get the date range, adjusting for timezone
    const { startDateISO, endDateISO } = getDateRange(
      args.startDateISO,
      args.endDateISO,
      args.timezoneOffsetMinutes
    );

    // Get all users
    const users = await ctx.db.query('users').collect();

    // For each user, get their transaction count for the date range
    const leaderboardData = await Promise.all(
      users.map(async (userData) => {
        // Count transactions for this user within the specified date range
        const transactions = await ctx.db
          .query('transactions')
          .withIndex('by_userId_datetime', (q) =>
            q.eq('userId', userData._id).gte('datetime', startDateISO).lte('datetime', endDateISO)
          )
          .collect();

        return {
          userId: userData._id,
          name: userData.name,
          transactionCount: transactions.length,
        };
      })
    );

    // Sort by transaction count (highest first)
    return leaderboardData.sort((a, b) => b.transactionCount - a.transactionCount);
  },
});

// Public leaderboard endpoint for date ranges that doesn't require authentication
export const getPublicLeaderboardByDateRange = query({
  args: {
    startDateISO: v.string(),
    endDateISO: v.string(),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the date range, adjusting for timezone
    const { startDateISO, endDateISO } = getDateRange(
      args.startDateISO,
      args.endDateISO,
      args.timezoneOffsetMinutes
    );

    // Get all users
    const users = await ctx.db.query('users').collect();

    // For each user, get their transaction count for the date range
    const leaderboardData = await Promise.all(
      users.map(async (userData) => {
        // Count transactions for this user within the specified date range
        const transactions = await ctx.db
          .query('transactions')
          .withIndex('by_userId_datetime', (q) =>
            q.eq('userId', userData._id).gte('datetime', startDateISO).lte('datetime', endDateISO)
          )
          .collect();

        return {
          userId: userData._id,
          name: userData.name,
          transactionCount: transactions.length,
        };
      })
    );

    // Sort by transaction count (highest first)
    return leaderboardData.sort((a, b) => b.transactionCount - a.transactionCount);
  },
});

// Public leaderboard endpoint for unique days with transactions (doesn't require authentication)
export const getPublicLeaderboardByUniqueDays = query({
  args: {
    startDateISO: v.string(),
    endDateISO: v.string(),
    timezoneOffsetMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the date range, adjusting for timezone
    const { startDateISO, endDateISO } = getDateRange(
      args.startDateISO,
      args.endDateISO,
      args.timezoneOffsetMinutes
    );

    // Convert ISO strings to timestamps for _creationTime comparison
    // Apply timezone offset to the boundaries to ensure we're filtering correctly
    const startDate = new Date(startDateISO);
    const endDate = new Date(endDateISO);

    // Adjust the boundaries by the timezone offset
    // Note: timezoneOffsetMinutes is positive for timezones behind UTC, negative for ahead
    const startTimestamp = startDate.getTime() + args.timezoneOffsetMinutes * 60 * 1000;
    const endTimestamp = endDate.getTime() + args.timezoneOffsetMinutes * 60 * 1000;

    // Get all users
    const users = await ctx.db.query('users').collect();

    // For each user, get their unique days with transactions for the date range
    const leaderboardData = await Promise.all(
      users.map(async (userData) => {
        // Get transactions for this user and filter by _creationTime
        const transactions = await ctx.db
          .query('transactions')
          .withIndex('by_userId', (q) => q.eq('userId', userData._id))
          .filter((q) =>
            q.and(
              q.gte(q.field('_creationTime'), startTimestamp),
              q.lte(q.field('_creationTime'), endTimestamp)
            )
          )
          .collect();

        // Extract unique dates from transactions using _creationTime
        const uniqueDates = new Set<string>();

        for (const transaction of transactions) {
          // Parse the transaction _creationTime and adjust for timezone
          const transactionDate = new Date(transaction._creationTime);

          // Adjust for timezone offset (convert to user's local time)
          const localDate = new Date(
            transactionDate.getTime() - args.timezoneOffsetMinutes * 60 * 1000
          );

          // Get the date string in YYYY-MM-DD format
          const dateString = localDate.toISOString().split('T')[0];

          uniqueDates.add(dateString);
        }

        return {
          userId: userData._id,
          name: userData.name,
          uniqueDaysCount: uniqueDates.size,
        };
      })
    );

    // Sort by unique days count (highest first)
    return leaderboardData.sort((a, b) => b.uniqueDaysCount - a.uniqueDaysCount);
  },
});
