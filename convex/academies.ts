import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createAcademy = mutation({
  args: {
    ownerId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    currency: v.string(),
    whatsappNumber: v.string(),
  },
  async handler(ctx, args) {
    const owner = await ctx.db.get(args.ownerId);
    if (!owner) {
      throw new Error("User not found");
    }
    if (owner.role === "admin") {
      throw new Error("Admins cannot create academies");
    }

    const academyId = await ctx.db.insert("academies", {
      ownerId: args.ownerId,
      name: args.name,
      phone: args.phone,
      email: args.email,
      address: args.address,
      city: args.city,
      country: args.country,
      currency: args.currency,
      whatsappNumber: args.whatsappNumber,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { academyId, name: args.name };
  },
});

export const getMyAcademies = query({
  args: { ownerId: v.id("users") },
  async handler(ctx, args) {
    const academies = await ctx.db
      .query("academies")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    const active = academies.filter((a) => a.deletedAt === undefined);

    return Promise.all(
      active.map(async (a) => {
        const students = await ctx.db
          .query("students")
          .withIndex("by_academy_deleted", (q) =>
            q.eq("academyId", a._id).eq("deletedAt", undefined)
          )
          .collect();

        return {
          academyId: a._id,
          name: a.name,
          city: a.city,
          logo: a.logo,
          currency: a.currency,
          status: a.status,
          studentCount: students.length,
        };
      })
    );
  },
});

export const getAcademy = query({
  args: { academyId: v.id("academies") },
  async handler(ctx, args) {
    const academy = await ctx.db.get(args.academyId);
    if (!academy || academy.deletedAt !== undefined) {
      return null;
    }

    return {
      academyId: academy._id,
      ownerId: academy.ownerId,
      name: academy.name,
      phone: academy.phone,
      email: academy.email,
      address: academy.address,
      city: academy.city,
      country: academy.country,
      currency: academy.currency,
      whatsappNumber: academy.whatsappNumber,
      logo: academy.logo,
      status: academy.status,
    };
  },
});

export const updateAcademy = mutation({
  args: {
    academyId: v.id("academies"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    logo: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const { academyId, ...fields } = args;

    const academy = await ctx.db.get(academyId);
    if (!academy) {
      throw new Error("Academy not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(academyId, updates);
    return { academyId };
  },
});

export const listAllForAdmin = query({
  args: { adminId: v.id("users") },
  async handler(ctx, args) {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Not authorised");
    }

    const academies = await ctx.db.query("academies").collect();
    const active = academies.filter((a) => a.deletedAt === undefined);

    return Promise.all(
      active.map(async (a) => {
        const owner = await ctx.db.get(a.ownerId);

        const students = await ctx.db
          .query("students")
          .withIndex("by_academy_deleted", (q) =>
            q.eq("academyId", a._id).eq("deletedAt", undefined)
          )
          .collect();

        const teachers = await ctx.db
          .query("teachers")
          .withIndex("by_academy_deleted", (q) =>
            q.eq("academyId", a._id).eq("deletedAt", undefined)
          )
          .collect();

        return {
          academyId: a._id,
          name: a.name,
          city: a.city,
          status: a.status,
          ownerName: owner?.name ?? "Unknown",
          ownerEmail: owner?.email ?? "",
          studentCount: students.length,
          teacherCount: teachers.length,
          createdAt: a.createdAt,
        };
      })
    );
  },
});

export const getDashboard = query({
  args: {
    academyId: v.id("academies"),
    month: v.string(),
  },
  async handler(ctx, args) {
    const students = await ctx.db
      .query("students")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const allFees = await ctx.db
      .query("fees")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const monthFees = allFees.filter((f) => f.month === args.month);

    const collected = monthFees.reduce((sum, f) => sum + f.amountPaid, 0);
    const outstanding = monthFees.reduce((sum, f) => sum + f.balance, 0);

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const monthExpenses = expenses
      .filter((e) => e.date.startsWith(args.month))
      .reduce((sum, e) => sum + e.amount, 0);

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    const monthAttendance = attendance.filter((a) => a.date.startsWith(args.month));
    const presentCount = monthAttendance.filter((a) => a.status === "present").length;

    return {
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.status === "active").length,
      totalTeachers: teachers.length,
      activeBatches: batches.filter((b) => b.status === "active").length,
      collected,
      outstanding,
      expenses: monthExpenses,
      net: collected - monthExpenses,
      attendanceRate:
        monthAttendance.length > 0
          ? Math.round((presentCount / monthAttendance.length) * 100)
          : 0,
      feesPaid: monthFees.filter((f) => f.status === "paid").length,
      feesPartial: monthFees.filter((f) => f.status === "partial").length,
      feesDue: monthFees.filter((f) => f.status === "due").length,
      feesOverdue: monthFees.filter((f) => f.status === "overdue").length,
    };
  },
});
