import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTeacher = mutation({
  args: {
    academyId: v.id("academies"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    subject: v.string(),
    address: v.optional(v.string()),
    monthlySalary: v.number(),
    hireDate: v.string(),
  },
  async handler(ctx, args) {
    const teacherId = await ctx.db.insert("teachers", {
      ...args,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { teacherId, name: args.name };
  },
});

export const listTeachers = query({
  args: {
    academyId: v.id("academies"),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const rows = args.status
      ? teachers.filter((t) => t.status === args.status)
      : teachers;

    return Promise.all(
      rows.map(async (t) => {
        const batches = await ctx.db
          .query("batches")
          .withIndex("by_teacherId", (q) => q.eq("teacherId", t._id))
          .collect();

        return {
          teacherId: t._id,
          name: t.name,
          email: t.email,
          phone: t.phone,
          subject: t.subject,
          monthlySalary: t.monthlySalary,
          status: t.status,
          hireDate: t.hireDate,
          batchCount: batches.filter((b) => b.deletedAt === undefined).length,
        };
      })
    );
  },
});

export const updateTeacher = mutation({
  args: {
    teacherId: v.id("teachers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    address: v.optional(v.string()),
    monthlySalary: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("on_leave"))
    ),
  },
  async handler(ctx, args) {
    const { teacherId, ...fields } = args;

    const teacher = await ctx.db.get(teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(teacherId, updates);
    return { teacherId };
  },
});

export const deleteTeacher = mutation({
  args: { teacherId: v.id("teachers") },
  async handler(ctx, args) {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.deletedAt !== undefined) {
      throw new Error("Teacher not found");
    }

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const assigned = batches.filter((b) => b.deletedAt === undefined);
    if (assigned.length > 0) {
      throw new Error(
        `Reassign the ${assigned.length} batch(es) taught by this teacher first`
      );
    }

    await ctx.db.patch(args.teacherId, { deletedAt: Date.now() });
    return { teacherId: args.teacherId };
  },
});
