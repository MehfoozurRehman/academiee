import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addField = mutation({
  args: {
    academyId: v.id("academies"),
    label: v.string(),
    key: v.string(),
  },
  async handler(ctx, args) {
    const key = args.key.trim().toLowerCase().replace(/\s+/g, "_");

    const existing = await ctx.db
      .query("customFields")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    if (existing.some((f) => f.key === key)) {
      throw new Error(`A field with the key "${key}" already exists`);
    }

    const fieldId = await ctx.db.insert("customFields", {
      academyId: args.academyId,
      label: args.label,
      key,
      createdAt: Date.now(),
    });

    return { fieldId, key };
  },
});

export const listFields = query({
  args: { academyId: v.id("academies") },
  async handler(ctx, args) {
    const fields = await ctx.db
      .query("customFields")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .collect();

    return fields.map((f) => ({
      fieldId: f._id,
      label: f.label,
      key: f.key,
    }));
  },
});

export const removeField = mutation({
  args: { fieldId: v.id("customFields") },
  async handler(ctx, args) {
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }

    await ctx.db.delete(args.fieldId);
    return { fieldId: args.fieldId };
  },
});
