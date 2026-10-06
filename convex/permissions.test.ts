// @vitest-environment edge-runtime
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = (import.meta as unknown as { glob: (p: string) => Record<string, () => Promise<unknown>> }).glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const mk = async (email: string) => ctx.db.insert("users", { email });
    const ownerA = await mk("a@test.dev");
    const ownerB = await mk("b@test.dev");
    const studentUser = await mk("s@test.dev");
    const adminUser = await mk("admin@test.dev");
    await ctx.db.insert("platformAdmins", { userId: adminUser });

    const mkAcademy = async (ownerId: Id<"users">, code: string) => {
      const academyId = await ctx.db.insert("academies", {
        name: `Academy ${code}`, code, ownerId, feeDueDay: 10, studentSeq: 0, receiptSeq: 0,
      });
      const courseId = await ctx.db.insert("courses", { academyId, name: "Math", monthlyFee: 3000 });
      const batchId = await ctx.db.insert("batches", {
        academyId, courseId, name: "Batch 1", teacherName: "Sir Ahmed",
        days: [1, 3], startTime: "16:00", endTime: "17:00", capacity: 20, enrolled: 1,
      });
      const studentId = await ctx.db.insert("students", {
        academyId, batchId, code: "S-0001", name: "Ali", fatherName: "Khan", gender: "male",
        parentPhone: "0300-1234567", monthlyFee: 3000, admissionDate: "2026-01-01",
        status: "active", searchText: "ali khan",
      });
      return { academyId, batchId, studentId };
    };
    const A = await mkAcademy(ownerA, "AAA");
    const B = await mkAcademy(ownerB, "BBB");
    await ctx.db.insert("memberships", { userId: studentUser, academyId: A.academyId, role: "student", studentId: A.studentId });
    return { ownerA, ownerB, studentUser, adminUser, A, B };
  });
  const as = (userId: Id<"users">) => t.withIdentity({ subject: `${userId}|session` });
  return { t, ids, as };
}

const month = "2026-10";
const pagination = { numItems: 10, cursor: null };

describe("owner isolation", () => {
  test("owner A cannot touch owner B's academy", async () => {
    const { ids, as } = await setup();
    const a = as(ids.ownerA);
    await expect(
      a.query(api.students.list, { academyId: ids.B.academyId, status: "active", paginationOpts: pagination })
    ).rejects.toThrow();
    await expect(
      a.mutation(api.attendance.save, {
        academyId: ids.B.academyId, batchId: ids.B.batchId, date: "2026-10-05",
        entries: [{ studentId: ids.B.studentId, status: "present" }],
      })
    ).rejects.toThrow();
    // B's invoice, A's academyId -> not found; B's academyId -> forbidden
    const inv = await as(ids.ownerB).mutation(api.fees.createInvoice, {
      academyId: ids.B.academyId, studentId: ids.B.studentId, month, amount: 3000, discount: 0,
    });
    await expect(
      a.mutation(api.fees.recordPayment, { academyId: ids.B.academyId, invoiceId: inv, amount: 100, method: "cash", date: "2026-10-05" })
    ).rejects.toThrow();
    await expect(
      a.mutation(api.fees.recordPayment, { academyId: ids.A.academyId, invoiceId: inv, amount: 100, method: "cash", date: "2026-10-05" })
    ).rejects.toThrow();
  });

  test("signed-out callers are rejected", async () => {
    const { t, ids } = await setup();
    await expect(t.query(api.dashboard.summary, { academyId: ids.A.academyId, month, today: "2026-10-07" })).rejects.toThrow();
  });
});

describe("student portal", () => {
  test("student reads their own home and cannot call owner functions", async () => {
    const { ids, as } = await setup();
    const s = as(ids.studentUser);
    const home = await s.query(api.portal.home, { today: "2026-10-07" });
    expect(home.student.name).toBe("Ali");
    expect(home.academy.name).toBe("Academy AAA");
    await expect(
      s.query(api.students.list, { academyId: ids.A.academyId, status: "active", paginationOpts: pagination })
    ).rejects.toThrow();
    await expect(s.query(api.dashboard.summary, { academyId: ids.A.academyId, month, today: "2026-10-07" })).rejects.toThrow();
  });

  test("an owner is not a student", async () => {
    const { ids, as } = await setup();
    await expect(as(ids.ownerA).query(api.portal.home, { today: "2026-10-07" })).rejects.toThrow();
  });
});

describe("fees", () => {
  test("payment over balance is rejected", async () => {
    const { ids, as } = await setup();
    const a = as(ids.ownerA);
    const inv = await a.mutation(api.fees.createInvoice, {
      academyId: ids.A.academyId, studentId: ids.A.studentId, month, amount: 3000, discount: 0,
    });
    await expect(
      a.mutation(api.fees.recordPayment, { academyId: ids.A.academyId, invoiceId: inv, amount: 3001, method: "cash", date: "2026-10-05" })
    ).rejects.toThrow();
  });

  test("voidInvoice needs payments voided first", async () => {
    const { ids, as } = await setup();
    const a = as(ids.ownerA);
    const academyId = ids.A.academyId;
    const inv = await a.mutation(api.fees.createInvoice, { academyId, studentId: ids.A.studentId, month, amount: 3000, discount: 0 });
    const { paymentId } = await a.mutation(api.fees.recordPayment, { academyId, invoiceId: inv, amount: 1000, method: "cash", date: "2026-10-05" });
    await expect(a.mutation(api.fees.voidInvoice, { academyId, invoiceId: inv, reason: "mistake" })).rejects.toThrow();
    await a.mutation(api.fees.voidPayment, { academyId, paymentId, reason: "wrong amount" });
    await a.mutation(api.fees.voidInvoice, { academyId, invoiceId: inv, reason: "mistake" });
    const detail = await a.query(api.fees.getInvoice, { academyId, invoiceId: inv, today: "2026-10-07" });
    expect(detail.invoice.status).toBe("voided");
  });

  test("generateMonth twice creates no duplicates", async () => {
    const { ids, as } = await setup();
    const a = as(ids.ownerA);
    const first = await a.mutation(api.fees.generateMonth, { academyId: ids.A.academyId, month });
    const second = await a.mutation(api.fees.generateMonth, { academyId: ids.A.academyId, month });
    expect(first.created).toBe(1);
    expect(second.created).toBe(0);
    const list = await a.query(api.fees.listMonth, { academyId: ids.A.academyId, month, today: "2026-10-07" });
    expect(list.rows).toHaveLength(1);
  });
});

describe("attendance", () => {
  test("saving twice upserts rather than duplicating", async () => {
    const { ids, as } = await setup();
    const a = as(ids.ownerA);
    const base = { academyId: ids.A.academyId, batchId: ids.A.batchId, date: "2026-10-05" };
    await a.mutation(api.attendance.save, { ...base, entries: [{ studentId: ids.A.studentId, status: "present" }] });
    await a.mutation(api.attendance.save, { ...base, entries: [{ studentId: ids.A.studentId, status: "absent" }] });
    const day = await a.query(api.attendance.forBatchDay, base);
    expect(day.students).toHaveLength(1);
    expect(day.students[0].status).toBe("absent");
    expect(day.isClassDay).toBe(true); // 2026-10-05 is a Monday
  });
});

describe("admin", () => {
  test("non-admin cannot call admin.overview, admin can", async () => {
    const { ids, as } = await setup();
    await expect(as(ids.ownerA).query(api.admin.overview, {})).rejects.toThrow();
    const o = await as(ids.adminUser).query(api.admin.overview, {});
    expect(o.academies).toBe(2);
  });
});
