import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createStudent = mutation({
  args: {
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    name: v.string(),
    fatherName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    studentPhone: v.string(),
    parentPhone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    course: v.string(),
    monthlyFee: v.number(),
    admissionDate: v.string(),
  },
  async handler(ctx, args) {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) {
      throw new Error("Batch not found");
    }

    const studentId = await ctx.db.insert("students", {
      academyId: args.academyId,
      batchId: args.batchId,
      name: args.name,
      fatherName: args.fatherName,
      gender: args.gender,
      studentPhone: args.studentPhone,
      parentPhone: args.parentPhone,
      email: args.email,
      address: args.address,
      course: args.course,
      monthlyFee: args.monthlyFee,
      admissionDate: args.admissionDate,
      status: "active",
      attendancePercentage: 0,
      outstandingBalance: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.batchId, {
      currentStudents: batch.currentStudents + 1,
    });

    return {
      studentId,
      name: args.name,
      batchId: args.batchId,
    };
  },
});

export const getStudents = query({
  args: {
    academyId: v.id("academies"),
    batchId: v.optional(v.id("batches")),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("students")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId));

    const students = await query.collect();

    let filtered = students;
    if (args.batchId) {
      filtered = filtered.filter((s) => s.batchId.toString() === args.batchId?.toString());
    }
    if (args.status) {
      filtered = filtered.filter((s) => s.status === args.status);
    }

    return filtered.map((s) => ({
      studentId: s._id,
      name: s.name,
      fatherName: s.fatherName,
      gender: s.gender,
      course: s.course,
      monthlyFee: s.monthlyFee,
      status: s.status,
      attendancePercentage: s.attendancePercentage,
      outstandingBalance: s.outstandingBalance,
      admissionDate: s.admissionDate,
    }));
  },
});

export const getStudent = query({
  args: {
    studentId: v.id("students"),
  },
  async handler(ctx, args) {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    return {
      studentId: student._id,
      name: student.name,
      fatherName: student.fatherName,
      gender: student.gender,
      studentPhone: student.studentPhone,
      parentPhone: student.parentPhone,
      email: student.email,
      address: student.address,
      course: student.course,
      monthlyFee: student.monthlyFee,
      status: student.status,
      attendancePercentage: student.attendancePercentage,
      outstandingBalance: student.outstandingBalance,
      admissionDate: student.admissionDate,
    };
  },
});

export const updateStudent = mutation({
  args: {
    studentId: v.id("students"),
    name: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    studentPhone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    monthlyFee: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated"))),
  },
  async handler(ctx, args) {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.parentPhone !== undefined) updates.parentPhone = args.parentPhone;
    if (args.studentPhone !== undefined) updates.studentPhone = args.studentPhone;
    if (args.email !== undefined) updates.email = args.email;
    if (args.address !== undefined) updates.address = args.address;
    if (args.monthlyFee !== undefined) updates.monthlyFee = args.monthlyFee;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.studentId, updates);

    return {
      studentId: args.studentId,
      message: "Student updated successfully",
    };
  },
});

export const deleteStudent = mutation({
  args: {
    studentId: v.id("students"),
  },
  async handler(ctx, args) {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const batch = await ctx.db.get(student.batchId);
    if (batch) {
      await ctx.db.patch(batch._id, {
        currentStudents: Math.max(0, batch.currentStudents - 1),
      });
    }

    await ctx.db.delete(args.studentId);

    return {
      message: "Student deleted successfully",
    };
  },
});
