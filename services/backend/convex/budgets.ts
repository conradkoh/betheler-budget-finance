import { v } from 'convex/values';
import { SessionIdArg } from 'convex-helpers/server/sessions';

import { api } from './_generated/api';
import { mutation, query } from './_generated/server';
import { getMonthDateRange } from './utils';
import { getAuthUser } from '../modules/auth/getAuthUser';

// Create a new budget for a category in a specific month
export const create = mutation({
  args: {
    ...SessionIdArg,
    category: v.string(),
    amount: v.number(),
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Check if budget already exists for this category, month, and year
    const existingBudget = await ctx.db
      .query('budgets')
      .withIndex('by_userId_yearMonth', (q) =>
        q.eq('userId', user._id).eq('year', args.year).eq('month', args.month)
      )
      .filter((q) => q.eq('category', args.category))
      .first();

    if (existingBudget) {
      throw new Error('Budget already exists for this category in the specified month');
    }

    // Create a new budget entry
    const now = Date.now();
    const budgetId = await ctx.db.insert('budgets', {
      userId: user._id,
      category: args.category,
      amount: args.amount,
      year: args.year,
      month: args.month,
      createdAt: now,
      updatedAt: now,
    });

    return budgetId;
  },
});

// Update an existing budget
export const update = mutation({
  args: {
    ...SessionIdArg,
    budgetId: v.id('budgets'),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Fetch the budget
    const budget = await ctx.db.get('budgets', args.budgetId);

    // Check if the budget exists and belongs to the user
    if (!budget || budget.userId !== user._id) {
      throw new Error('Budget not found or unauthorized');
    }

    // Update the budget
    await ctx.db.patch('budgets', args.budgetId, {
      amount: args.amount,
      updatedAt: Date.now(),
    });

    return args.budgetId;
  },
});

// Delete a budget
export const remove = mutation({
  args: {
    ...SessionIdArg,
    budgetId: v.id('budgets'),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Fetch the budget
    const budget = await ctx.db.get('budgets', args.budgetId);

    // Check if the budget exists and belongs to the user
    if (!budget || budget.userId !== user._id) {
      throw new Error('Budget not found or unauthorized');
    }

    // Delete the budget
    await ctx.db.delete('budgets', args.budgetId);

    return args.budgetId;
  },
});

// Get all budgets for a user for a specific month and year
export const listByMonth = query({
  args: {
    ...SessionIdArg,
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Fetch all budgets for this user in the specified month and year
    const budgets = await ctx.db
      .query('budgets')
      .withIndex('by_userId_yearMonth', (q) =>
        q.eq('userId', user._id).eq('year', args.year).eq('month', args.month)
      )
      .collect();

    return budgets;
  },
});

// Get budget progress for the month - comparing budgets to actual spending
export const getBudgetProgress = query({
  args: {
    ...SessionIdArg,
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
    timezoneOffsetMinutes: v.number(), // Make required
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get budgets for this month
    const budgets = await ctx.db
      .query('budgets')
      .withIndex('by_userId_yearMonth', (q) =>
        q.eq('userId', user._id).eq('year', args.year).eq('month', args.month)
      )
      .collect();

    // Get the date range for the specified month, using the timezone offset
    const { startDateISO, endDateISO } = getMonthDateRange(
      args.year,
      args.month,
      args.timezoneOffsetMinutes
    );

    // Get transactions for this user within the specified month
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId_datetime', (q) =>
        q.eq('userId', user._id).gte('datetime', startDateISO).lte('datetime', endDateISO)
      )
      // Filter to only include expense transactions for budget calculations
      .filter((q) => q.eq(q.field('transactionType'), 'expense'))
      .collect();

    // Calculate totals by category
    const spendingByCategory: Record<string, number> = {};

    for (const transaction of transactions) {
      const category = transaction.category;
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

// Get a high-level summary of budget totals and spending for a month
export const getTotalBudgetSummary = query({
  args: {
    ...SessionIdArg,
    year: v.number(),
    month: v.number(), // 0-based (January is 0)
    timezoneOffsetMinutes: v.number(), // Make required
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    type BudgetProgressResult = {
      budgeted: {
        amount: number;
        spent: number;
        status: string;
      }[];
      unbudgeted: {
        spent: number;
      }[];
    };

    // Get budget progress which already includes spending data
    const budgetProgress = (await ctx.runQuery(api.budgets.getBudgetProgress, {
      sessionId: args.sessionId,
      year: args.year,
      month: args.month,
      timezoneOffsetMinutes: args.timezoneOffsetMinutes, // Pass timezone offset
    })) as BudgetProgressResult;

    // Calculate total budget, total spent, and total remaining
    let totalBudget = 0;
    let totalSpent = 0;

    // Add up all budgeted categories
    for (const budget of budgetProgress.budgeted) {
      totalBudget += budget.amount;
      totalSpent += budget.spent;
    }

    // Add spending from unbudgeted categories
    for (const item of budgetProgress.unbudgeted) {
      totalSpent += item.spent;
    }

    const totalRemaining = totalBudget - totalSpent;
    const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      percentSpent,
      budgetCount: budgetProgress.budgeted.length,
      status: totalRemaining >= 0 ? 'within_budget' : 'over_budget',
    };
  },
});

// Copy budgets from one month to another
export const copyBudgetsFromMonth = mutation({
  args: {
    ...SessionIdArg,
    sourceYear: v.number(),
    sourceMonth: v.number(),
    targetYear: v.number(),
    targetMonth: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure user is authenticated
    const user = await getAuthUser(ctx, args);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get budgets from the source month
    const sourceBudgets = await ctx.db
      .query('budgets')
      .withIndex('by_userId_yearMonth', (q) =>
        q.eq('userId', user._id).eq('year', args.sourceYear).eq('month', args.sourceMonth)
      )
      .collect();

    if (sourceBudgets.length === 0) {
      return { copied: 0 };
    }

    // Get existing budgets in the target month to avoid duplicates
    const existingBudgets = await ctx.db
      .query('budgets')
      .withIndex('by_userId_yearMonth', (q) =>
        q.eq('userId', user._id).eq('year', args.targetYear).eq('month', args.targetMonth)
      )
      .collect();

    const existingCategories = new Set(existingBudgets.map((b) => b.category));

    // Only copy budgets for categories that don't already have a budget in the target month
    const budgetsToCopy = sourceBudgets.filter(
      (budget) => !existingCategories.has(budget.category)
    );

    // Create new budgets in the target month
    const now = Date.now();
    const newBudgetIds = [];

    for (const budget of budgetsToCopy) {
      const newBudgetId = await ctx.db.insert('budgets', {
        userId: user._id,
        category: budget.category,
        amount: budget.amount,
        year: args.targetYear,
        month: args.targetMonth,
        createdAt: now,
        updatedAt: now,
      });

      newBudgetIds.push(newBudgetId);
    }

    return {
      copied: newBudgetIds.length,
      total: sourceBudgets.length,
      skipped: sourceBudgets.length - newBudgetIds.length,
    };
  },
});
