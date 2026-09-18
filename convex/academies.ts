import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createAcademy = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    postalCode: v.optional(v.string()),
    currency: v.string(),
    whatsappNumber: v.string(),
  },
  async handler(ctx, args) {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const academyId = await ctx.db.insert("academies", {
      userId: args.userId,
      name: args.name,
      phone: args.phone,
      email: args.email,
      address: args.address,
      city: args.city,
      country: args.country,
      postalCode: args.postalCode,
      currency: args.currency,
      whatsappNumber: args.whatsappNumber,
      logo: undefined,
      website: undefined,
      status: "active",
      subscriptionPlan: "free",
      timestamps: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });

    return {
      academyId,
      name: args.name,
      city: args.city,
      status: "active",
    };
  },
});

export const getAcademy = query({
  args: {
    userId: v.id("users"),
  },
  async handler(ctx, args) {
    const academy = await ctx.db
      .query("academies")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!academy) {
      return null;
    }

    return {
      academyId: academy._id,
      name: academy.name,
      phone: academy.phone,
      email: academy.email,
      address: academy.address,
      city: academy.city,
      country: academy.country,
      currency: academy.currency,
      whatsappNumber: academy.whatsappNumber,
      status: academy.status,
      subscriptionPlan: academy.subscriptionPlan,
      createdAt: academy.timestamps.createdAt,
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
    whatsappNumber: v.optional(v.string()),
    currency: v.optional(v.string()),
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const academy = await ctx.db.get(args.academyId);
    if (!academy) {
      throw new Error("Academy not found");
    }

    const updates: Record<string, any> = {
      timestamps: {
        ...academy.timestamps,
        updatedAt: Date.now(),
      },
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.email !== undefined) updates.email = args.email;
    if (args.address !== undefined) updates.address = args.address;
    if (args.city !== undefined) updates.city = args.city;
    if (args.country !== undefined) updates.country = args.country;
    if (args.whatsappNumber !== undefined) updates.whatsappNumber = args.whatsappNumber;
    if (args.currency !== undefined) updates.currency = args.currency;
    if (args.logo !== undefined) updates.logo = args.logo;
    if (args.website !== undefined) updates.website = args.website;

    await ctx.db.patch(args.academyId, updates);

    return {
      academyId: args.academyId,
      message: "Academy updated successfully",
    };
  },
});

export const getAcademyStats = query({
  args: {
    academyId: v.id("academies"),
  },
  async handler(ctx, args) {
    const students = await ctx.db
      .query("students")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    const activeStudents = students.filter((s) => s.status === "active").length;

    const currentMonth = new Date().toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    const fees = await ctx.db
      .query("fees")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    const currentMonthFees = fees.filter((f) => f.month === currentMonth);
    const totalCollected = currentMonthFees
      .filter((f) => f.status === "paid")
      .reduce((sum, f) => sum + f.paymentPaid, 0);

    const outstandingFees = currentMonthFees
      .filter((f) => f.status !== "paid")
      .reduce((sum, f) => sum + f.balance, 0);

    const overdueCount = currentMonthFees.filter(
      (f) => f.status === "overdue"
    ).length;

    const batches = await ctx.db
      .query("batches")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    const activeTeachers = teachers.filter((t) => t.status === "active").length;

    return {
      totalStudents: students.length,
      activeStudents,
      totalBatches: batches.length,
      totalTeachers: teachers.length,
      activeTeachers,
      totalCollected,
      outstandingFees,
      overdueCount,
    };
  },
});
