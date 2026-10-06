import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { studentStatus } from "./schema";
import { audit, fail, ownedDoc, requireOwner } from "./lib/access";
import { randomDigits, sha256 } from "./lib/crypto";
import { joinBatch, leaveBatch } from "./lib/enrolment";
import { feeBalance, feeStatus } from "../src/lib/logic/fees";

const STUDENT_CODE_TTL = 7 * 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_RE = /^[0-9+\-\s]{7,16}$/;

function searchText(s: { name: string; fatherName: string; phone?: string; parentPhone: string; code: string }) {
  return [s.name, s.fatherName, s.phone ?? "", s.parentPhone, s.code].join(" ").toLowerCase();
}

export const list = query({
  args: {
    academyId: v.id("academies"),
    status: studentStatus,
    batchId: v.optional(v.id("batches")),
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const term = args.search?.trim().toLowerCase();

    const page = term
      ? await ctx.db
          .query("students")
          .withSearchIndex("search_text", (q) =>
            q.search("searchText", term).eq("academyId", args.academyId).eq("status", args.status)
          )
          .paginate(args.paginationOpts)
      : args.batchId
        ? await ctx.db
            .query("students")
            .withIndex("by_batchId_and_status", (q) =>
              q.eq("batchId", args.batchId!).eq("status", args.status)
            )
            .paginate(args.paginationOpts)
        : await ctx.db
            .query("students")
            .withIndex("by_academyId_and_status", (q) =>
              q.eq("academyId", args.academyId).eq("status", args.status)
            )
            .order("desc")
            .paginate(args.paginationOpts);

    const batchNames = new Map<string, string>();
    const rows = await Promise.all(
      page.page
        .filter((s) => !args.batchId || s.batchId === args.batchId)
        .map(async (s) => {
          if (!batchNames.has(s.batchId)) {
            const b = await ctx.db.get("batches", s.batchId);
            batchNames.set(s.batchId, b?.name ?? "—");
          }
          return {
            _id: s._id,
            code: s.code,
            name: s.name,
            fatherName: s.fatherName,
            parentPhone: s.parentPhone,
            status: s.status,
            monthlyFee: s.monthlyFee,
            batchName: batchNames.get(s.batchId)!,
          };
        })
    );
    return { ...page, page: rows };
  },
});

/** Full profile: details, fee ledger, attendance and results. */
export const get = query({
  args: { academyId: v.id("academies"), studentId: v.id("students"), today: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const student = await ownedDoc(ctx, "students", args.studentId, args.academyId);
    const batch = await ctx.db.get("batches", student.batchId);
    const course = batch ? await ctx.db.get("courses", batch.courseId) : null;

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_studentId_and_month", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(36);

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_studentId_and_date", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(120);

    const results = await ctx.db
      .query("results")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(30);

    const hasSignIn = await ctx.db
      .query("memberships")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .first();

    const counted = attendance.length;
    const present = attendance.filter((a) => a.status !== "absent").length;

    return {
      student,
      batch: batch ? { _id: batch._id, name: batch.name, teacherName: batch.teacherName, days: batch.days, startTime: batch.startTime, endTime: batch.endTime } : null,
      courseName: course?.name ?? null,
      hasSignedIn: hasSignIn !== null,
      invoices: invoices.map((i) => ({
        _id: i._id,
        month: i.month,
        amount: i.amount,
        discount: i.discount,
        paid: i.paid,
        dueDate: i.dueDate,
        balance: i.voidedAt ? 0 : feeBalance(i),
        status: feeStatus({ ...i, voided: i.voidedAt !== undefined }, args.today),
      })),
      outstanding: invoices
        .filter((i) => i.voidedAt === undefined)
        .reduce((sum, i) => sum + feeBalance(i), 0),
      attendance: {
        rate: counted ? Math.round((present / counted) * 100) : null,
        recent: attendance.slice(0, 30).map((a) => ({ date: a.date, status: a.status })),
      },
      results: await Promise.all(
        results.map(async (r) => {
          const test = await ctx.db.get("tests", r.testId);
          return {
            testId: r.testId,
            title: test?.title ?? "—",
            date: test?.date ?? "",
            marks: r.marks,
            totalMarks: test?.totalMarks ?? 0,
          };
        })
      ),
    };
  },
});

const studentFields = {
  name: v.string(),
  fatherName: v.string(),
  gender: v.union(v.literal("male"), v.literal("female")),
  phone: v.optional(v.string()),
  parentPhone: v.string(),
  address: v.optional(v.string()),
  monthlyFee: v.number(),
  admissionDate: v.string(),
};

function clean(args: {
  name: string;
  fatherName: string;
  phone?: string;
  parentPhone: string;
  address?: string;
  monthlyFee: number;
  admissionDate: string;
}) {
  const name = args.name.trim();
  const fatherName = args.fatherName.trim();
  const phone = args.phone?.trim() || undefined;
  const parentPhone = args.parentPhone.trim();
  if (name.length < 2 || name.length > 80) fail("INVALID", "Enter the student's name.");
  if (fatherName.length < 2 || fatherName.length > 80) fail("INVALID", "Enter the father's name.");
  if (!PHONE_RE.test(parentPhone)) fail("INVALID", "Enter a valid parent phone number.");
  if (phone && !PHONE_RE.test(phone)) fail("INVALID", "Enter a valid student phone number.");
  if (!Number.isInteger(args.monthlyFee) || args.monthlyFee < 0 || args.monthlyFee > 10_000_000) {
    fail("INVALID", "Monthly fee must be a whole amount.");
  }
  if (!DATE_RE.test(args.admissionDate)) fail("INVALID", "Pick the admission date.");
  return { name, fatherName, phone, parentPhone, address: args.address?.trim() || undefined };
}

export const create = mutation({
  args: { academyId: v.id("academies"), batchId: v.id("batches"), ...studentFields },
  handler: async (ctx, args) => {
    const { userId, academy } = await requireOwner(ctx, args.academyId);
    await ownedDoc(ctx, "batches", args.batchId, args.academyId);
    const c = clean(args);
    await joinBatch(ctx, args.batchId);

    const seq = academy.studentSeq + 1;
    await ctx.db.patch("academies", academy._id, { studentSeq: seq });
    const code = `S-${String(seq).padStart(4, "0")}`;

    const studentId = await ctx.db.insert("students", {
      academyId: args.academyId,
      batchId: args.batchId,
      code,
      ...c,
      gender: args.gender,
      monthlyFee: args.monthlyFee,
      admissionDate: args.admissionDate,
      status: "active",
      searchText: searchText({ ...c, code }),
    });
    await audit(ctx, args.academyId, userId, "student.created", `${c.name} (${code})`);
    return { studentId, code };
  },
});

export const update = mutation({
  args: { academyId: v.id("academies"), studentId: v.id("students"), ...studentFields },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const student = await ownedDoc(ctx, "students", args.studentId, args.academyId);
    const c = clean(args);
    await ctx.db.patch("students", args.studentId, {
      ...c,
      gender: args.gender,
      monthlyFee: args.monthlyFee,
      admissionDate: args.admissionDate,
      searchText: searchText({ ...c, code: student.code }),
    });
    await audit(ctx, args.academyId, userId, "student.updated", `${c.name} (${student.code})`);
  },
});

export const moveBatch = mutation({
  args: { academyId: v.id("academies"), studentId: v.id("students"), batchId: v.id("batches") },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const student = await ownedDoc(ctx, "students", args.studentId, args.academyId);
    await ownedDoc(ctx, "batches", args.batchId, args.academyId);
    if (student.batchId === args.batchId) return;
    if (student.status === "active") {
      const target = await joinBatch(ctx, args.batchId);
      await leaveBatch(ctx, student.batchId);
      await audit(ctx, args.academyId, userId, "student.moved", `${student.name} → ${target.name}`);
    }
    await ctx.db.patch("students", args.studentId, { batchId: args.batchId });
  },
});

/** Archive (left / graduated) or restore to active. History is always kept. */
export const setStatus = mutation({
  args: { academyId: v.id("academies"), studentId: v.id("students"), status: studentStatus },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const student = await ownedDoc(ctx, "students", args.studentId, args.academyId);
    if (student.status === args.status) return;

    if (args.status === "active") await joinBatch(ctx, student.batchId);
    else if (student.status === "active") await leaveBatch(ctx, student.batchId);

    await ctx.db.patch("students", args.studentId, { status: args.status });
    await audit(ctx, args.academyId, userId, `student.${args.status}`, `${student.name} (${student.code})`);
  },
});

/** Permanent delete — only for a student added by mistake with no history. */
export const removeMistake = mutation({
  args: { academyId: v.id("academies"), studentId: v.id("students") },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const student = await ownedDoc(ctx, "students", args.studentId, args.academyId);

    const hasInvoice = await ctx.db
      .query("invoices")
      .withIndex("by_studentId_and_month", (q) => q.eq("studentId", student._id))
      .first();
    const hasAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_studentId_and_date", (q) => q.eq("studentId", student._id))
      .first();
    const hasResult = await ctx.db
      .query("results")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .first();
    if (hasInvoice || hasAttendance || hasResult) {
      fail("HAS_HISTORY", "This student has fee, attendance or result history. Archive them instead.");
    }

    if (student.status === "active") await leaveBatch(ctx, student.batchId);
    const codes = await ctx.db
      .query("studentCodes")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .take(10);
    for (const c of codes) await ctx.db.delete("studentCodes", c._id);
    const members = await ctx.db
      .query("memberships")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .take(10);
    for (const m of members) await ctx.db.delete("memberships", m._id);

    await ctx.db.delete("students", student._id);
    await audit(ctx, args.academyId, userId, "student.deleted", `${student.name} (${student.code}) — added by mistake`);
  },
});

/**
 * Creates a fresh one-time sign-in code for a student. The plain code is
 * returned once so the owner can send it on WhatsApp; only a hash is stored.
 */
export const issueSignInCode = mutation({
  args: { academyId: v.id("academies"), studentId: v.id("students") },
  handler: async (ctx, args) => {
    const { userId, academy } = await requireOwner(ctx, args.academyId);
    const student = await ownedDoc(ctx, "students", args.studentId, args.academyId);
    if (student.status !== "active") fail("INVALID", "Only active students can sign in.");

    const old = await ctx.db
      .query("studentCodes")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .take(10);
    for (const c of old) await ctx.db.delete("studentCodes", c._id);

    const code = randomDigits(6);
    await ctx.db.insert("studentCodes", {
      studentId: student._id,
      codeHash: await sha256(`${student._id}:${code}`),
      expiresAt: Date.now() + STUDENT_CODE_TTL,
      attempts: 0,
    });
    await audit(ctx, args.academyId, userId, "student.signInCode", `${student.name} (${student.code})`);
    return {
      code,
      academyCode: academy.code,
      studentCode: student.code,
      studentName: student.name,
      phone: student.phone ?? student.parentPhone,
    };
  },
});
