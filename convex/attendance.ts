import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const markBatchAttendance = mutation({
  args: {
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    date: v.string(),
    entries: v.array(
      v.object({
        studentId: v.id("students"),
        status: v.union(
          v.literal("present"),
          v.literal("absent"),
          v.literal("late")
        ),
        remarks: v.optional(v.string()),
      })
    ),
  },
  async handler(ctx, args) {
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_batch_date", (q) =>
        q.eq("batchId", args.batchId).eq("date", args.date)
      )
      .collect();

    const byStudent = new Map(
      existing.filter((a) => a.deletedAt === undefined).map((a) => [a.studentId, a])
    );

    let created = 0;
    let updated = 0;

    for (const entry of args.entries) {
      const prior = byStudent.get(entry.studentId);

      if (prior) {
        await ctx.db.patch(prior._id, {
          status: entry.status,
          remarks: entry.remarks,
          updatedAt: Date.now(),
        });
        updated++;
      } else {
        await ctx.db.insert("attendance", {
          academyId: args.academyId,
          batchId: args.batchId,
          studentId: entry.studentId,
          date: args.date,
          status: entry.status,
          remarks: entry.remarks,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        created++;
      }
    }

    return { created, updated };
  },
});

export const getBatchAttendance = query({
  args: {
    batchId: v.id("batches"),
    date: v.string(),
  },
  async handler(ctx, args) {
    const students = await ctx.db
      .query("students")
      .withIndex("by_batchId", (q) => q.eq("batchId", args.batchId))
      .collect();

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_batch_date", (q) =>
        q.eq("batchId", args.batchId).eq("date", args.date)
      )
      .collect();

    const byStudent = new Map(
      records.filter((a) => a.deletedAt === undefined).map((a) => [a.studentId, a])
    );

    return students
      .filter((s) => s.deletedAt === undefined && s.status === "active")
      .map((s) => {
        const record = byStudent.get(s._id);
        return {
          studentId: s._id,
          studentName: s.name,
          status: record?.status ?? null,
          remarks: record?.remarks,
          attendanceId: record?._id ?? null,
        };
      });
  },
});

export const listAttendance = query({
  args: {
    academyId: v.id("academies"),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    let rows = records;
    if (args.fromDate) rows = rows.filter((a) => a.date >= args.fromDate!);
    if (args.toDate) rows = rows.filter((a) => a.date <= args.toDate!);
    if (args.status) rows = rows.filter((a) => a.status === args.status);

    rows.sort((a, b) => b.date.localeCompare(a.date));

    return Promise.all(
      rows.map(async (a) => {
        const student = await ctx.db.get(a.studentId);
        const batch = await ctx.db.get(a.batchId);

        return {
          attendanceId: a._id,
          date: a.date,
          studentName: student?.name ?? "—",
          batchName: batch?.name ?? "—",
          status: a.status,
          remarks: a.remarks,
        };
      })
    );
  },
});

export const getStudentAttendance = query({
  args: { studentId: v.id("students") },
  async handler(ctx, args) {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const live = records.filter((a) => a.deletedAt === undefined);

    const present = live.filter((a) => a.status === "present").length;
    const absent = live.filter((a) => a.status === "absent").length;
    const late = live.filter((a) => a.status === "late").length;

    return {
      total: live.length,
      present,
      absent,
      late,
      rate: live.length > 0 ? Math.round((present / live.length) * 100) : 0,
      records: live
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((a) => ({
          attendanceId: a._id,
          date: a.date,
          status: a.status,
          remarks: a.remarks,
        })),
    };
  },
});

export const deleteAttendance = mutation({
  args: { attendanceId: v.id("attendance") },
  async handler(ctx, args) {
    const record = await ctx.db.get(args.attendanceId);
    if (!record || record.deletedAt !== undefined) {
      throw new Error("Attendance record not found");
    }

    await ctx.db.patch(args.attendanceId, { deletedAt: Date.now() });
    return { attendanceId: args.attendanceId };
  },
});
