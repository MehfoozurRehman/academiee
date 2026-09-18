import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const RECOVERABLE = v.union(
  v.literal("students"),
  v.literal("teachers"),
  v.literal("batches"),
  v.literal("courses"),
  v.literal("fees"),
  v.literal("attendance"),
  v.literal("expenses"),
  v.literal("tests"),
  v.literal("timetable"),
  v.literal("salaries")
);

export const listDeleted = query({
  args: { academyId: v.id("academies") },
  async handler(ctx, args) {
    const items: {
      id: string;
      table: string;
      label: string;
      detail: string;
      deletedAt: number;
    }[] = [];

    const students = await ctx.db
      .query("students")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const s of students) {
      if (s.deletedAt === undefined) continue;
      items.push({
        id: s._id,
        table: "students",
        label: s.name,
        detail: s.fatherName,
        deletedAt: s.deletedAt,
      });
    }

    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const t of teachers) {
      if (t.deletedAt === undefined) continue;
      items.push({
        id: t._id,
        table: "teachers",
        label: t.name,
        detail: t.subject,
        deletedAt: t.deletedAt,
      });
    }

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const b of batches) {
      if (b.deletedAt === undefined) continue;
      items.push({
        id: b._id,
        table: "batches",
        label: b.name,
        detail: `${b.startTime}–${b.endTime}`,
        deletedAt: b.deletedAt,
      });
    }

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const c of courses) {
      if (c.deletedAt === undefined) continue;
      items.push({
        id: c._id,
        table: "courses",
        label: c.name,
        detail: `${c.monthlyFee}/month`,
        deletedAt: c.deletedAt,
      });
    }

    const fees = await ctx.db
      .query("fees")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const f of fees) {
      if (f.deletedAt === undefined) continue;
      items.push({
        id: f._id,
        table: "fees",
        label: `Fee · ${f.month}`,
        detail: `${f.feeAmount}`,
        deletedAt: f.deletedAt,
      });
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const e of expenses) {
      if (e.deletedAt === undefined) continue;
      items.push({
        id: e._id,
        table: "expenses",
        label: e.description,
        detail: `${e.category} · ${e.amount}`,
        deletedAt: e.deletedAt,
      });
    }

    const tests = await ctx.db
      .query("tests")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const t of tests) {
      if (t.deletedAt === undefined) continue;
      items.push({
        id: t._id,
        table: "tests",
        label: t.name,
        detail: t.date,
        deletedAt: t.deletedAt,
      });
    }

    const slots = await ctx.db
      .query("timetable")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const s of slots) {
      if (s.deletedAt === undefined) continue;
      items.push({
        id: s._id,
        table: "timetable",
        label: `${s.day} ${s.startTime}`,
        detail: s.subject,
        deletedAt: s.deletedAt,
      });
    }

    const salaries = await ctx.db
      .query("salaries")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const s of salaries) {
      if (s.deletedAt === undefined) continue;
      items.push({
        id: s._id,
        table: "salaries",
        label: `Salary · ${s.month}`,
        detail: `${s.baseAmount}`,
        deletedAt: s.deletedAt,
      });
    }

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    for (const a of attendance) {
      if (a.deletedAt === undefined) continue;
      items.push({
        id: a._id,
        table: "attendance",
        label: a.date,
        detail: a.status,
        deletedAt: a.deletedAt,
      });
    }

    return items.sort((a, b) => b.deletedAt - a.deletedAt);
  },
});

export const restore = mutation({
  args: {
    table: RECOVERABLE,
    id: v.string(),
  },
  async handler(ctx, args) {
    const id = ctx.db.normalizeId(args.table, args.id);
    if (!id) {
      throw new Error("Item not found");
    }

    const doc = await ctx.db.get(id);
    if (!doc || doc.deletedAt === undefined) {
      throw new Error("That item is not in the recycle bin");
    }

    if (args.table === "students") {
      const student = doc as { batchId: import("./_generated/dataModel").Id<"batches"> };
      const batch = await ctx.db.get(student.batchId);

      if (!batch || batch.deletedAt !== undefined) {
        throw new Error("Restore the student's batch first");
      }
      if (batch.currentStudents >= batch.capacity) {
        throw new Error(`${batch.name} is full`);
      }

      await ctx.db.patch(batch._id, {
        currentStudents: batch.currentStudents + 1,
      });
    }

    await ctx.db.patch(id, { deletedAt: undefined });
    return { restored: true };
  },
});

export const purge = mutation({
  args: {
    table: RECOVERABLE,
    id: v.string(),
  },
  async handler(ctx, args) {
    const id = ctx.db.normalizeId(args.table, args.id);
    if (!id) {
      throw new Error("Item not found");
    }

    const doc = await ctx.db.get(id);
    if (!doc || doc.deletedAt === undefined) {
      throw new Error("Only items in the recycle bin can be permanently deleted");
    }

    await ctx.db.delete(id);
    return { purged: true };
  },
});
