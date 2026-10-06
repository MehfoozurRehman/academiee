import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

// Every public function starts with one of these. Identity always comes from
// the session on the server — never from an ID the client sends.

type Ctx = QueryCtx | MutationCtx;

export function fail(code: string, message?: string): never {
  throw new ConvexError({ code, message: message ?? code });
}

export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) fail("NOT_SIGNED_IN", "Please sign in again.");
  return userId;
}

export async function isPlatformAdmin(ctx: Ctx, userId: Id<"users">) {
  const row = await ctx.db
    .query("platformAdmins")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return row !== null;
}

export async function requireAdmin(ctx: Ctx) {
  const userId = await requireUserId(ctx);
  if (!(await isPlatformAdmin(ctx, userId))) fail("FORBIDDEN", "Admins only.");
  return userId;
}

/** The signed-in user must own this academy, and it must not be suspended. */
export async function requireOwner(
  ctx: Ctx,
  academyId: Id<"academies">
): Promise<{ userId: Id<"users">; academy: Doc<"academies"> }> {
  const userId = await requireUserId(ctx);
  const academy = await ctx.db.get("academies", academyId);
  if (!academy || academy.ownerId !== userId) fail("FORBIDDEN", "You don't have access to this academy.");
  if (academy.suspendedAt !== undefined) fail("SUSPENDED", "This academy has been suspended. Contact support.");
  return { userId, academy };
}

/** The signed-in user must be a student; returns their own record only. */
export async function requireStudent(ctx: Ctx): Promise<{
  userId: Id<"users">;
  student: Doc<"students">;
  academy: Doc<"academies">;
}> {
  const userId = await requireUserId(ctx);
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("role"), "student"))
    .first();
  if (!membership?.studentId) fail("FORBIDDEN", "Students only.");
  const student = await ctx.db.get("students", membership.studentId);
  if (!student || student.status !== "active") fail("FORBIDDEN", "Your student account is not active.");
  const academy = await ctx.db.get("academies", student.academyId);
  if (!academy || academy.suspendedAt !== undefined) fail("SUSPENDED", "This academy is not available right now.");
  return { userId, student, academy };
}

/** Load a record and check it belongs to the academy the caller owns. */
export async function ownedDoc<T extends "students" | "batches" | "courses" | "invoices" | "payments" | "tests" | "slots" | "notices" | "expenses">(
  ctx: Ctx,
  table: T,
  id: Id<T>,
  academyId: Id<"academies">
): Promise<Doc<T>> {
  const doc = (await ctx.db.get(table, id)) as (Doc<T> & { academyId: Id<"academies"> }) | null;
  if (!doc || doc.academyId !== academyId) fail("NOT_FOUND", "That record wasn't found.");
  return doc;
}

/** Like ownedDoc, but returns null (for detail pages showing "not found"). */
export async function findOwned<T extends "students" | "invoices" | "tests">(
  ctx: Ctx,
  table: T,
  id: Id<T>,
  academyId: Id<"academies">
): Promise<Doc<T> | null> {
  const doc = (await ctx.db.get(table, id)) as (Doc<T> & { academyId: Id<"academies"> }) | null;
  return doc && doc.academyId === academyId ? doc : null;
}

export async function audit(
  ctx: MutationCtx,
  academyId: Id<"academies">,
  userId: Id<"users">,
  action: string,
  detail: string
) {
  await ctx.db.insert("auditLog", { academyId, userId, action, detail });
}
