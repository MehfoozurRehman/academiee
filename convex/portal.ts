import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import { requireStudent } from "./lib/access";
import { weekdayOf } from "./lib/dates";
import { feeBalance, feeStatus } from "../src/lib/logic/fees";

// The student's own view. Identity comes from the session; there is no
// studentId argument anywhere in this file.

function rankOf(rows: { studentId: Id<"students">; marks: number }[], studentId: Id<"students">, marks: number) {
  return 1 + rows.filter((r) => r.marks > marks).length;
}

function rateOf(rows: { status: string }[]) {
  if (rows.length === 0) return null;
  return Math.round((rows.filter((r) => r.status !== "absent").length / rows.length) * 100);
}

async function noticesFor(ctx: QueryCtx, student: Doc<"students">, limit: number) {
  const rows = await ctx.db
    .query("notices")
    .withIndex("by_academyId", (q) => q.eq("academyId", student.academyId))
    .order("desc")
    .take(200);
  return rows
    .filter((n) => n.batchId === undefined || n.batchId === student.batchId)
    .slice(0, limit)
    .map((n) => ({ _id: n._id, title: n.title, body: n.body, forBatch: n.batchId !== undefined, createdAt: n._creationTime }));
}

function nextClassOf(batch: Doc<"batches">, today: string) {
  const wd = weekdayOf(today);
  for (let offset = 0; offset < 7; offset++) {
    const day = (wd + offset) % 7;
    if (batch.days.includes(day)) {
      return { day, isToday: offset === 0, startTime: batch.startTime, endTime: batch.endTime };
    }
  }
  return null;
}

export const home = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const { student, academy } = await requireStudent(ctx);
    const batch = await ctx.db.get("batches", student.batchId);
    const course = batch ? await ctx.db.get("courses", batch.courseId) : null;

    const wd = weekdayOf(args.today);
    const daySlots = batch
      ? await ctx.db
          .query("slots")
          .withIndex("by_batchId_and_day", (q) => q.eq("batchId", batch._id).eq("day", wd))
          .take(20)
      : [];
    const todaysSlots = daySlots
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((s) => ({ _id: s._id, startTime: s.startTime, endTime: s.endTime, subject: s.subject, teacherName: s.teacherName }));

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_studentId_and_month", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(36);
    const open = invoices.filter((i) => i.voidedAt === undefined && feeBalance(i) > 0);
    const outstanding = open.reduce((s, i) => s + feeBalance(i), 0);
    const next = [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

    const att = await ctx.db
      .query("attendance")
      .withIndex("by_studentId_and_date", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(365);

    const myResults = await ctx.db
      .query("results")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(30);
    let latest: { title: string; marks: number; totalMarks: number; date: string } | null = null;
    for (const r of myResults) {
      const t = await ctx.db.get("tests", r.testId);
      if (t && (!latest || t.date > latest.date)) {
        latest = { title: t.title, marks: r.marks, totalMarks: t.totalMarks, date: t.date };
      }
    }

    return {
      student: { name: student.name, code: student.code },
      academy: { name: academy.name, phone: academy.phone ?? null, whatsapp: academy.whatsapp ?? null },
      batch: batch
        ? { name: batch.name, teacherName: batch.teacherName, days: batch.days, startTime: batch.startTime, endTime: batch.endTime }
        : null,
      courseName: course?.name ?? null,
      todaysSlots,
      nextClass: todaysSlots.length === 0 && batch ? nextClassOf(batch, args.today) : null,
      fees: {
        outstanding,
        next: next
          ? {
              month: next.month,
              dueDate: next.dueDate,
              balance: feeBalance(next),
              status: feeStatus({ ...next, voided: false }, args.today),
            }
          : null,
      },
      attendanceRate: rateOf(att),
      latestResult: latest,
      notices: await noticesFor(ctx, student, 3),
    };
  },
});

export const fees = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const { student } = await requireStudent(ctx);
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_studentId_and_month", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(36);
    return Promise.all(
      invoices.map(async (i) => {
        const voided = i.voidedAt !== undefined;
        const payments = voided
          ? []
          : await ctx.db.query("payments").withIndex("by_invoiceId", (q) => q.eq("invoiceId", i._id)).take(100);
        return {
          _id: i._id,
          month: i.month,
          amount: i.amount,
          discount: i.discount,
          paid: i.paid,
          dueDate: i.dueDate,
          balance: voided ? 0 : feeBalance(i),
          status: feeStatus({ ...i, voided }, args.today),
          payments: payments
            .filter((p) => p.voidedAt === undefined)
            .sort((a, b) => b.receiptNo - a.receiptNo)
            .map((p) => ({ paymentId: p._id, receiptNo: p.receiptNo, amount: p.amount, method: p.method, date: p.date })),
        };
      })
    );
  },
});

export const attendance = query({
  args: {},
  handler: async (ctx) => {
    const { student } = await requireStudent(ctx);
    const rows = await ctx.db
      .query("attendance")
      .withIndex("by_studentId_and_date", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(120);
    const counts = { present: 0, late: 0, absent: 0 };
    for (const r of rows) counts[r.status]++;
    return { rate: rateOf(rows), counts, records: rows.map((r) => ({ date: r.date, status: r.status })) };
  },
});

export const results = query({
  args: {},
  handler: async (ctx) => {
    const { student } = await requireStudent(ctx);
    const mine = await ctx.db
      .query("results")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(100);
    const out = [];
    for (const r of mine) {
      const t = await ctx.db.get("tests", r.testId);
      if (!t) continue;
      const all = await ctx.db.query("results").withIndex("by_testId", (q) => q.eq("testId", t._id)).take(1000);
      out.push({
        testId: t._id,
        title: t.title,
        subject: t.subject ?? null,
        date: t.date,
        marks: r.marks,
        totalMarks: t.totalMarks,
        percentage: Math.round((r.marks / t.totalMarks) * 1000) / 10,
        rank: rankOf(all, student._id, r.marks),
        outOf: all.length,
      });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const timetable = query({
  args: {},
  handler: async (ctx) => {
    const { student } = await requireStudent(ctx);
    const batch = await ctx.db.get("batches", student.batchId);
    const slots = await ctx.db
      .query("slots")
      .withIndex("by_batchId_and_day", (q) => q.eq("batchId", student.batchId))
      .take(100);
    return {
      slots: slots
        .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime))
        .map((s) => ({ _id: s._id, day: s.day, startTime: s.startTime, endTime: s.endTime, subject: s.subject, teacherName: s.teacherName })),
      fallback: batch ? { days: batch.days, startTime: batch.startTime, endTime: batch.endTime, teacherName: batch.teacherName } : null,
    };
  },
});

export const notices = query({
  args: {},
  handler: async (ctx) => {
    const { student } = await requireStudent(ctx);
    return noticesFor(ctx, student, 50);
  },
});
