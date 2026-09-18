import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createExpense = mutation({
  args: {
    academyId: v.id("academies"),
    date: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    paidBy: v.string(),
    paymentMethod: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const expenseId = await ctx.db.insert("expenses", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { expenseId, amount: args.amount };
  },
});

export const listExpenses = query({
  args: {
    academyId: v.id("academies"),
    category: v.optional(v.string()),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    let rows = expenses;
    if (args.category) rows = rows.filter((e) => e.category === args.category);
    if (args.fromDate) rows = rows.filter((e) => e.date >= args.fromDate!);
    if (args.toDate) rows = rows.filter((e) => e.date <= args.toDate!);

    rows.sort((a, b) => b.date.localeCompare(a.date));

    const total = rows.reduce((sum, e) => sum + e.amount, 0);

    const byCategory: Record<string, number> = {};
    for (const e of rows) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }

    return {
      total,
      byCategory,
      rows: rows.map((e) => ({
        expenseId: e._id,
        date: e.date,
        category: e.category,
        description: e.description,
        amount: e.amount,
        paidBy: e.paidBy,
        paymentMethod: e.paymentMethod,
      })),
    };
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    date: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    paidBy: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const { expenseId, ...fields } = args;

    const expense = await ctx.db.get(expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(expenseId, updates);
    return { expenseId };
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  async handler(ctx, args) {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.deletedAt !== undefined) {
      throw new Error("Expense not found");
    }

    await ctx.db.patch(args.expenseId, { deletedAt: Date.now() });
    return { expenseId: args.expenseId };
  },
});
