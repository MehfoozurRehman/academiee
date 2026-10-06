import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { fail } from "./access";

// The only code that changes a batch's `enrolled` count. Every add, move,
// archive and restore goes through here so the count can't drift.

export async function joinBatch(ctx: MutationCtx, batchId: Id<"batches">) {
  const batch = await ctx.db.get("batches", batchId);
  if (!batch || batch.archivedAt !== undefined) fail("INVALID", "That batch isn't available.");
  if (batch.enrolled >= batch.capacity) fail("FULL", `${batch.name} is full (${batch.capacity} students).`);
  await ctx.db.patch("batches", batchId, { enrolled: batch.enrolled + 1 });
  return batch;
}

export async function leaveBatch(ctx: MutationCtx, batchId: Id<"batches">) {
  const batch = await ctx.db.get("batches", batchId);
  if (!batch) return;
  await ctx.db.patch("batches", batchId, { enrolled: Math.max(0, batch.enrolled - 1) });
}
