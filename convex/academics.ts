import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { audit, fail, ownedDoc, requireOwner } from "./lib/access";
import { isRealDate, TIME_RE } from "./lib/dates";

// Tests & results, and the weekly timetable.

function validMarks(n: number) {
  return Number.isFinite(n) && Math.abs(n * 10 - Math.round(n * 10)) < 1e-9;
}

/** Rank per student, 1-based; equal marks share a rank. */
function rankMap(rows: { studentId: Id<"students">; marks: number }[]) {
  const sorted = [...rows].sort((a, b) => b.marks - a.marks);
  const out = new Map<Id<"students">, number>();
  sorted.forEach((r, i) => {
    const prev = sorted[i - 1];
    out.set(r.studentId, prev && prev.marks === r.marks ? out.get(prev.studentId)! : i + 1);
  });
  return out;
}

export const listTests = query({
  args: { academyId: v.id("academies"), batchId: v.optional(v.id("batches")) },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    let tests: Doc<"tests">[];
    if (args.batchId) {
      await ownedDoc(ctx, "batches", args.batchId, args.academyId);
      tests = await ctx.db
        .query("tests")
        .withIndex("by_batchId_and_date", (q) => q.eq("batchId", args.batchId!))
        .order("desc")
        .take(100);
    } else {
      tests = await ctx.db
        .query("tests")
        .withIndex("by_academyId_and_date", (q) => q.eq("academyId", args.academyId))
        .order("desc")
        .take(100);
    }
    return Promise.all(
      tests.map(async (t) => {
        const batch = await ctx.db.get("batches", t.batchId);
        const results = await ctx.db
          .query("results")
          .withIndex("by_testId", (q) => q.eq("testId", t._id))
          .take(1000);
        return {
          _id: t._id,
          batchId: t.batchId,
          batchName: batch?.name ?? "—",
          title: t.title,
          subject: t.subject ?? null,
          date: t.date,
          totalMarks: t.totalMarks,
          resultCount: results.length,
        };
      })
    );
  },
});

export const saveTest = mutation({
  args: {
    academyId: v.id("academies"),
    testId: v.optional(v.id("tests")),
    batchId: v.id("batches"),
    title: v.string(),
    subject: v.optional(v.string()),
    date: v.string(),
    totalMarks: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    await ownedDoc(ctx, "batches", args.batchId, args.academyId);
    const title = args.title.trim();
    const subject = args.subject?.trim() || undefined;
    if (title.length < 2 || title.length > 80) fail("INVALID", "Enter the test title.");
    if (subject && subject.length > 60) fail("INVALID", "Subject is too long.");
    if (!isRealDate(args.date)) fail("INVALID", "Pick the test date.");
    if (!Number.isInteger(args.totalMarks) || args.totalMarks < 1 || args.totalMarks > 1000) {
      fail("INVALID", "Total marks must be a whole number from 1 to 1000.");
    }
    const fields = { batchId: args.batchId, title, subject, date: args.date, totalMarks: args.totalMarks };

    if (args.testId) {
      const test = await ownedDoc(ctx, "tests", args.testId, args.academyId);
      if (test.batchId !== args.batchId) {
        const any = await ctx.db.query("results").withIndex("by_testId", (q) => q.eq("testId", test._id)).first();
        if (any) fail("HAS_RESULTS", "Marks are already entered, so the batch can't change.");
      }
      if (args.totalMarks < test.totalMarks) {
        const rows = await ctx.db.query("results").withIndex("by_testId", (q) => q.eq("testId", test._id)).take(1000);
        if (rows.some((r) => r.marks > args.totalMarks)) {
          fail("INVALID", "Some students already scored more than that.");
        }
      }
      await ctx.db.patch("tests", args.testId, fields);
      await audit(ctx, args.academyId, userId, "test.updated", title);
      return args.testId;
    }
    const id = await ctx.db.insert("tests", { academyId: args.academyId, ...fields });
    await audit(ctx, args.academyId, userId, "test.created", title);
    return id;
  },
});

export const getTest = query({
  args: { academyId: v.id("academies"), testId: v.id("tests") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const test = await ownedDoc(ctx, "tests", args.testId, args.academyId);
    const batch = await ctx.db.get("batches", test.batchId);
    const students = await ctx.db
      .query("students")
      .withIndex("by_batchId_and_status", (q) => q.eq("batchId", test.batchId).eq("status", "active"))
      .take(500);
    const results = await ctx.db
      .query("results")
      .withIndex("by_testId", (q) => q.eq("testId", test._id))
      .take(1000);
    const marksBy = new Map(results.map((r) => [r.studentId, r.marks]));
    const ranks = rankMap(results);
    const scored = results.map((r) => r.marks);
    const average = scored.length
      ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length / test.totalMarks) * 1000) / 10
      : null;

    return {
      test: {
        _id: test._id,
        batchId: test.batchId,
        batchName: batch?.name ?? "—",
        title: test.title,
        subject: test.subject ?? null,
        date: test.date,
        totalMarks: test.totalMarks,
      },
      stats: { count: scored.length, averagePercent: average, highest: scored.length ? Math.max(...scored) : null },
      students: students
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          marks: marksBy.get(s._id) ?? null,
          rank: ranks.get(s._id) ?? null,
        })),
    };
  },
});

export const saveResults = mutation({
  args: {
    academyId: v.id("academies"),
    testId: v.id("tests"),
    entries: v.array(v.object({ studentId: v.id("students"), marks: v.union(v.number(), v.null()) })),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const test = await ownedDoc(ctx, "tests", args.testId, args.academyId);
    if (args.entries.length > 500) fail("INVALID", "Too many students at once.");

    const existing = await ctx.db.query("results").withIndex("by_testId", (q) => q.eq("testId", test._id)).take(1000);
    const byStudent = new Map(existing.map((r) => [r.studentId, r]));
    const seen = new Set<string>();

    for (const e of args.entries) {
      if (seen.has(e.studentId)) fail("INVALID", "A student appears twice in this list.");
      seen.add(e.studentId);
      const s = await ownedDoc(ctx, "students", e.studentId, args.academyId);
      if (s.batchId !== test.batchId) fail("INVALID", `${s.name} isn't in this test's batch.`);
      if (e.marks !== null) {
        if (!validMarks(e.marks)) fail("INVALID", `Marks for ${s.name} can have at most one decimal place.`);
        if (e.marks < 0 || e.marks > test.totalMarks) {
          fail("INVALID", `Marks for ${s.name} must be between 0 and ${test.totalMarks}.`);
        }
      }
    }

    let saved = 0;
    let removed = 0;
    for (const e of args.entries) {
      const row = byStudent.get(e.studentId);
      if (e.marks === null) {
        if (row) {
          await ctx.db.delete("results", row._id);
          removed++;
        }
      } else if (row) {
        if (row.marks !== e.marks) await ctx.db.patch("results", row._id, { marks: e.marks });
        saved++;
      } else {
        await ctx.db.insert("results", { academyId: args.academyId, testId: test._id, studentId: e.studentId, marks: e.marks });
        saved++;
      }
    }
    await audit(ctx, args.academyId, userId, "test.results", `${test.title}: ${saved} saved, ${removed} removed`);
    return { saved, removed };
  },
});

export const deleteTest = mutation({
  args: { academyId: v.id("academies"), testId: v.id("tests") },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const test = await ownedDoc(ctx, "tests", args.testId, args.academyId);
    const any = await ctx.db.query("results").withIndex("by_testId", (q) => q.eq("testId", test._id)).first();
    if (any) fail("HAS_RESULTS", "This test has marks entered. Clear the marks first.");
    await ctx.db.delete("tests", test._id);
    await audit(ctx, args.academyId, userId, "test.deleted", test.title);
  },
});

// ---------------------------------------------------------------- timetable

export const listSlots = query({
  args: { academyId: v.id("academies") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const slots = await ctx.db
      .query("slots")
      .withIndex("by_academyId_and_day", (q) => q.eq("academyId", args.academyId))
      .take(500);
    const names = new Map<Id<"batches">, string>();
    for (const s of slots) {
      if (!names.has(s.batchId)) names.set(s.batchId, (await ctx.db.get("batches", s.batchId))?.name ?? "—");
    }
    return slots
      .map((s) => ({
        _id: s._id,
        batchId: s.batchId,
        batchName: names.get(s.batchId)!,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject,
        teacherName: s.teacherName,
      }))
      .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));
  },
});

export const saveSlot = mutation({
  args: {
    academyId: v.id("academies"),
    slotId: v.optional(v.id("slots")),
    batchId: v.id("batches"),
    day: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    subject: v.string(),
    teacherName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const batch = await ownedDoc(ctx, "batches", args.batchId, args.academyId);
    if (args.slotId) await ownedDoc(ctx, "slots", args.slotId, args.academyId);
    const subject = args.subject.trim();
    const teacherName = args.teacherName.trim();
    if (!Number.isInteger(args.day) || args.day < 0 || args.day > 6) fail("INVALID", "Pick a day.");
    if (!TIME_RE.test(args.startTime) || !TIME_RE.test(args.endTime) || args.endTime <= args.startTime) {
      fail("INVALID", "End time must be after start time.");
    }
    if (subject.length < 1 || subject.length > 60) fail("INVALID", "Enter the subject.");
    if (teacherName.length < 2 || teacherName.length > 60) fail("INVALID", "Enter the teacher's name.");

    const sameDay = await ctx.db
      .query("slots")
      .withIndex("by_academyId_and_day", (q) => q.eq("academyId", args.academyId).eq("day", args.day))
      .take(200);
    for (const o of sameDay) {
      if (o._id === args.slotId) continue;
      const overlaps = args.startTime < o.endTime && o.startTime < args.endTime;
      if (!overlaps) continue;
      if (o.batchId === args.batchId) {
        fail("CLASH", `${batch.name} already has a class ${o.startTime}–${o.endTime} on this day.`);
      }
      if (o.teacherName.trim().toLowerCase() === teacherName.toLowerCase()) {
        fail("CLASH", `${o.teacherName} already teaches ${o.startTime}–${o.endTime} on this day.`);
      }
    }

    const fields = { batchId: args.batchId, day: args.day, startTime: args.startTime, endTime: args.endTime, subject, teacherName };
    if (args.slotId) {
      await ctx.db.patch("slots", args.slotId, fields);
      await audit(ctx, args.academyId, userId, "slot.updated", `${batch.name} ${subject}`);
      return args.slotId;
    }
    const id = await ctx.db.insert("slots", { academyId: args.academyId, ...fields });
    await audit(ctx, args.academyId, userId, "slot.created", `${batch.name} ${subject}`);
    return id;
  },
});

export const deleteSlot = mutation({
  args: { academyId: v.id("academies"), slotId: v.id("slots") },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const slot = await ownedDoc(ctx, "slots", args.slotId, args.academyId);
    await ctx.db.delete("slots", slot._id);
    await audit(ctx, args.academyId, userId, "slot.deleted", slot.subject);
  },
});
