import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password,
      name: args.name,
      phone: args.phone,
      status: "active",
      role: "academy_owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      userId,
      email: args.email,
      name: args.name,
    };
  },
});

export const login = query({
  args: {
    email: v.string(),
    password: v.string(),
  },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.password !== args.password) {
      throw new Error("Invalid password");
    }

    if (user.status !== "active") {
      throw new Error("User account is inactive");
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

export const getCurrentUser = query({
  args: {
    userId: v.id("users"),
  },
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
