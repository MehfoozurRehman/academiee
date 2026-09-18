import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createBatch = mutation({
  args: {
    academyId: v.id("academies"),
    courseId: v.id("courses"),
    teacherId: v.id("teachers"),
    name: v.string(),
    time: v.string(),
    days: v.string(),
    capacity: v.number(),
  },
  async handler(ctx, args) {
    const batchId = await ctx.db.insert("batches", {
      academyId: args.academyId,
      courseId: args.courseId,
      teacherId: args.teacherId,
      name: args.name,
      time: args.time,
      days: args.days,
      capacity: args.capacity,
      currentStudents: 0,
      occupancyPercentage: 0,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      batchId,
      name: args.name,
      time: args.time,
      capacity: args.capacity,
    };
  },
});

export const getBatches = query({
  args: {
    academyId: v.id("academies"),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("batches")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId));

    const batches = await query.collect();

    let filtered = batches;
    if (args.status) {
      filtered = filtered.filter((b) => b.status === args.status);
    }

    return filtered.map((b) => ({
      batchId: b._id,
      name: b.name,
      time: b.time,
      days: b.days,
      capacity: b.capacity,
      currentStudents: b.currentStudents,
      occupancyPercentage: b.occupancyPercentage,
      status: b.status,
    }));
  },
});

export const getBatch = query({
  args: {
    batchId: v.id("batches"),
  },
  async handler(ctx, args) {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) {
      throw new Error("Batch not found");
    }

    return {
      batchId: batch._id,
      name: batch.name,
      time: batch.time,
      days: batch.days,
      capacity: batch.capacity,
      currentStudents: batch.currentStudents,
      occupancyPercentage: batch.occupancyPercentage,
      status: batch.status,
    };
  },
});

export const updateBatch = mutation({
  args: {
    batchId: v.id("batches"),
    name: v.optional(v.string()),
    time: v.optional(v.string()),
    days: v.optional(v.string()),
    capacity: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("completed"))),
  },
  async handler(ctx, args) {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) {
      throw new Error("Batch not found");
    }

    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.time !== undefined) updates.time = args.time;
    if (args.days !== undefined) updates.days = args.days;
    if (args.capacity !== undefined) {
      updates.capacity = args.capacity;
      updates.occupancyPercentage = Math.round(
        (batch.currentStudents / args.capacity) * 100
      );
    }
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.batchId, updates);

    return {
      batchId: args.batchId,
      message: "Batch updated successfully",
    };
  },
});

export const deleteBatch = mutation({
  args: {
    batchId: v.id("batches"),
  },
  async handler(ctx, args) {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) {
      throw new Error("Batch not found");
    }

    const students = await ctx.db
      .query("students")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .collect();

    for (const student of students) {
      await ctx.db.delete(student._id);
    }

    await ctx.db.delete(args.batchId);

    return {
      message: "Batch deleted successfully",
    };
  },
});
