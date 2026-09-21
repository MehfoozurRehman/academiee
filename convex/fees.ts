import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function resolveStatus(balance: number, amountPaid: number, dueDate: string) {
  if (balance <= 0) return "paid" as const;
  const overdue = new Date(dueDate).getTime() < Date.now();
  if (amountPaid > 0) return overdue ? "overdue" : ("partial" as const);
  return overdue ? ("overdue" as const) : ("due" as const);
}

export const createFee = mutation({
  args: {
    academyId: v.id("academies"),
    studentId: v.id("students"),
    month: v.string(),
    feeAmount: v.number(),
    discount: v.number(),
    dueDate: v.string(),
  },
  async handler(ctx, args) {
    const balance = args.feeAmount - args.discount;

    const feeId = await ctx.db.insert("fees", {
      ...args,
      amountPaid: 0,
      balance,
      status: resolveStatus(balance, 0, args.dueDate),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { feeId, balance };
  },
});

export const generateMonthlyFees = mutation({
  args: {
    academyId: v.id("academies"),
    month: v.string(),
    dueDate: v.string(),
  },
  async handler(ctx, args) {
    const students = await ctx.db
      .query("students")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const active = students.filter((s) => s.status === "active");

    const existing = await ctx.db
      .query("fees")
      .withIndex("by_academy_month", (q) =>
        q.eq("academyId", args.academyId).eq("month", args.month)
      )
      .collect();

    const alreadyBilled = new Set(
      existing.filter((f) => f.deletedAt === undefined).map((f) => f.studentId)
    );

    let created = 0;
    for (const student of active) {
      if (alreadyBilled.has(student._id)) continue;

      await ctx.db.insert("fees", {
        academyId: args.academyId,
        studentId: student._id,
        month: args.month,
        feeAmount: student.monthlyFee,
        discount: 0,
        amountPaid: 0,
        balance: student.monthlyFee,
        status: resolveStatus(student.monthlyFee, 0, args.dueDate),
        dueDate: args.dueDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      created++;
    }

    return { created, skipped: active.length - created };
  },
});

export const recordPayment = mutation({
  args: {
    feeId: v.id("fees"),
    amount: v.number(),
    paymentMethod: v.string(),
    paymentDate: v.optional(v.string()),
  },
  async handler(ctx, args) {
    if (args.amount <= 0) {
      throw new Error("Payment must be greater than zero");
    }

    const fee = await ctx.db.get(args.feeId);
    if (!fee || fee.deletedAt !== undefined) {
      throw new Error("Fee record not found");
    }

    if (args.amount > fee.balance) {
      throw new Error(
        `Payment exceeds the outstanding balance of ${fee.balance}`
      );
    }

    const amountPaid = fee.amountPaid + args.amount;
    const balance = fee.balance - args.amount;

    await ctx.db.patch(args.feeId, {
      amountPaid,
      balance,
      status: resolveStatus(balance, amountPaid, fee.dueDate),
      paymentMethod: args.paymentMethod,
      paymentDate: args.paymentDate ?? new Date().toISOString().slice(0, 10),
      updatedAt: Date.now(),
    });

    return { feeId: args.feeId, balance };
  },
});

export const reversePayment = mutation({
  args: {
    feeId: v.id("fees"),
    amount: v.number(),
  },
  async handler(ctx, args) {
    if (args.amount <= 0) {
      throw new Error("Reversal amount must be greater than zero");
    }

    const fee = await ctx.db.get(args.feeId);
    if (!fee || fee.deletedAt !== undefined) {
      throw new Error("Fee record not found");
    }

    if (args.amount > fee.amountPaid) {
      throw new Error(
        `Reversal amount exceeds the paid amount of ${fee.amountPaid}`
      );
    }

    const amountPaid = fee.amountPaid - args.amount;
    const balance = fee.balance + args.amount;

    await ctx.db.patch(args.feeId, {
      amountPaid,
      balance,
      status: resolveStatus(balance, amountPaid, fee.dueDate),
      paymentMethod: undefined,
      paymentDate: undefined,
      updatedAt: Date.now(),
    });

    return { feeId: args.feeId, balance, reversalAmount: args.amount };
  },
});

export const listFees = query({
  args: {
    academyId: v.id("academies"),
    month: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const fees = await ctx.db
      .query("fees")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    let rows = fees;
    if (args.month) rows = rows.filter((f) => f.month === args.month);
    if (args.status) rows = rows.filter((f) => f.status === args.status);

    return Promise.all(
      rows.map(async (f) => {
        const student = await ctx.db.get(f.studentId);

        return {
          feeId: f._id,
          studentId: f.studentId,
          studentName: student?.name ?? "—",
          month: f.month,
          feeAmount: f.feeAmount,
          discount: f.discount,
          amountPaid: f.amountPaid,
          balance: f.balance,
          status: f.status,
          paymentMethod: f.paymentMethod,
          paymentDate: f.paymentDate,
          dueDate: f.dueDate,
        };
      })
    );
  },
});

export const getStudentFees = query({
  args: { studentId: v.id("students") },
  async handler(ctx, args) {
    const fees = await ctx.db
      .query("fees")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    return fees
      .filter((f) => f.deletedAt === undefined)
      .sort((a, b) => b.month.localeCompare(a.month))
      .map((f) => ({
        feeId: f._id,
        month: f.month,
        feeAmount: f.feeAmount,
        discount: f.discount,
        amountPaid: f.amountPaid,
        balance: f.balance,
        status: f.status,
        paymentMethod: f.paymentMethod,
        paymentDate: f.paymentDate,
        dueDate: f.dueDate,
      }));
  },
});

export const deleteFee = mutation({
  args: { feeId: v.id("fees") },
  async handler(ctx, args) {
    const fee = await ctx.db.get(args.feeId);
    if (!fee || fee.deletedAt !== undefined) {
      throw new Error("Fee record not found");
    }

    await ctx.db.patch(args.feeId, { deletedAt: Date.now() });
    return { feeId: args.feeId };
  },
});
