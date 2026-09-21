import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    role: v.union(v.literal("admin"), v.literal("academy_owner")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  academies: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    currency: v.string(),
    whatsappNumber: v.string(),
    logo: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_deletedAt", ["deletedAt"]),

  courses: defineTable({
    academyId: v.id("academies"),
    name: v.string(),
    description: v.optional(v.string()),
    durationMonths: v.optional(v.number()),
    monthlyFee: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  teachers: defineTable({
    academyId: v.id("academies"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    subject: v.string(),
    address: v.optional(v.string()),
    monthlySalary: v.number(),
    hireDate: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("on_leave")),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  batches: defineTable({
    academyId: v.id("academies"),
    courseId: v.id("courses"),
    teacherId: v.id("teachers"),
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    days: v.array(v.string()),
    capacity: v.number(),
    currentStudents: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("completed")),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_courseId", ["courseId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  students: defineTable({
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    name: v.string(),
    fatherName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    studentPhone: v.optional(v.string()),
    parentPhone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    monthlyFee: v.number(),
    admissionDate: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated")),
    customValues: v.optional(v.record(v.string(), v.string())),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_batchId", ["batchId"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  fees: defineTable({
    academyId: v.id("academies"),
    studentId: v.id("students"),
    month: v.string(),
    feeAmount: v.number(),
    discount: v.number(),
    amountPaid: v.number(),
    balance: v.number(),
    status: v.union(
      v.literal("paid"),
      v.literal("partial"),
      v.literal("due"),
      v.literal("overdue")
    ),
    paymentMethod: v.optional(v.string()),
    paymentDate: v.optional(v.string()),
    dueDate: v.string(),
    remarks: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_studentId", ["studentId"])
    .index("by_academy_month", ["academyId", "month"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  attendance: defineTable({
    academyId: v.id("academies"),
    studentId: v.id("students"),
    batchId: v.id("batches"),
    date: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
    remarks: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_studentId", ["studentId"])
    .index("by_batch_date", ["batchId", "date"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  expenses: defineTable({
    academyId: v.id("academies"),
    date: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    paidBy: v.string(),
    paymentMethod: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_academy_date", ["academyId", "date"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  tests: defineTable({
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    name: v.string(),
    subject: v.optional(v.string()),
    date: v.string(),
    totalMarks: v.number(),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_batchId", ["batchId"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  results: defineTable({
    academyId: v.id("academies"),
    testId: v.id("tests"),
    studentId: v.id("students"),
    marksObtained: v.number(),
    remarks: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_testId", ["testId"])
    .index("by_studentId", ["studentId"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  timetable: defineTable({
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    teacherId: v.id("teachers"),
    day: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    subject: v.string(),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_batchId", ["batchId"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  salaries: defineTable({
    academyId: v.id("academies"),
    teacherId: v.id("teachers"),
    month: v.string(),
    baseAmount: v.number(),
    bonus: v.number(),
    deduction: v.number(),
    amountPaid: v.number(),
    status: v.union(v.literal("pending"), v.literal("paid")),
    paidDate: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_academy_month", ["academyId", "month"])
    .index("by_academy_deleted", ["academyId", "deletedAt"]),

  customFields: defineTable({
    academyId: v.id("academies"),
    label: v.string(),
    key: v.string(),
    createdAt: v.number(),
  }).index("by_academyId", ["academyId"]),

  whatsappLogs: defineTable({
    academyId: v.id("academies"),
    studentId: v.id("students"),
    messageType: v.string(),
    phoneNumber: v.string(),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_studentId", ["studentId"]),

  enrollments: defineTable({
    academyId: v.id("academies"),
    studentId: v.id("students"),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_studentId", ["studentId"])
    .index("by_courseId", ["courseId"])
    .index("by_student_course", ["studentId", "courseId"]),

  activityLogs: defineTable({
    academyId: v.id("academies"),
    userId: v.id("users"),
    action: v.string(),
    detail: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_userId", ["userId"]),
});
