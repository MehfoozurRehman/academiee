import { v } from "convex/values";
import { query } from "./_generated/server";
import { fail, requireOwner } from "./lib/access";
import { DATE_RE, MONTH_RE, monthRange, weekdayOf } from "./lib/dates";
import { feeBalance, feeStatus } from "../src/lib/logic/fees";

export const summary = query({
  args: { academyId: v.id("academies"), month: v.string(), today: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    if (!MONTH_RE.test(args.month)) fail("INVALID", "Pick a month.");
    if (!DATE_RE.test(args.today)) fail("INVALID", "Today's date is missing.");
    const { from, to } = monthRange(args.month);

    const students = await ctx.db
      .query("students")
      .withIndex("by_academyId_and_status", (q) => q.eq("academyId", args.academyId).eq("status", "active"))
      .take(5000);
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_academyId_and_archivedAt", (q) => q.eq("academyId", args.academyId).eq("archivedAt", undefined))
      .take(200);
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_academyId_and_month", (q) => q.eq("academyId", args.academyId).eq("month", args.month))
      .take(5000);
    const live = invoices.filter((i) => i.voidedAt === undefined);

    let expected = 0;
    let collected = 0;
    const counts = { paid: 0, partial: 0, due: 0, overdue: 0 };
    for (const i of live) {
      expected += i.amount - i.discount;
      collected += i.paid;
      const st = feeStatus({ ...i, voided: false }, args.today);
      if (st !== "voided") counts[st]++;
    }

    const overdue = live
      .filter((i) => feeStatus({ ...i, voided: false }, args.today) === "overdue")
      .sort((a, b) => feeBalance(b) - feeBalance(a))
      .slice(0, 6);
    const followUps = await Promise.all(
      overdue.map(async (i) => {
        const s = await ctx.db.get("students", i.studentId);
        return {
          invoiceId: i._id,
          studentId: i.studentId,
          studentName: s?.name ?? "—",
          studentCode: s?.code ?? "",
          parentPhone: s?.parentPhone ?? "",
          balance: feeBalance(i),
        };
      })
    );

    const att = await ctx.db
      .query("attendance")
      .withIndex("by_academyId_and_date", (q) => q.eq("academyId", args.academyId).gte("date", from).lte("date", to))
      .take(5000);
    const attended = att.filter((a) => a.status !== "absent").length;

    const exp = await ctx.db
      .query("expenses")
      .withIndex("by_academyId_and_date", (q) => q.eq("academyId", args.academyId).gte("date", from).lte("date", to))
      .take(1000);
    const expenses = exp.filter((e) => e.voidedAt === undefined).reduce((s, e) => s + e.amount, 0);

    const weekday = weekdayOf(args.today);
    const courseNames = new Map<string, string>();
    const todays = batches.filter((b) => b.days.includes(weekday)).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const todaysClasses = [];
    for (const b of todays) {
      if (!courseNames.has(b.courseId)) courseNames.set(b.courseId, (await ctx.db.get("courses", b.courseId))?.name ?? "—");
      todaysClasses.push({
        batchId: b._id,
        name: b.name,
        courseName: courseNames.get(b.courseId)!,
        teacherName: b.teacherName,
        startTime: b.startTime,
        endTime: b.endTime,
        enrolled: b.enrolled,
      });
    }

    return {
      activeStudents: students.length,
      batches: batches.length,
      expected,
      collected,
      outstanding: expected - collected,
      counts,
      followUps,
      attendanceRate: att.length ? Math.round((attended / att.length) * 100) : null,
      expenses,
      net: collected - expenses,
      todaysClasses,
      needsInvoices: students.length > 0 && live.length === 0,
    };
  },
});
