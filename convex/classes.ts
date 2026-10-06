import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, fail, ownedDoc, requireOwner } from "./lib/access";

// Courses and batches. Neither is ever deleted: archive keeps history intact.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function checkMoney(n: number, label: string) {
  if (!Number.isInteger(n) || n < 0 || n > 10_000_000) fail("INVALID", `${label} must be a whole amount.`);
}

export const listCourses = query({
  args: { academyId: v.id("academies"), archived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const rows = args.archived
      ? (
          await ctx.db
            .query("courses")
            .withIndex("by_academyId_and_archivedAt", (q) =>
              q.eq("academyId", args.academyId).gt("archivedAt", 0)
            )
            .take(200)
        )
      : await ctx.db
          .query("courses")
          .withIndex("by_academyId_and_archivedAt", (q) =>
            q.eq("academyId", args.academyId).eq("archivedAt", undefined)
          )
          .take(200);
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const saveCourse = mutation({
  args: {
    academyId: v.id("academies"),
    courseId: v.optional(v.id("courses")),
    name: v.string(),
    monthlyFee: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const name = args.name.trim();
    if (name.length < 2 || name.length > 80) fail("INVALID", "Enter the course name.");
    checkMoney(args.monthlyFee, "Monthly fee");

    if (args.courseId) {
      await ownedDoc(ctx, "courses", args.courseId, args.academyId);
      await ctx.db.patch("courses", args.courseId, { name, monthlyFee: args.monthlyFee });
      await audit(ctx, args.academyId, userId, "course.updated", name);
      return args.courseId;
    }
    const id = await ctx.db.insert("courses", { academyId: args.academyId, name, monthlyFee: args.monthlyFee });
    await audit(ctx, args.academyId, userId, "course.created", name);
    return id;
  },
});

export const setCourseArchived = mutation({
  args: { academyId: v.id("academies"), courseId: v.id("courses"), archived: v.boolean() },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const course = await ownedDoc(ctx, "courses", args.courseId, args.academyId);
    if (args.archived) {
      const live = await ctx.db
        .query("batches")
        .withIndex("by_courseId_and_archivedAt", (q) =>
          q.eq("courseId", args.courseId).eq("archivedAt", undefined)
        )
        .first();
      if (live) fail("IN_USE", "Archive this course's batches first.");
    }
    await ctx.db.patch("courses", args.courseId, { archivedAt: args.archived ? Date.now() : undefined });
    await audit(ctx, args.academyId, userId, args.archived ? "course.archived" : "course.restored", course.name);
  },
});

export const listBatches = query({
  args: { academyId: v.id("academies"), archived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const rows = args.archived
      ? await ctx.db
          .query("batches")
          .withIndex("by_academyId_and_archivedAt", (q) =>
            q.eq("academyId", args.academyId).gt("archivedAt", 0)
          )
          .take(200)
      : await ctx.db
          .query("batches")
          .withIndex("by_academyId_and_archivedAt", (q) =>
            q.eq("academyId", args.academyId).eq("archivedAt", undefined)
          )
          .take(200);
    const out = await Promise.all(
      rows.map(async (b) => {
        const course = await ctx.db.get("courses", b.courseId);
        return { ...b, courseName: course?.name ?? "—", courseFee: course?.monthlyFee ?? 0 };
      })
    );
    return out.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name));
  },
});

export const saveBatch = mutation({
  args: {
    academyId: v.id("academies"),
    batchId: v.optional(v.id("batches")),
    courseId: v.id("courses"),
    name: v.string(),
    teacherName: v.string(),
    days: v.array(v.number()),
    startTime: v.string(),
    endTime: v.string(),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const course = await ownedDoc(ctx, "courses", args.courseId, args.academyId);
    if (course.archivedAt !== undefined) fail("INVALID", "That course is archived.");

    const name = args.name.trim();
    const teacherName = args.teacherName.trim();
    if (name.length < 1 || name.length > 60) fail("INVALID", "Enter the batch name.");
    if (teacherName.length < 2 || teacherName.length > 60) fail("INVALID", "Enter the teacher's name.");
    const days = [...new Set(args.days)].sort();
    if (days.length === 0 || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      fail("INVALID", "Pick at least one day.");
    }
    if (!TIME_RE.test(args.startTime) || !TIME_RE.test(args.endTime) || args.endTime <= args.startTime) {
      fail("INVALID", "End time must be after start time.");
    }
    if (!Number.isInteger(args.capacity) || args.capacity < 1 || args.capacity > 1000) {
      fail("INVALID", "Capacity must be between 1 and 1000.");
    }

    const fields = {
      courseId: args.courseId,
      name,
      teacherName,
      days,
      startTime: args.startTime,
      endTime: args.endTime,
      capacity: args.capacity,
    };

    if (args.batchId) {
      const batch = await ownedDoc(ctx, "batches", args.batchId, args.academyId);
      if (args.capacity < batch.enrolled) {
        fail("INVALID", `This batch already has ${batch.enrolled} students.`);
      }
      await ctx.db.patch("batches", args.batchId, fields);
      await audit(ctx, args.academyId, userId, "batch.updated", name);
      return args.batchId;
    }
    const id = await ctx.db.insert("batches", { academyId: args.academyId, enrolled: 0, ...fields });
    await audit(ctx, args.academyId, userId, "batch.created", name);
    return id;
  },
});

export const setBatchArchived = mutation({
  args: { academyId: v.id("academies"), batchId: v.id("batches"), archived: v.boolean() },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const batch = await ownedDoc(ctx, "batches", args.batchId, args.academyId);
    if (args.archived && batch.enrolled > 0) {
      fail("IN_USE", `Move the ${batch.enrolled} students in this batch first.`);
    }
    if (!args.archived) {
      const course = await ctx.db.get("courses", batch.courseId);
      if (!course || course.archivedAt !== undefined) fail("INVALID", "Restore its course first.");
    }
    await ctx.db.patch("batches", args.batchId, { archivedAt: args.archived ? Date.now() : undefined });
    await audit(ctx, args.academyId, userId, args.archived ? "batch.archived" : "batch.restored", batch.name);
  },
});
