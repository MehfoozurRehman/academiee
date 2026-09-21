import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createBatch = mutation({
  args: {
    academyId: v.id("academies"),
    courseId: v.id("courses"),
    teacherId: v.id("teachers"),
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    days: v.array(v.string()),
    capacity: v.number(),
  },
  async handler(ctx, args) {
    const batchId = await ctx.db.insert("batches", {
      ...args,
      currentStudents: 0,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { batchId, name: args.name };
  },
});

export const listBatches = query({
  args: {
    academyId: v.id("academies"),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const rows = args.status
      ? batches.filter((b) => b.status === args.status)
      : batches;

    return Promise.all(
      rows.map(async (b) => {
        const teacher = await ctx.db.get(b.teacherId);
        const course = await ctx.db.get(b.courseId);

        return {
          batchId: b._id,
          name: b.name,
          courseName: course?.name ?? "—",
          teacherName: teacher?.name ?? "—",
          days: b.days,
          startTime: b.startTime,
          endTime: b.endTime,
          capacity: b.capacity,
          currentStudents: b.currentStudents,
          seatsLeft: Math.max(0, b.capacity - b.currentStudents),
          occupancy:
            b.capacity > 0
              ? Math.round((b.currentStudents / b.capacity) * 100)
              : 0,
          status: b.status,
          monthlyFee: course?.monthlyFee ?? 0,
        };
      })
    );
  },
});

export const updateBatch = mutation({
  args: {
    batchId: v.id("batches"),
    name: v.optional(v.string()),
    teacherId: v.optional(v.id("teachers")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    days: v.optional(v.array(v.string())),
    capacity: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("completed"))
    ),
  },
  async handler(ctx, args) {
    const { batchId, ...fields } = args;

    const batch = await ctx.db.get(batchId);
    if (!batch) {
      throw new Error("Batch not found");
    }

    if (fields.capacity !== undefined && fields.capacity < batch.currentStudents) {
      throw new Error(
        `Capacity cannot be below the ${batch.currentStudents} students already enrolled`
      );
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(batchId, updates);
    return { batchId };
  },
});

export const deleteBatch = mutation({
  args: { batchId: v.id("batches") },
  async handler(ctx, args) {
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.deletedAt !== undefined) {
      throw new Error("Batch not found");
    }

    const students = await ctx.db
      .query("students")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .collect();

    const enrolled = students.filter((s) => s.deletedAt === undefined);
    if (enrolled.length > 0) {
      throw new Error(
        `Move the ${enrolled.length} student(s) in this batch before deleting it`
      );
    }

    await ctx.db.patch(args.batchId, { deletedAt: Date.now() });
    return { batchId: args.batchId };
  },
});
