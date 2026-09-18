import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const paySalary = mutation({
  args: {
    academyId: v.id("academies"),
    teacherId: v.id("teachers"),
    month: v.string(),
    bonus: v.number(),
    deduction: v.number(),
    markPaid: v.boolean(),
  },
  async handler(ctx, args) {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.deletedAt !== undefined) {
      throw new Error("Teacher not found");
    }

    const existing = await ctx.db
      .query("salaries")
      .withIndex("by_academy_month", (q) =>
        q.eq("academyId", args.academyId).eq("month", args.month)
      )
      .collect();

    const prior = existing.find(
      (s) => s.teacherId === args.teacherId && s.deletedAt === undefined
    );

    if (prior) {
      throw new Error(
        `${teacher.name} already has a salary record for ${args.month}`
      );
    }

    const payable = teacher.monthlySalary + args.bonus - args.deduction;

    const salaryId = await ctx.db.insert("salaries", {
      academyId: args.academyId,
      teacherId: args.teacherId,
      month: args.month,
      baseAmount: teacher.monthlySalary,
      bonus: args.bonus,
      deduction: args.deduction,
      amountPaid: args.markPaid ? payable : 0,
      status: args.markPaid ? "paid" : "pending",
      paidDate: args.markPaid ? new Date().toISOString().slice(0, 10) : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { salaryId, payable };
  },
});

export const listSalaries = query({
  args: {
    academyId: v.id("academies"),
    month: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const salaries = await ctx.db
      .query("salaries")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const rows = args.month
      ? salaries.filter((s) => s.month === args.month)
      : salaries;

    rows.sort((a, b) => b.month.localeCompare(a.month));

    return Promise.all(
      rows.map(async (s) => {
        const teacher = await ctx.db.get(s.teacherId);

        return {
          salaryId: s._id,
          teacherName: teacher?.name ?? "—",
          month: s.month,
          baseAmount: s.baseAmount,
          bonus: s.bonus,
          deduction: s.deduction,
          payable: s.baseAmount + s.bonus - s.deduction,
          amountPaid: s.amountPaid,
          status: s.status,
          paidDate: s.paidDate,
        };
      })
    );
  },
});

export const markPaid = mutation({
  args: { salaryId: v.id("salaries") },
  async handler(ctx, args) {
    const salary = await ctx.db.get(args.salaryId);
    if (!salary || salary.deletedAt !== undefined) {
      throw new Error("Salary record not found");
    }
    if (salary.status === "paid") {
      throw new Error("This salary is already paid");
    }

    const payable = salary.baseAmount + salary.bonus - salary.deduction;

    await ctx.db.patch(args.salaryId, {
      amountPaid: payable,
      status: "paid",
      paidDate: new Date().toISOString().slice(0, 10),
      updatedAt: Date.now(),
    });

    return { salaryId: args.salaryId, payable };
  },
});

export const deleteSalary = mutation({
  args: { salaryId: v.id("salaries") },
  async handler(ctx, args) {
    const salary = await ctx.db.get(args.salaryId);
    if (!salary || salary.deletedAt !== undefined) {
      throw new Error("Salary record not found");
    }

    await ctx.db.patch(args.salaryId, { deletedAt: Date.now() });
    return { salaryId: args.salaryId };
  },
});
