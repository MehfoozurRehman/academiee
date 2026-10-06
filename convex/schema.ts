import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Money is stored as whole rupees. Dates are "YYYY-MM-DD", months "YYYY-MM",
// times "HH:mm". Nothing financial is ever deleted: it is voided with a reason.

export const role = v.union(v.literal("owner"), v.literal("student"));
export const paymentMethod = v.union(
  v.literal("cash"),
  v.literal("bank"),
  v.literal("jazzcash"),
  v.literal("easypaisa")
);
export const attendanceStatus = v.union(
  v.literal("present"),
  v.literal("absent"),
  v.literal("late")
);
export const studentStatus = v.union(
  v.literal("active"),
  v.literal("left"),
  v.literal("graduated")
);

export default defineSchema({
  ...authTables,

  // Platform-wide settings: who is a super admin.
  platformAdmins: defineTable({
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),

  academies: defineTable({
    name: v.string(),
    /** Short public code students type to sign in, e.g. "BRIGHT". */
    code: v.string(),
    ownerId: v.id("users"),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    /** Day of month fees fall due when generating invoices. */
    feeDueDay: v.number(),
    /** Running counters so IDs and receipt numbers are never reused. */
    studentSeq: v.number(),
    receiptSeq: v.number(),
    suspendedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_ownerId", ["ownerId"]),

  memberships: defineTable({
    userId: v.id("users"),
    academyId: v.id("academies"),
    role,
    studentId: v.optional(v.id("students")),
  })
    .index("by_userId", ["userId"])
    .index("by_academyId_and_role", ["academyId", "role"])
    .index("by_studentId", ["studentId"]),

  /** Owner email sign-in codes (hashed). */
  loginCodes: defineTable({
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    attempts: v.number(),
  }).index("by_email", ["email"]),

  /** One-time sign-in codes an owner generates for a student (hashed). */
  studentCodes: defineTable({
    studentId: v.id("students"),
    codeHash: v.string(),
    expiresAt: v.number(),
    attempts: v.number(),
  }).index("by_studentId", ["studentId"]),

  courses: defineTable({
    academyId: v.id("academies"),
    name: v.string(),
    monthlyFee: v.number(),
    archivedAt: v.optional(v.number()),
  }).index("by_academyId_and_archivedAt", ["academyId", "archivedAt"]),

  batches: defineTable({
    academyId: v.id("academies"),
    courseId: v.id("courses"),
    name: v.string(),
    teacherName: v.string(),
    /** 0 = Sunday … 6 = Saturday */
    days: v.array(v.number()),
    startTime: v.string(),
    endTime: v.string(),
    capacity: v.number(),
    /** Active students in the batch; only changed through lib/enrolment.ts. */
    enrolled: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_academyId_and_archivedAt", ["academyId", "archivedAt"])
    .index("by_courseId_and_archivedAt", ["courseId", "archivedAt"]),

  students: defineTable({
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    /** Public student ID, e.g. "S-0012". */
    code: v.string(),
    name: v.string(),
    fatherName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    phone: v.optional(v.string()),
    parentPhone: v.string(),
    address: v.optional(v.string()),
    monthlyFee: v.number(),
    admissionDate: v.string(),
    status: studentStatus,
    /** name + father + phones, lower-cased, for search. */
    searchText: v.string(),
  })
    .index("by_academyId_and_status", ["academyId", "status"])
    .index("by_batchId_and_status", ["batchId", "status"])
    .index("by_academyId_and_code", ["academyId", "code"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["academyId", "status"],
    }),

  invoices: defineTable({
    academyId: v.id("academies"),
    studentId: v.id("students"),
    month: v.string(),
    amount: v.number(),
    discount: v.number(),
    /** Sum of non-voided payments; only changed through lib/money.ts. */
    paid: v.number(),
    dueDate: v.string(),
    voidedAt: v.optional(v.number()),
    voidReason: v.optional(v.string()),
  })
    .index("by_academyId_and_month", ["academyId", "month"])
    .index("by_studentId_and_month", ["studentId", "month"]),

  payments: defineTable({
    academyId: v.id("academies"),
    invoiceId: v.id("invoices"),
    studentId: v.id("students"),
    amount: v.number(),
    method: paymentMethod,
    date: v.string(),
    receiptNo: v.number(),
    recordedBy: v.id("users"),
    voidedAt: v.optional(v.number()),
    voidReason: v.optional(v.string()),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_academyId_and_date", ["academyId", "date"])
    .index("by_studentId_and_date", ["studentId", "date"]),

  attendance: defineTable({
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    studentId: v.id("students"),
    date: v.string(),
    status: attendanceStatus,
  })
    .index("by_batchId_and_date", ["batchId", "date"])
    .index("by_studentId_and_date", ["studentId", "date"])
    .index("by_academyId_and_date", ["academyId", "date"]),

  tests: defineTable({
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    title: v.string(),
    subject: v.optional(v.string()),
    date: v.string(),
    totalMarks: v.number(),
  })
    .index("by_academyId_and_date", ["academyId", "date"])
    .index("by_batchId_and_date", ["batchId", "date"]),

  results: defineTable({
    academyId: v.id("academies"),
    testId: v.id("tests"),
    studentId: v.id("students"),
    marks: v.number(),
  })
    .index("by_testId", ["testId"])
    .index("by_studentId", ["studentId"]),

  slots: defineTable({
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    day: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    subject: v.string(),
    teacherName: v.string(),
  })
    .index("by_academyId_and_day", ["academyId", "day"])
    .index("by_batchId_and_day", ["batchId", "day"]),

  notices: defineTable({
    academyId: v.id("academies"),
    /** Unset = whole academy. */
    batchId: v.optional(v.id("batches")),
    title: v.string(),
    body: v.string(),
    authorId: v.id("users"),
  }).index("by_academyId", ["academyId"]),

  expenses: defineTable({
    academyId: v.id("academies"),
    date: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    voidedAt: v.optional(v.number()),
    voidReason: v.optional(v.string()),
  }).index("by_academyId_and_date", ["academyId", "date"]),

  auditLog: defineTable({
    academyId: v.id("academies"),
    userId: v.id("users"),
    action: v.string(),
    detail: v.string(),
  }).index("by_academyId", ["academyId"]),
});
