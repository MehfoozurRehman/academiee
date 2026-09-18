import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createFee = mutation({
  args: {
    academyId: v.id("academies"),
    studentId: v.id("students"),
    month: v.string(),
    year: v.number(),
    feeAmount: v.number(),
    discount: v.number(),
    dueDate: v.string(),
  },
  async handler(ctx, args) {
    const feeId = await ctx.db.insert("fees", {
      academyId: args.academyId,
      studentId: args.studentId,
      month: args.month,
      year: args.year,
      feeAmount: args.feeAmount,
      discount: args.discount,
      paymentPaid: 0,
      balance: args.feeAmount - args.discount,
      status: "pending",
      dueDate: args.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      feeId,
      month: args.month,
      balance: args.feeAmount - args.discount,
    };
  },
});

export const recordPayment = mutation({
  args: {
    feeId: v.id("fees"),
    amountPaid: v.number(),
    paymentMethod: v.optional(v.string()),
    paymentDate: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const fee = await ctx.db.get(args.feeId);
    if (!fee) {
      throw new Error("Fee record not found");
    }

    const newPaymentPaid = fee.paymentPaid + args.amountPaid;
    const newBalance = fee.balance - args.amountPaid;

    let newStatus = fee.status;
    if (newBalance <= 0) {
      newStatus = "paid";
    } else if (newPaymentPaid > 0) {
      newStatus = "partial";
    }

    await ctx.db.patch(args.feeId, {
      paymentPaid: newPaymentPaid,
      balance: Math.max(0, newBalance),
      status: newStatus,
      paymentMethod: args.paymentMethod,
      paymentDate: args.paymentDate || new Date().toISOString().split("T")[0],
      updatedAt: Date.now(),
    });

    const student = await ctx.db.get(fee.studentId);
    if (student) {
      const newOutstanding = Math.max(0, student.outstandingBalance - args.amountPaid);
      await ctx.db.patch(fee.studentId, {
        outstandingBalance: newOutstanding,
      });
    }

    return {
      feeId: args.feeId,
      newStatus,
      balance: Math.max(0, newBalance),
      amountPaid: args.amountPaid,
    };
  },
});

export const getStudentFees = query({
  args: {
    studentId: v.id("students"),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("fees")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId));

    const fees = await query.collect();

    let filtered = fees;
    if (args.status) {
      filtered = filtered.filter((f) => f.status === args.status);
    }

    return filtered
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .map((f) => ({
        feeId: f._id,
        month: f.month,
        feeAmount: f.feeAmount,
        discount: f.discount,
        paymentPaid: f.paymentPaid,
        balance: f.balance,
        status: f.status,
        paymentMethod: f.paymentMethod,
        paymentDate: f.paymentDate,
        dueDate: f.dueDate,
      }));
  },
});

export const getAcademyFees = query({
  args: {
    academyId: v.id("academies"),
    month: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("fees")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId));

    const fees = await query.collect();

    let filtered = fees;
    if (args.month) {
      filtered = filtered.filter((f) => f.month === args.month);
    }
    if (args.status) {
      filtered = filtered.filter((f) => f.status === args.status);
    }

    return filtered.map((f) => ({
      feeId: f._id,
      studentId: f.studentId,
      month: f.month,
      feeAmount: f.feeAmount,
      paymentPaid: f.paymentPaid,
      balance: f.balance,
      status: f.status,
      dueDate: f.dueDate,
    }));
  },
});

export const getMonthlyFeeSummary = query({
  args: {
    academyId: v.id("academies"),
    month: v.string(),
  },
  async handler(ctx, args) {
    const fees = await ctx.db
      .query("fees")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    const monthlyFees = fees.filter((f) => f.month === args.month);

    const summary = {
      totalFees: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      paidCount: 0,
      partialCount: 0,
      overdueCount: 0,
      pendingCount: 0,
    };

    monthlyFees.forEach((f) => {
      summary.totalFees += f.feeAmount;
      summary.totalCollected += f.paymentPaid;
      summary.totalOutstanding += f.balance;

      if (f.status === "paid") summary.paidCount++;
      else if (f.status === "partial") summary.partialCount++;
      else if (f.status === "overdue") summary.overdueCount++;
      else if (f.status === "pending") summary.pendingCount++;
    });

    return summary;
  },
});
