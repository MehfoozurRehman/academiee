import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { audit, fail, isPlatformAdmin, requireOwner, requireUserId } from "./lib/access";

/** Everything the app needs to route a signed-in person. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get("users", userId);
    if (!user) return null;

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50);

    const owned = await ctx.db
      .query("academies")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
      .take(50);

    const studentMembership = memberships.find((m) => m.role === "student");
    let student = null;
    if (studentMembership?.studentId) {
      const s = await ctx.db.get("students", studentMembership.studentId);
      const a = s ? await ctx.db.get("academies", s.academyId) : null;
      if (s && a) {
        student = {
          name: s.name,
          code: s.code,
          active: s.status === "active",
          academyName: a.name,
          suspended: a.suspendedAt !== undefined,
        };
      }
    }

    return {
      userId,
      name: user.name ?? null,
      email: user.email ?? null,
      isAdmin: await isPlatformAdmin(ctx, userId),
      academies: owned.map((a) => ({
        _id: a._id,
        name: a.name,
        code: a.code,
        city: a.city ?? null,
        suspended: a.suspendedAt !== undefined,
      })),
      student,
    };
  },
});

function codeFromName(name: string) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return (letters.slice(0, 6) || "ACAD").padEnd(4, "X");
}

export const create = mutation({
  args: {
    name: v.string(),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const student = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), "student"))
      .first();
    if (student) fail("FORBIDDEN", "Student accounts can't create academies.");

    const name = args.name.trim();
    if (name.length < 2 || name.length > 80) fail("INVALID", "Enter the academy's name.");

    const owned = await ctx.db
      .query("academies")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
      .take(21);
    if (owned.length >= 20) fail("LIMIT", "You can run up to 20 academies.");

    // Short, readable, unique code: BRIGHT, BRIGHT2, BRIGHT3…
    const base = codeFromName(name);
    let code = base;
    for (let n = 2; ; n++) {
      const taken = await ctx.db
        .query("academies")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!taken) break;
      code = `${base}${n}`;
    }

    const academyId = await ctx.db.insert("academies", {
      name,
      code,
      ownerId: userId,
      city: args.city?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      whatsapp: args.whatsapp?.trim() || undefined,
      address: args.address?.trim() || undefined,
      feeDueDay: 10,
      studentSeq: 0,
      receiptSeq: 0,
    });
    await ctx.db.insert("memberships", { userId, academyId, role: "owner" });
    await audit(ctx, academyId, userId, "academy.created", name);
    return { academyId, code };
  },
});

export const get = query({
  args: { academyId: v.id("academies") },
  handler: async (ctx, args) => {
    const { academy } = await requireOwner(ctx, args.academyId);
    return academy;
  },
});

export const update = mutation({
  args: {
    academyId: v.id("academies"),
    name: v.string(),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    address: v.optional(v.string()),
    feeDueDay: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const name = args.name.trim();
    if (name.length < 2 || name.length > 80) fail("INVALID", "Enter the academy's name.");
    if (!Number.isInteger(args.feeDueDay) || args.feeDueDay < 1 || args.feeDueDay > 28) {
      fail("INVALID", "Fee due day must be between 1 and 28.");
    }
    await ctx.db.patch("academies", args.academyId, {
      name,
      city: args.city?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      whatsapp: args.whatsapp?.trim() || undefined,
      address: args.address?.trim() || undefined,
      feeDueDay: args.feeDueDay,
    });
    await audit(ctx, args.academyId, userId, "academy.updated", name);
  },
});

/** Owner's display name (shown on receipts and greetings). */
export const setMyName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim();
    if (name.length < 2 || name.length > 60) fail("INVALID", "Enter your name.");
    await ctx.db.patch("users", userId, { name });
  },
});

export const auditLog = query({
  args: { academyId: v.id("academies") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const rows = await ctx.db
      .query("auditLog")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .order("desc")
      .take(100);
    return Promise.all(
      rows.map(async (r) => {
        const user = await ctx.db.get("users", r.userId);
        return { ...r, userName: user?.name ?? user?.email ?? "—" };
      })
    );
  },
});
