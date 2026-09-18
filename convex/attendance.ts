import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const recordAttendance = mutation({
  args: {
    academyId: v.id("academies"),
    studentId: v.id("students"),
    batchId: v.id("batches"),
    date: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
    remarks: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const attendanceId = await ctx.db.insert("attendance", {
      academyId: args.academyId,
      studentId: args.studentId,
      batchId: args.batchId,
      date: args.date,
      status: args.status,
      remarks: args.remarks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const allAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const presentCount = allAttendance.filter((a) => a.status === "present").length;
    const attendancePercentage = Math.round((presentCount / allAttendance.length) * 100);

    const student = await ctx.db.get(args.studentId);
    if (student) {
      await ctx.db.patch(args.studentId, {
        attendancePercentage,
      });
    }

    return {
      attendanceId,
      date: args.date,
      status: args.status,
    };
  },
});

export const getStudentAttendance = query({
  args: {
    studentId: v.id("students"),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId));

    const attendance = await query.collect();

    let filtered = attendance;
    if (args.fromDate) {
      filtered = filtered.filter((a) => a.date >= args.fromDate!);
    }
    if (args.toDate) {
      filtered = filtered.filter((a) => a.date <= args.toDate!);
    }

    return filtered
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((a) => ({
        attendanceId: a._id,
        date: a.date,
        status: a.status,
        remarks: a.remarks,
      }));
  },
});

export const getBatchAttendance = query({
  args: {
    batchId: v.id("batches"),
    date: v.string(),
  },
  async handler(ctx, args) {
    let query = ctx.db
      .query("attendance")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId));

    const attendance = await query.collect();
    const filtered = attendance.filter((a) => a.date === args.date);

    return filtered.map((a) => ({
      attendanceId: a._id,
      studentId: a.studentId,
      status: a.status,
      remarks: a.remarks,
    }));
  },
});

export const getStudentAttendanceStats = query({
  args: {
    studentId: v.id("students"),
  },
  async handler(ctx, args) {
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const presentCount = attendance.filter((a) => a.status === "present").length;
    const absentCount = attendance.filter((a) => a.status === "absent").length;
    const lateCount = attendance.filter((a) => a.status === "late").length;
    const total = attendance.length;

    const attendancePercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return {
      total,
      presentCount,
      absentCount,
      lateCount,
      attendancePercentage,
    };
  },
});

export const updateAttendance = mutation({
  args: {
    attendanceId: v.id("attendance"),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
    remarks: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const record = await ctx.db.get(args.attendanceId);
    if (!record) {
      throw new Error("Attendance record not found");
    }

    await ctx.db.patch(args.attendanceId, {
      status: args.status,
      remarks: args.remarks,
      updatedAt: Date.now(),
    });

    const allAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", record.studentId))
      .collect();

    const presentCount = allAttendance.filter((a) => a.status === "present").length;
    const attendancePercentage = allAttendance.length > 0
      ? Math.round((presentCount / allAttendance.length) * 100)
      : 0;

    await ctx.db.patch(record.studentId, {
      attendancePercentage,
    });

    return {
      attendanceId: args.attendanceId,
      message: "Attendance updated successfully",
    };
  },
});
