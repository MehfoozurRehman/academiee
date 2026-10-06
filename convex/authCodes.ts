import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, mutation } from "./_generated/server";
import { fail } from "./lib/access";
import { randomDigits, safeEqual, sha256 } from "./lib/crypto";

const EMAIL_CODE_TTL = 10 * 60 * 1000;
const RESEND_WAIT = 30 * 1000;
const MAX_ATTEMPTS = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function adminEmails() {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Step 1 of owner sign-in: create a code and email it. On a deployment without
 * Resend where ALLOW_DEV_CODES=true (dev only), the code is returned so it can
 * be shown on screen for testing.
 */
export const requestEmailCode = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 200) fail("INVALID_EMAIL", "Enter a valid email address.");

    // The review account uses a fixed code from the environment; nothing is sent.
    if (process.env.REVIEW_EMAIL && email === process.env.REVIEW_EMAIL.toLowerCase()) {
      return { sent: true, devCode: null };
    }

    const existing = await ctx.db
      .query("loginCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing && existing._creationTime > Date.now() - RESEND_WAIT) {
      fail("TOO_SOON", "Please wait a few seconds before asking for another code.");
    }
    if (existing) await ctx.db.delete("loginCodes", existing._id);

    const code = randomDigits(6);
    await ctx.db.insert("loginCodes", {
      email,
      codeHash: await sha256(`${email}:${code}`),
      expiresAt: Date.now() + EMAIL_CODE_TTL,
      attempts: 0,
    });

    if (process.env.RESEND_API_KEY) {
      await ctx.scheduler.runAfter(0, internal.authCodes.sendEmailCode, { email, code });
      return { sent: true, devCode: null };
    }
    if (process.env.ALLOW_DEV_CODES === "true") {
      return { sent: false, devCode: code };
    }
    fail("EMAIL_NOT_SET_UP", "Email sign-in isn't available yet. Please try again later.");
  },
});

export const sendEmailCode = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (_ctx, args) => {
    const from = process.env.AUTH_EMAIL_FROM ?? "Academiee <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.email],
        subject: `${args.code} is your Academiee sign-in code`,
        text: `Your Academiee sign-in code is ${args.code}. It expires in 10 minutes. If you didn't ask for it, you can ignore this email.`,
      }),
    });
    if (!res.ok) console.error("Resend failed", res.status, await res.text());
  },
});

/** Returns false (never throws) so the attempt counter is saved. */
export const consumeEmailCode = internalMutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const reviewEmail = process.env.REVIEW_EMAIL?.toLowerCase();
    const reviewCode = process.env.REVIEW_CODE;
    if (reviewEmail && reviewCode && args.email === reviewEmail) {
      return safeEqual(args.code, reviewCode);
    }

    const row = await ctx.db
      .query("loginCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!row) return false;
    if (row.expiresAt < Date.now() || row.attempts >= MAX_ATTEMPTS) {
      await ctx.db.delete("loginCodes", row._id);
      return false;
    }
    const hash = await sha256(`${args.email}:${args.code}`);
    if (!safeEqual(hash, row.codeHash)) {
      await ctx.db.patch("loginCodes", row._id, { attempts: row.attempts + 1 });
      return false;
    }
    await ctx.db.delete("loginCodes", row._id);
    return true;
  },
});

export const afterOwnerSignIn = internalMutation({
  args: { userId: v.id("users"), email: v.string() },
  handler: async (ctx, args) => {
    if (!adminEmails().includes(args.email)) return;
    const existing = await ctx.db
      .query("platformAdmins")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!existing) await ctx.db.insert("platformAdmins", { userId: args.userId });
  },
});

export const consumeStudentCode = internalMutation({
  args: { academyCode: v.string(), studentCode: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const academy = await ctx.db
      .query("academies")
      .withIndex("by_code", (q) => q.eq("code", args.academyCode))
      .unique();
    if (!academy || academy.suspendedAt !== undefined) return null;

    const student = await ctx.db
      .query("students")
      .withIndex("by_academyId_and_code", (q) =>
        q.eq("academyId", academy._id).eq("code", args.studentCode)
      )
      .unique();
    if (!student || student.status !== "active") return null;

    const row = await ctx.db
      .query("studentCodes")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .unique();
    if (!row) return null;
    if (row.expiresAt < Date.now() || row.attempts >= MAX_ATTEMPTS) {
      await ctx.db.delete("studentCodes", row._id);
      return null;
    }
    const hash = await sha256(`${student._id}:${args.code}`);
    if (!safeEqual(hash, row.codeHash)) {
      await ctx.db.patch("studentCodes", row._id, { attempts: row.attempts + 1 });
      return null;
    }
    await ctx.db.delete("studentCodes", row._id);
    return { studentId: student._id, name: student.name };
  },
});

export const afterStudentSignIn = internalMutation({
  args: { userId: v.id("users"), studentId: v.id("students") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .first();
    if (existing) return;
    const student = await ctx.db.get("students", args.studentId);
    if (!student) return;
    await ctx.db.insert("memberships", {
      userId: args.userId,
      academyId: student.academyId,
      role: "student",
      studentId: args.studentId,
    });
  },
});
