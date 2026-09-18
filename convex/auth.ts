import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_EMAIL = "admin@gmail.com";

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const email = args.email.trim().toLowerCase();

    if (email === ADMIN_EMAIL) {
      throw new Error("This email is reserved");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      throw new Error("An account with this email already exists");
    }

    const userId = await ctx.db.insert("users", {
      email,
      password: args.password,
      name: args.name,
      phone: args.phone,
      status: "active",
      role: "academy_owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { userId, email, name: args.name, role: "academy_owner" as const };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  async handler(ctx, args) {
    const email = args.email.trim().toLowerCase();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user || user.password !== args.password) {
      throw new Error("Incorrect email or password");
    }

    if (user.status !== "active") {
      throw new Error("This account is inactive");
    }

    if (user.role === "admin") {
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: "admin" as const,
        academyCount: 0,
        soleAcademyId: null,
      };
    }

    const academies = await ctx.db
      .query("academies")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .collect();

    const active = academies.filter((a) => a.deletedAt === undefined);

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: "academy_owner" as const,
      academyCount: active.length,
      soleAcademyId: active.length === 1 ? active[0]._id : null,
    };
  },
});

export const getCurrentUser = query({
  args: { userId: v.id("users") },
  async handler(ctx, args) {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
  },
});

export const seedAdmin = mutation({
  args: {},
  async handler(ctx) {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", ADMIN_EMAIL))
      .first();

    if (existing) {
      return { created: false, userId: existing._id };
    }

    const userId = await ctx.db.insert("users", {
      email: ADMIN_EMAIL,
      password: "devscot-2026",
      name: "Administrator",
      status: "active",
      role: "admin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { created: true, userId };
  },
});
