import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { paymentMethod } from "./schema";
import { audit, fail, findOwned, ownedDoc, requireOwner, requireUserId } from "./lib/access";
import { checkPayment, feeBalance, feeStatus } from "../src/lib/logic/fees";

// Money rules: invoices and payments are never deleted, only voided with a
// reason. An invoice's `paid` always equals the sum of its non-voided
// payments, and is only changed in this file.

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_STUDENTS_PER_RUN = 2000;

function reasonOf(text: string) {
  const reason = text.trim();
  if (reason.length < 3 || reason.length > 200) fail("INVALID", "Give a short reason (at least 3 characters).");
  return reason;
}

function dueDateFor(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function shape(i: Doc<"invoices">, today: string) {
  const voided = i.voidedAt !== undefined;
  return {
    _id: i._id,
    studentId: i.studentId,
    month: i.month,
    amount: i.amount,
    discount: i.discount,
    paid: i.paid,
    dueDate: i.dueDate,
    balance: voided ? 0 : feeBalance(i),
    status: feeStatus({ ...i, voided }, today),
    voidReason: i.voidReason ?? null,
  };
}

/** Bills every active student for the month who doesn't have an invoice yet. */
export const generateMonth = mutation({
  args: { academyId: v.id("academies"), month: v.string() },
  handler: async (ctx, args) => {
    const { userId, academy } = await requireOwner(ctx, args.academyId);
    if (!MONTH_RE.test(args.month)) fail("INVALID", "Pick a month.");

    const students = await ctx.db
      .query("students")
      .withIndex("by_academyId_and_status", (q) =>
        q.eq("academyId", args.academyId).eq("status", "active")
      )
      .take(MAX_STUDENTS_PER_RUN);

    const dueDate = dueDateFor(args.month, academy.feeDueDay);
    let created = 0;
    for (const s of students) {
      const existing = await ctx.db
        .query("invoices")
        .withIndex("by_studentId_and_month", (q) => q.eq("studentId", s._id).eq("month", args.month))
        .filter((q) => q.eq(q.field("voidedAt"), undefined))
        .first();
      if (existing || s.monthlyFee <= 0) continue;
      await ctx.db.insert("invoices", {
        academyId: args.academyId,
        studentId: s._id,
        month: args.month,
        amount: s.monthlyFee,
        discount: 0,
        paid: 0,
        dueDate,
      });
      created++;
    }
    if (created > 0) {
      await audit(ctx, args.academyId, userId, "fees.generated", `${args.month}: ${created} invoices`);
    }
    return { created, alreadyBilled: students.length - created };
  },
});

/** One invoice for one student (e.g. a mid-month admission). */
export const createInvoice = mutation({
  args: {
    academyId: v.id("academies"),
    studentId: v.id("students"),
    month: v.string(),
    amount: v.number(),
    discount: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, academy } = await requireOwner(ctx, args.academyId);
    const student = await ownedDoc(ctx, "students", args.studentId, args.academyId);
    if (!MONTH_RE.test(args.month)) fail("INVALID", "Pick a month.");
    if (!Number.isInteger(args.amount) || args.amount <= 0) fail("INVALID", "Amount must be a whole number above zero.");
    if (!Number.isInteger(args.discount) || args.discount < 0 || args.discount > args.amount) {
      fail("INVALID", "Discount can't be more than the amount.");
    }
    const existing = await ctx.db
      .query("invoices")
      .withIndex("by_studentId_and_month", (q) => q.eq("studentId", student._id).eq("month", args.month))
      .filter((q) => q.eq(q.field("voidedAt"), undefined))
      .first();
    if (existing) fail("DUPLICATE", "This student already has an invoice for that month.");

    const id = await ctx.db.insert("invoices", {
      academyId: args.academyId,
      studentId: student._id,
      month: args.month,
      amount: args.amount,
      discount: args.discount,
      paid: 0,
      dueDate: dueDateFor(args.month, academy.feeDueDay),
    });
    await audit(ctx, args.academyId, userId, "invoice.created", `${student.name} ${args.month}: Rs ${args.amount}`);
    return id;
  },
});

/** Change the discount on an invoice. Can't go below what's already been paid. */
export const setDiscount = mutation({
  args: { academyId: v.id("academies"), invoiceId: v.id("invoices"), discount: v.number(), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const inv = await ownedDoc(ctx, "invoices", args.invoiceId, args.academyId);
    if (inv.voidedAt !== undefined) fail("INVALID", "This invoice is voided.");
    const reason = reasonOf(args.reason);
    if (!Number.isInteger(args.discount) || args.discount < 0) fail("INVALID", "Discount must be a whole amount.");
    if (args.discount + inv.paid > inv.amount) fail("INVALID", "Discount plus payments can't be more than the fee.");
    await ctx.db.patch("invoices", inv._id, { discount: args.discount });
    await audit(ctx, args.academyId, userId, "invoice.discount", `Rs ${inv.discount} → Rs ${args.discount}: ${reason}`);
  },
});

/** Fee list for a month with totals. Status is computed against `today`. */
export const listMonth = query({
  args: { academyId: v.id("academies"), month: v.string(), today: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_academyId_and_month", (q) => q.eq("academyId", args.academyId).eq("month", args.month))
      .take(MAX_STUDENTS_PER_RUN * 2);

    const rows = await Promise.all(
      invoices.map(async (i) => {
        const s = await ctx.db.get("students", i.studentId);
        return { ...shape(i, args.today), studentName: s?.name ?? "—", studentCode: s?.code ?? "", parentPhone: s?.parentPhone ?? "" };
      })
    );

    const live = rows.filter((r) => r.status !== "voided");
    const expected = live.reduce((sum, r) => sum + r.amount - r.discount, 0);
    const collected = live.reduce((sum, r) => sum + r.paid, 0);
    const counts = { paid: 0, partial: 0, due: 0, overdue: 0, voided: 0 };
    for (const r of rows) counts[r.status]++;

    rows.sort((a, b) => {
      const order = { overdue: 0, partial: 1, due: 2, paid: 3, voided: 4 };
      return order[a.status] - order[b.status] || a.studentName.localeCompare(b.studentName);
    });
    return { rows, expected, collected, outstanding: expected - collected, counts };
  },
});

async function invoiceDetail(ctx: QueryCtx, inv: Doc<"invoices">, today: string) {
  const student = await ctx.db.get("students", inv.studentId);
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_invoiceId", (q) => q.eq("invoiceId", inv._id))
    .take(100);
  return {
    invoice: shape(inv, today),
    student: student ? { _id: student._id, name: student.name, code: student.code, parentPhone: student.parentPhone, fatherName: student.fatherName } : null,
    payments: payments
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((p) => ({
        _id: p._id,
        amount: p.amount,
        method: p.method,
        date: p.date,
        receiptNo: p.receiptNo,
        voided: p.voidedAt !== undefined,
        voidReason: p.voidReason ?? null,
      })),
  };
}

export const getInvoice = query({
  args: { academyId: v.id("academies"), invoiceId: v.id("invoices"), today: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const inv = await findOwned(ctx, "invoices", args.invoiceId, args.academyId);
    if (!inv) return null;
    return invoiceDetail(ctx, inv, args.today);
  },
});

export const recordPayment = mutation({
  args: {
    academyId: v.id("academies"),
    invoiceId: v.id("invoices"),
    amount: v.number(),
    method: paymentMethod,
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, academy } = await requireOwner(ctx, args.academyId);
    const inv = await ownedDoc(ctx, "invoices", args.invoiceId, args.academyId);
    if (!DATE_RE.test(args.date)) fail("INVALID", "Pick the payment date.");
    try {
      checkPayment({ ...inv, voided: inv.voidedAt !== undefined }, args.amount);
    } catch (e) {
      fail("INVALID", (e as Error).message);
    }

    const receiptNo = academy.receiptSeq + 1;
    await ctx.db.patch("academies", academy._id, { receiptSeq: receiptNo });
    await ctx.db.patch("invoices", inv._id, { paid: inv.paid + args.amount });
    const paymentId = await ctx.db.insert("payments", {
      academyId: args.academyId,
      invoiceId: inv._id,
      studentId: inv.studentId,
      amount: args.amount,
      method: args.method,
      date: args.date,
      receiptNo,
      recordedBy: userId,
    });
    const student = await ctx.db.get("students", inv.studentId);
    await audit(ctx, args.academyId, userId, "payment.recorded", `#${receiptNo} ${student?.name ?? ""} Rs ${args.amount} (${args.method})`);
    return { paymentId, receiptNo };
  },
});

export const voidPayment = mutation({
  args: { academyId: v.id("academies"), paymentId: v.id("payments"), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const p = await ownedDoc(ctx, "payments", args.paymentId, args.academyId);
    if (p.voidedAt !== undefined) fail("INVALID", "This payment is already voided.");
    const reason = reasonOf(args.reason);
    const inv = await ctx.db.get("invoices", p.invoiceId);
    if (!inv) fail("NOT_FOUND", "Invoice not found.");
    await ctx.db.patch("payments", p._id, { voidedAt: Date.now(), voidReason: reason });
    await ctx.db.patch("invoices", inv._id, { paid: Math.max(0, inv.paid - p.amount) });
    await audit(ctx, args.academyId, userId, "payment.voided", `#${p.receiptNo} Rs ${p.amount}: ${reason}`);
  },
});

export const voidInvoice = mutation({
  args: { academyId: v.id("academies"), invoiceId: v.id("invoices"), reason: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireOwner(ctx, args.academyId);
    const inv = await ownedDoc(ctx, "invoices", args.invoiceId, args.academyId);
    if (inv.voidedAt !== undefined) fail("INVALID", "This invoice is already voided.");
    const reason = reasonOf(args.reason);
    if (inv.paid > 0) fail("HAS_PAYMENTS", "Void this invoice's payments first.");
    await ctx.db.patch("invoices", inv._id, { voidedAt: Date.now(), voidReason: reason });
    const student = await ctx.db.get("students", inv.studentId);
    await audit(ctx, args.academyId, userId, "invoice.voided", `${student?.name ?? ""} ${inv.month}: ${reason}`);
  },
});

/** Unpaid invoices for a student, oldest first — used by "Record payment". */
export const openInvoicesForStudent = query({
  args: { academyId: v.id("academies"), studentId: v.id("students"), today: v.string() },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    await ownedDoc(ctx, "students", args.studentId, args.academyId);
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_studentId_and_month", (q) => q.eq("studentId", args.studentId))
      .take(60);
    return invoices
      .filter((i) => i.voidedAt === undefined && feeBalance(i) > 0)
      .map((i) => shape(i, args.today));
  },
});

export const recentPayments = query({
  args: { academyId: v.id("academies") },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.academyId);
    const rows = await ctx.db
      .query("payments")
      .withIndex("by_academyId_and_date", (q) => q.eq("academyId", args.academyId))
      .order("desc")
      .take(8);
    return Promise.all(
      rows.map(async (p) => {
        const s = await ctx.db.get("students", p.studentId);
        return { _id: p._id, amount: p.amount, method: p.method, date: p.date, receiptNo: p.receiptNo, voided: p.voidedAt !== undefined, studentName: s?.name ?? "—" };
      })
    );
  },
});

/**
 * A receipt can be opened by the academy's owner or by the student it belongs
 * to — nobody else.
 */
export const receipt = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const p = await ctx.db.get("payments", args.paymentId);
    if (!p) return null;
    const academy = await ctx.db.get("academies", p.academyId);
    if (!academy) return null;

    let allowed = academy.ownerId === userId;
    if (!allowed) {
      const m = await ctx.db
        .query("memberships")
        .withIndex("by_studentId", (q) => q.eq("studentId", p.studentId))
        .first();
      allowed = m?.userId === userId;
    }
    if (!allowed) return null;

    const inv = await ctx.db.get("invoices", p.invoiceId);
    const student = await ctx.db.get("students", p.studentId);
    return {
      receiptNo: p.receiptNo,
      date: p.date,
      amount: p.amount,
      method: p.method,
      voided: p.voidedAt !== undefined,
      voidReason: p.voidReason ?? null,
      month: inv?.month ?? "",
      balanceAfter: inv && inv.voidedAt === undefined ? feeBalance(inv) : 0,
      academy: { name: academy.name, city: academy.city ?? null, phone: academy.phone ?? null },
      student: { name: student?.name ?? "—", code: student?.code ?? "", fatherName: student?.fatherName ?? "" },
    };
  },
});

export type InvoiceId = Id<"invoices">;
