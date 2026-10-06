import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { audit, fail, requireAdmin } from "./lib/access";

// Super-admin panel. Every function starts with requireAdmin.

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const academies = await ctx.db.query("academies").take(5000);
    const batches = await ctx.db.query("batches").take(5000);
    const suspended = academies.filter((a) => a.suspendedAt !== undefined).length;
    const owners = new Set(academies.map((a) => a.ownerId)).size;
    const students = batches.reduce((s, b) => s + b.enrolled, 0);
    const recent = await ctx.db.query("academies").order("desc").take(10);
    return {
      academies: academies.length,
      active: academies.length - suspended,
      suspended,
      students,
      owners,
      recent: await Promise.all(
        recent.map(async (a) => {
          const owner = await ctx.db.get("users", a.ownerId);
          return { _id: a._id, name: a.name, code: a.code, city: a.city ?? null, ownerEmail: owner?.email ?? null, created: a._creationTime };
        })
      ),
    };
  },
});

export const academies = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("academies").order("desc").take(500);
    const out = await Promise.all(
      rows.map(async (a) => {
        const owner = await ctx.db.get("users", a.ownerId);
        const batches = await ctx.db
          .query("batches")
          .withIndex("by_academyId_and_archivedAt", (q) => q.eq("academyId", a._id))
          .take(500);
        return {
          _id: a._id,
          name: a.name,
          code: a.code,
          city: a.city ?? null,
          ownerEmail: owner?.email ?? null,
          ownerName: owner?.name ?? null,
          created: a._creationTime,
          suspended: a.suspendedAt !== undefined,
          studentCount: batches.reduce((s, b) => s + b.enrolled, 0),
        };
      })
    );
    const term = args.search?.trim().toLowerCase();
    if (!term) return out;
    return out.filter((a) =>
      [a.name, a.code, a.ownerEmail ?? "", a.ownerName ?? ""].some((f) => f.toLowerCase().includes(term))
    );
  },
});

export const academyDetail = query({
  args: { academyId: v.id("academies") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const a = await ctx.db.get("academies", args.academyId);
    if (!a) fail("NOT_FOUND", "That academy wasn't found.");
    const owner = await ctx.db.get("users", a.ownerId);
    const students = await ctx.db
      .query("students")
      .withIndex("by_academyId_and_status", (q) => q.eq("academyId", a._id).eq("status", "active"))
      .take(5000);
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_academyId_and_archivedAt", (q) => q.eq("academyId", a._id).eq("archivedAt", undefined))
      .take(500);
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_academyId_and_archivedAt", (q) => q.eq("academyId", a._id).eq("archivedAt", undefined))
      .take(500);
    const log = await ctx.db
      .query("auditLog")
      .withIndex("by_academyId", (q) => q.eq("academyId", a._id))
      .order("desc")
      .take(20);
    return {
      academy: {
        _id: a._id,
        name: a.name,
        code: a.code,
        city: a.city ?? null,
        phone: a.phone ?? null,
        address: a.address ?? null,
        whatsapp: a.whatsapp ?? null,
        created: a._creationTime,
        suspendedAt: a.suspendedAt ?? null,
      },
      owner: owner ? { _id: owner._id, email: owner.email ?? null, name: owner.name ?? null } : null,
      counts: { students: students.length, batches: batches.length, courses: courses.length },
      audit: log.map((l) => ({ _id: l._id, action: l.action, detail: l.detail, at: l._creationTime })),
    };
  },
});

export const setSuspended = mutation({
  args: { academyId: v.id("academies"), suspended: v.boolean(), reason: v.string() },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const a = await ctx.db.get("academies", args.academyId);
    if (!a) fail("NOT_FOUND", "That academy wasn't found.");
    const reason = args.reason.trim();
    if (reason.length < 3 || reason.length > 200) fail("INVALID", "Give a short reason (at least 3 characters).");
    if (args.suspended === (a.suspendedAt !== undefined)) {
      fail("INVALID", args.suspended ? "This academy is already suspended." : "This academy isn't suspended.");
    }
    await ctx.db.patch("academies", a._id, { suspendedAt: args.suspended ? Date.now() : undefined });
    await audit(ctx, a._id, adminId, args.suspended ? "admin.suspended" : "admin.unsuspended", reason);
  },
});

export const users = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows: Doc<"users">[] = await ctx.db.query("users").order("desc").take(200);
    return Promise.all(
      rows.map(async (u) => {
        const admin = await ctx.db.query("platformAdmins").withIndex("by_userId", (q) => q.eq("userId", u._id)).first();
        const owned = await ctx.db.query("academies").withIndex("by_ownerId", (q) => q.eq("ownerId", u._id)).take(50);
        const student = await ctx.db
          .query("memberships")
          .withIndex("by_userId", (q) => q.eq("userId", u._id))
          .filter((q) => q.eq(q.field("role"), "student"))
          .first();
        return {
          _id: u._id,
          email: u.email ?? null,
          name: u.name ?? null,
          created: u._creationTime,
          isAdmin: admin !== null,
          academiesOwned: owned.length,
          isStudent: student !== null,
        };
      })
    );
  },
});
