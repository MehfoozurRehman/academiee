import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createCourse = mutation({
  args: {
    academyId: v.id("academies"),
    name: v.string(),
    description: v.optional(v.string()),
    durationMonths: v.optional(v.number()),
    monthlyFee: v.number(),
  },
  async handler(ctx, args) {
    const courseId = await ctx.db.insert("courses", {
      ...args,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { courseId, name: args.name };
  },
});

export const listCourses = query({
  args: { academyId: v.id("academies") },
  async handler(ctx, args) {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    return Promise.all(
      courses.map(async (c) => {
        const batches = await ctx.db
          .query("batches")
          .withIndex("by_courseId", (q) => q.eq("courseId", c._id))
          .collect();

        const liveBatches = batches.filter((b) => b.deletedAt === undefined);

        const studentCount = liveBatches.reduce(
          (sum, b) => sum + b.currentStudents,
          0
        );

        return {
          courseId: c._id,
          name: c.name,
          description: c.description,
          durationMonths: c.durationMonths,
          monthlyFee: c.monthlyFee,
          batchCount: liveBatches.length,
          studentCount,
          status: c.status,
        };
      })
    );
  },
});

export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    durationMonths: v.optional(v.number()),
    monthlyFee: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  async handler(ctx, args) {
    const { courseId, ...fields } = args;

    const course = await ctx.db.get(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(courseId, updates);
    return { courseId };
  },
});

export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
  async handler(ctx, args) {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.deletedAt !== undefined) {
      throw new Error("Course not found");
    }

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    const liveBatches = batches.filter((b) => b.deletedAt === undefined);
    if (liveBatches.length > 0) {
      throw new Error(
        `Delete the ${liveBatches.length} batch(es) using this course first`
      );
    }

    await ctx.db.patch(args.courseId, { deletedAt: Date.now() });
    return { courseId: args.courseId };
  },
});
