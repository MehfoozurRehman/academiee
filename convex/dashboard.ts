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

    // Follow-ups look back a year, not just this month: an unpaid fee from
    // two months ago matters more than one due next week. Grouped per student.
    const [y, m] = args.month.split("-").map(Number);
    const start = new Date(y, m - 12, 1);
    const fromMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    const recent = await ctx.db
      .query("invoices")
      .withIndex("by_academyId_and_month", (q) =>
        q.eq("academyId", args.academyId).gte("month", fromMonth).lte("month", args.month)
      )
      .take(10000);
    const owed = new Map<string, { studentId: (typeof recent)[number]["studentId"]; invoiceId: (typeof recent)[number]["_id"]; balance: number; months: number; oldest: string }>();
    for (const i of recent) {
      if (i.voidedAt !== undefined) continue;
      if (feeStatus({ ...i, voided: false }, args.today) !== "overdue") continue;
      const prev = owed.get(i.studentId);
      if (!prev) {
        owed.set(i.studentId, { studentId: i.studentId, invoiceId: i._id, balance: feeBalance(i), months: 1, oldest: i.month });
      } else {
        prev.balance += feeBalance(i);
        prev.months += 1;
        if (i.month < prev.oldest) {
          prev.oldest = i.month;
          prev.invoiceId = i._id;
        }
      }
    }
    const ranked = [...owed.values()].sort((a, b) => b.balance - a.balance);
    const overdueTotal = ranked.reduce((sum, r) => sum + r.balance, 0);
    const followUps = await Promise.all(
      ranked.slice(0, 6).map(async (r) => {
        const s = await ctx.db.get("students", r.studentId);
        return {
          invoiceId: r.invoiceId,
          studentId: r.studentId,
          studentName: s?.name ?? "—",
          studentCode: s?.code ?? "",
          parentPhone: s?.parentPhone ?? "",
          balance: r.balance,
          months: r.months,
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
      overdueStudents: ranked.length,
      overdueTotal,
      attendanceRate: att.length ? Math.round((attended / att.length) * 100) : null,
      expenses,
      net: collected - expenses,
      todaysClasses,
      needsInvoices: students.length > 0 && live.length === 0,
    };
  },
});
