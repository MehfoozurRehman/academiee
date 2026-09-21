import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createStudent = mutation({
  args: {
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    name: v.string(),
    fatherName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    studentPhone: v.optional(v.string()),
    parentPhone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    monthlyFee: v.number(),
    admissionDate: v.string(),
    customValues: v.optional(v.record(v.string(), v.string())),
  },
  async handler(ctx, args) {
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.deletedAt !== undefined) {
      throw new Error("Batch not found");
    }
    if (batch.currentStudents >= batch.capacity) {
      throw new Error(`${batch.name} is full`);
    }

    const studentId = await ctx.db.insert("students", {
      ...args,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.batchId, {
      currentStudents: batch.currentStudents + 1,
    });

    return { studentId, name: args.name };
  },
});

export const listStudents = query({
  args: {
    academyId: v.id("academies"),
    batchId: v.optional(v.id("batches")),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const students = await ctx.db
      .query("students")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    let rows = students;
    if (args.batchId) rows = rows.filter((s) => s.batchId === args.batchId);
    if (args.status) rows = rows.filter((s) => s.status === args.status);

    if (args.search) {
      const needle = args.search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.parentPhone.includes(needle) ||
          s.fatherName.toLowerCase().includes(needle)
      );
    }

    return Promise.all(
      rows.map(async (s) => {
        const batch = await ctx.db.get(s.batchId);

        const fees = await ctx.db
          .query("fees")
          .withIndex("by_studentId", (q) => q.eq("studentId", s._id))
          .collect();

        const outstanding = fees
          .filter((f) => f.deletedAt === undefined)
          .reduce((sum, f) => sum + f.balance, 0);

        return {
          studentId: s._id,
          name: s.name,
          fatherName: s.fatherName,
          parentPhone: s.parentPhone,
          batchName: batch?.name ?? "—",
          monthlyFee: s.monthlyFee,
          status: s.status,
          outstanding,
        };
      })
    );
  },
});

export const getStudent = query({
  args: { studentId: v.id("students") },
  async handler(ctx, args) {
    const student = await ctx.db.get(args.studentId);
    if (!student || student.deletedAt !== undefined) {
      return null;
    }

    const batch = await ctx.db.get(student.batchId);
    const course = batch ? await ctx.db.get(batch.courseId) : null;

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    const live = attendance.filter((a) => a.deletedAt === undefined);
    const present = live.filter((a) => a.status === "present").length;

    const fees = await ctx.db
      .query("fees")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    return {
      studentId: student._id,
      name: student.name,
      fatherName: student.fatherName,
      gender: student.gender,
      studentPhone: student.studentPhone,
      parentPhone: student.parentPhone,
      email: student.email,
      address: student.address,
      monthlyFee: student.monthlyFee,
      admissionDate: student.admissionDate,
      status: student.status,
      customValues: student.customValues,
      batchId: student.batchId,
      batchName: batch?.name ?? "—",
      batchCourseName: course?.name ?? "—",
      academyId: student.academyId,
      attendanceRate: live.length > 0 ? Math.round((present / live.length) * 100) : 0,
      outstanding: fees
        .filter((f) => f.deletedAt === undefined)
        .reduce((sum, f) => sum + f.balance, 0),
    };
  },
});

export const updateStudent = mutation({
  args: {
    studentId: v.id("students"),
    name: v.optional(v.string()),
    fatherName: v.optional(v.string()),
    studentPhone: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    monthlyFee: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated"))
    ),
    customValues: v.optional(v.record(v.string(), v.string())),
  },
  async handler(ctx, args) {
    const { studentId, ...fields } = args;

    const student = await ctx.db.get(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(studentId, updates);
    return { studentId };
  },
});

export const moveToBatch = mutation({
  args: {
    studentId: v.id("students"),
    batchId: v.id("batches"),
  },
  async handler(ctx, args) {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const target = await ctx.db.get(args.batchId);
    if (!target || target.deletedAt !== undefined) {
      throw new Error("Batch not found");
    }
    if (target.currentStudents >= target.capacity) {
      throw new Error(`${target.name} is full`);
    }

    const previous = await ctx.db.get(student.batchId);
    if (previous) {
      await ctx.db.patch(previous._id, {
        currentStudents: Math.max(0, previous.currentStudents - 1),
      });
    }

    await ctx.db.patch(args.batchId, {
      currentStudents: target.currentStudents + 1,
    });

    await ctx.db.patch(args.studentId, {
      batchId: args.batchId,
      updatedAt: Date.now(),
    });

    return { studentId: args.studentId };
  },
});

export const deleteStudent = mutation({
  args: { studentId: v.id("students") },
  async handler(ctx, args) {
    const student = await ctx.db.get(args.studentId);
    if (!student || student.deletedAt !== undefined) {
      throw new Error("Student not found");
    }

    await ctx.db.patch(args.studentId, { deletedAt: Date.now() });

    const batch = await ctx.db.get(student.batchId);
    if (batch) {
      await ctx.db.patch(batch._id, {
        currentStudents: Math.max(0, batch.currentStudents - 1),
      });
    }

    const fees = await ctx.db
      .query("fees")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    for (const fee of fees) {
      if (fee.deletedAt === undefined) {
        await ctx.db.patch(fee._id, { deletedAt: Date.now() });
      }
    }

    return { studentId: args.studentId };
  },
});
