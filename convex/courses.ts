import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createCourse = mutation({
  args: {
    academyId: v.id("academies"),
    name: v.string(),
    description: v.optional(v.string()),
    level: v.optional(v.string()),
    durationWeeks: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const courseId = await ctx.db.insert("courses", {
      academyId: args.academyId,
      name: args.name,
      description: args.description,
      level: args.level,
      durationWeeks: args.durationWeeks,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      courseId,
      name: args.name,
      level: args.level,
    };
  },
});

export const getCourses = query({
  args: {
    academyId: v.id("academies"),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("courses")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId));

    const courses = await query.collect();

    let filtered = courses;
    if (args.status) {
      filtered = filtered.filter((c) => c.status === args.status);
    }

    return filtered.map((c) => ({
      courseId: c._id,
      name: c.name,
      description: c.description,
      level: c.level,
      durationWeeks: c.durationWeeks,
      status: c.status,
    }));
  },
});

export const getCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  async handler(ctx, args) {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    return {
      courseId: course._id,
      name: course.name,
      description: course.description,
      level: course.level,
      durationWeeks: course.durationWeeks,
      status: course.status,
    };
  },
});

export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    level: v.optional(v.string()),
    durationWeeks: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  async handler(ctx, args) {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.level !== undefined) updates.level = args.level;
    if (args.durationWeeks !== undefined) updates.durationWeeks = args.durationWeeks;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.courseId, updates);

    return {
      courseId: args.courseId,
      message: "Course updated successfully",
    };
  },
});

export const deleteCourse = mutation({
  args: {
    courseId: v.id("courses"),
  },
  async handler(ctx, args) {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    for (const batch of batches) {
      await ctx.db.delete(batch._id);
    }

    await ctx.db.delete(args.courseId);

    return {
      message: "Course deleted successfully",
    };
  },
});
