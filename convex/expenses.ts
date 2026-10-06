import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, fail, ownedDoc, requireOwner } from "./lib/access";
import { isRealDate, MONTH_RE, monthRange } from "./lib/dates";

// Expenses are never deleted — they are voided with a reason.

const CATEGORIES = ["rent", "salaries", "utilities", "supplies", "marketing", "maintenance", "other"];

export const list = query({
  args: { academyId: v.id("academies"), month: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    if (!MONTH_RE.test(args.month)) fail("INVALID", "Pick a month.");
    const { from, to } = monthRange(args.month);
    const rows = await ctx.db
      .query("expenses")
      .withIndex("by_academyId_and_date", (q) => q.eq("academyId", args.academyId).gte("date", from).lte("date", to))
      .order("desc")
      .take(1000);

    const byCategory: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      if (r.voidedAt !== undefined) continue;
      total += r.amount;
      byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount;
    }
    return {
      rows: rows.map((r) => ({
        _id: r._id,
        date: r.date,
        category: r.category,
        description: r.description,
        amount: r.amount,
        voided: r.voidedAt !== undefined,
        voidReason: r.voidReason ?? null,
      })),
      total,
      byCategory,
    };
  },
});

export const create = mutation({
  args: {
    academyId: v.id("academies"),
    date: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    if (!isRealDate(args.date)) fail("INVALID", "Pick the expense date.");
    if (!CATEGORIES.includes(args.category)) fail("INVALID", "Pick a category.");
    const description = args.description.trim();
    if (description.length < 2 || description.length > 120) fail("INVALID", "Describe the expense in a few words.");
    if (!Number.isInteger(args.amount) || args.amount <= 0 || args.amount > 100_000_000) {
      fail("INVALID", "Amount must be a whole number above zero.");
    }
    const id = await ctx.db.insert("expenses", {
      academyId: args.academyId,
      date: args.date,
      category: args.category,
      description,
      amount: args.amount,
    });
    await audit(ctx, args.academyId, userId, "expense.created", `${args.category}: ${description} Rs ${args.amount}`);
    return id;
  },
});

export const void_ = mutation({
  args: { academyId: v.id("academies"), expenseId: v.id("expenses"), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const e = await ownedDoc(ctx, "expenses", args.expenseId, args.academyId);
    if (e.voidedAt !== undefined) fail("INVALID", "This expense is already voided.");
    const reason = args.reason.trim();
    if (reason.length < 3 || reason.length > 200) fail("INVALID", "Give a short reason (at least 3 characters).");
    await ctx.db.patch("expenses", e._id, { voidedAt: Date.now(), voidReason: reason });
    await audit(ctx, args.academyId, userId, "expense.voided", `${e.description} Rs ${e.amount}: ${reason}`);
  },
});
export { void_ as void };
