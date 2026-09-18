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
    remarks: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const expenseId = await ctx.db.insert("expenses", {
      academyId: args.academyId,
      date: args.date,
      category: args.category,
      description: args.description,
      amount: args.amount,
      paidBy: args.paidBy,
      paymentMethod: args.paymentMethod,
      status: "paid",
      remarks: args.remarks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      expenseId,
      category: args.category,
      amount: args.amount,
      date: args.date,
    };
  },
});

export const getExpenses = query({
  args: {
    academyId: v.id("academies"),
    category: v.optional(v.string()),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("expenses")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId));

    const expenses = await query.collect();

    let filtered = expenses;
    if (args.category) {
      filtered = filtered.filter((e) => e.category === args.category);
    }
    if (args.fromDate) {
      filtered = filtered.filter((e) => e.date >= args.fromDate!);
    }
    if (args.toDate) {
      filtered = filtered.filter((e) => e.date <= args.toDate!);
    }

    return filtered
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((e) => ({
        expenseId: e._id,
        date: e.date,
        category: e.category,
        description: e.description,
        amount: e.amount,
        paidBy: e.paidBy,
        paymentMethod: e.paymentMethod,
        remarks: e.remarks,
      }));
  },
});

export const getExpensesSummary = query({
  args: {
    academyId: v.id("academies"),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("expenses")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId));

    const expenses = await query.collect();

    let filtered = expenses;
    if (args.fromDate) {
      filtered = filtered.filter((e) => e.date >= args.fromDate!);
    }
    if (args.toDate) {
      filtered = filtered.filter((e) => e.date <= args.toDate!);
    }

    const summary: Record<string, number> = {};
    let total = 0;

    filtered.forEach((e) => {
      summary[e.category] = (summary[e.category] || 0) + e.amount;
      total += e.amount;
    });

    return {
      total,
      byCategory: summary,
      count: filtered.length,
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
    remarks: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.date !== undefined) updates.date = args.date;
    if (args.category !== undefined) updates.category = args.category;
    if (args.description !== undefined) updates.description = args.description;
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.paidBy !== undefined) updates.paidBy = args.paidBy;
    if (args.paymentMethod !== undefined) updates.paymentMethod = args.paymentMethod;
    if (args.remarks !== undefined) updates.remarks = args.remarks;

    await ctx.db.patch(args.expenseId, updates);

    return {
      expenseId: args.expenseId,
      message: "Expense updated successfully",
    };
  },
});

export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  async handler(ctx, args) {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    await ctx.db.delete(args.expenseId);

    return {
      message: "Expense deleted successfully",
    };
  },
});
