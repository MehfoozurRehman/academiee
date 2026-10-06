import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { attendanceStatus } from "./schema";
import { audit, fail, ownedDoc, requireOwner } from "./lib/access";
import { isRealDate, MONTH_RE, monthRange, weekdayOf } from "./lib/dates";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The roll for one batch on one day: active students and what's marked. */
export const forBatchDay = query({
  args: { academyId: v.id("academies"), batchId: v.id("batches"), date: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const batch = await ownedDoc(ctx, "batches", args.batchId, args.academyId);
    if (!isRealDate(args.date)) fail("INVALID", "Pick a valid date.");

    const students = await ctx.db
      .query("students")
      .withIndex("by_batchId_and_status", (q) => q.eq("batchId", args.batchId).eq("status", "active"))
      .take(500);
    const marked = await ctx.db
      .query("attendance")
      .withIndex("by_batchId_and_date", (q) => q.eq("batchId", args.batchId).eq("date", args.date))
      .take(1000);
    const byStudent = new Map(marked.map((a) => [a.studentId, a.status]));

    return {
      isClassDay: batch.days.includes(weekdayOf(args.date)),
      students: students
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ _id: s._id, name: s.name, code: s.code, status: byStudent.get(s._id) ?? null })),
    };
  },
});

export const save = mutation({
  args: {
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    date: v.string(),
    entries: v.array(v.object({ studentId: v.id("students"), status: attendanceStatus })),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const batch = await ownedDoc(ctx, "batches", args.batchId, args.academyId);
    if (!isRealDate(args.date)) fail("INVALID", "Pick a valid date.");
    // Allow a little slack for timezones: at most 1 day ahead of UTC now.
    const limit = new Date(Date.now() + DAY_MS).toISOString().slice(0, 10);
    if (args.date > limit) fail("INVALID", "You can't mark attendance for a future date.");
    if (args.entries.length === 0) fail("INVALID", "Mark at least one student.");
    if (args.entries.length > 500) fail("INVALID", "Too many students at once.");

    const seen = new Set<string>();
    for (const e of args.entries) {
      if (seen.has(e.studentId)) fail("INVALID", "A student appears twice in this list.");
      seen.add(e.studentId);
      const s = await ownedDoc(ctx, "students", e.studentId, args.academyId);
      if (s.batchId !== args.batchId) fail("INVALID", `${s.name} isn't in this batch.`);
      if (s.status !== "active") fail("INVALID", `${s.name} isn't an active student.`);
    }

    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_batchId_and_date", (q) => q.eq("batchId", args.batchId).eq("date", args.date))
      .take(1000);
    const byStudent = new Map(existing.map((a) => [a.studentId, a]));

    for (const e of args.entries) {
      const row = byStudent.get(e.studentId);
      if (row) {
        if (row.status !== e.status) await ctx.db.patch("attendance", row._id, { status: e.status });
      } else {
        await ctx.db.insert("attendance", {
          academyId: args.academyId,
          batchId: args.batchId,
          studentId: e.studentId,
          date: args.date,
          status: e.status,
        });
      }
    }
    await audit(ctx, args.academyId, userId, "attendance.saved", `${batch.name} ${args.date}: ${args.entries.length} students`);
    return { saved: args.entries.length };
  },
});

/** Per-batch attendance for a month. */
export const summary = query({
  args: { academyId: v.id("academies"), month: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    if (!MONTH_RE.test(args.month)) fail("INVALID", "Pick a month.");
    const { from, to } = monthRange(args.month);

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_academyId_and_archivedAt", (q) => q.eq("academyId", args.academyId).eq("archivedAt", undefined))
      .take(200);
    const rows = await ctx.db
      .query("attendance")
      .withIndex("by_academyId_and_date", (q) => q.eq("academyId", args.academyId).gte("date", from).lte("date", to))
      .take(5000);

    const stats = new Map<string, { days: Set<string>; present: number; late: number; absent: number }>();
    for (const r of rows) {
      let s = stats.get(r.batchId);
      if (!s) stats.set(r.batchId, (s = { days: new Set(), present: 0, late: 0, absent: 0 }));
      s.days.add(r.date);
      s[r.status]++;
    }
    return batches
      .map((b) => {
        const s = stats.get(b._id);
        const total = s ? s.present + s.late + s.absent : 0;
        return {
          batchId: b._id,
          batchName: b.name,
          markedDays: s?.days.size ?? 0,
          present: s?.present ?? 0,
          late: s?.late ?? 0,
          absent: s?.absent ?? 0,
          rate: total ? Math.round((((s?.present ?? 0) + (s?.late ?? 0)) / total) * 100) : null,
        };
      })
      .sort((a, b) => a.batchName.localeCompare(b.batchName));
  },
});
