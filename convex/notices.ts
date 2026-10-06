import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, fail, ownedDoc, requireOwner } from "./lib/access";

export const list = query({
  args: { academyId: v.id("academies") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const rows = await ctx.db
      .query("notices")
      .withIndex("by_academyId", (q) => q.eq("academyId", args.academyId))
      .order("desc")
      .take(50);
    return Promise.all(
      rows.map(async (n) => {
        const batch = n.batchId ? await ctx.db.get("batches", n.batchId) : null;
        return {
          _id: n._id,
          title: n.title,
          body: n.body,
          batchId: n.batchId ?? null,
          batchName: batch?.name ?? null,
          createdAt: n._creationTime,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    academyId: v.id("academies"),
    batchId: v.optional(v.id("batches")),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    if (args.batchId) await ownedDoc(ctx, "batches", args.batchId, args.academyId);
    const title = args.title.trim();
    const body = args.body.trim();
    if (title.length < 2 || title.length > 100) fail("INVALID", "Title must be 2 to 100 characters.");
    if (body.length < 2 || body.length > 2000) fail("INVALID", "Message must be 2 to 2000 characters.");
    const id = await ctx.db.insert("notices", {
      academyId: args.academyId,
      batchId: args.batchId,
      title,
      body,
      authorId: userId,
    });
    await audit(ctx, args.academyId, userId, "notice.created", title);
    return id;
  },
});

export const remove = mutation({
  args: { academyId: v.id("academies"), noticeId: v.id("notices") },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const n = await ownedDoc(ctx, "notices", args.noticeId, args.academyId);
    await ctx.db.delete("notices", n._id);
    await audit(ctx, args.academyId, userId, "notice.deleted", n.title);
  },
});
