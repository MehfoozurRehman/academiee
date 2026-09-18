import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const addSlot = mutation({
  args: {
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    teacherId: v.id("teachers"),
    day: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    subject: v.string(),
  },
  async handler(ctx, args) {
    if (args.endTime <= args.startTime) {
      throw new Error("End time must be after start time");
    }

    const slots = await ctx.db
      .query("timetable")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const sameDay = slots.filter((s) => s.day === args.day);

    const teacherClash = sameDay.find(
      (s) =>
        s.teacherId === args.teacherId &&
        args.startTime < s.endTime &&
        s.startTime < args.endTime
    );

    if (teacherClash) {
      const teacher = await ctx.db.get(args.teacherId);
      throw new Error(
        `${teacher?.name ?? "That teacher"} already teaches ${teacherClash.startTime}–${teacherClash.endTime} on ${args.day}`
      );
    }

    const batchClash = sameDay.find(
      (s) =>
        s.batchId === args.batchId &&
        args.startTime < s.endTime &&
        s.startTime < args.endTime
    );

    if (batchClash) {
      throw new Error(
        `This batch already has a class ${batchClash.startTime}–${batchClash.endTime} on ${args.day}`
      );
    }

    const slotId = await ctx.db.insert("timetable", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { slotId };
  },
});

export const getTimetable = query({
  args: {
    academyId: v.id("academies"),
    batchId: v.optional(v.id("batches")),
  },
  async handler(ctx, args) {
    const slots = await ctx.db
      .query("timetable")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const rows = args.batchId
      ? slots.filter((s) => s.batchId === args.batchId)
      : slots;

    rows.sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
      return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
    });

    return Promise.all(
      rows.map(async (s) => {
        const batch = await ctx.db.get(s.batchId);
        const teacher = await ctx.db.get(s.teacherId);

        return {
          slotId: s._id,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          subject: s.subject,
          batchName: batch?.name ?? "—",
          teacherName: teacher?.name ?? "—",
        };
      })
    );
  },
});

export const deleteSlot = mutation({
  args: { slotId: v.id("timetable") },
  async handler(ctx, args) {
    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.deletedAt !== undefined) {
      throw new Error("Timetable slot not found");
    }

    await ctx.db.patch(args.slotId, { deletedAt: Date.now() });
    return { slotId: args.slotId };
  },
});
