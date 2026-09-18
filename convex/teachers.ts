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
      academyId: args.academyId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      subject: args.subject,
      address: args.address,
      monthlySalary: args.monthlySalary,
      hireDate: args.hireDate,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      teacherId,
      name: args.name,
      subject: args.subject,
      status: "active",
    };
  },
});

export const getTeachers = query({
  args: {
    academyId: v.id("academies"),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("teachers")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId));

    const teachers = await query.collect();

    let filtered = teachers;
    if (args.status) {
      filtered = filtered.filter((t) => t.status === args.status);
    }

    return filtered.map((t) => ({
      teacherId: t._id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      subject: t.subject,
      monthlySalary: t.monthlySalary,
      status: t.status,
      hireDate: t.hireDate,
    }));
  },
});

export const getTeacher = query({
  args: {
    teacherId: v.id("teachers"),
  },
  async handler(ctx, args) {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    return {
      teacherId: teacher._id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      subject: teacher.subject,
      address: teacher.address,
      monthlySalary: teacher.monthlySalary,
      status: teacher.status,
      hireDate: teacher.hireDate,
    };
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
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("on_leave"))),
  },
  async handler(ctx, args) {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.address !== undefined) updates.address = args.address;
    if (args.monthlySalary !== undefined) updates.monthlySalary = args.monthlySalary;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.teacherId, updates);

    return {
      teacherId: args.teacherId,
      message: "Teacher updated successfully",
    };
  },
});

export const deleteTeacher = mutation({
  args: {
    teacherId: v.id("teachers"),
  },
  async handler(ctx, args) {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    for (const batch of batches) {
      const otherTeacher = await ctx.db
        .query("teachers")
        .withIndex("by_academyId", (q) => q.eq("academyId", batch.academyId))
        .first();

      if (otherTeacher && otherTeacher._id !== args.teacherId) {
        await ctx.db.patch(batch._id, { teacherId: otherTeacher._id });
      }
    }

    await ctx.db.delete(args.teacherId);

    return {
      message: "Teacher deleted successfully",
    };
  },
});
