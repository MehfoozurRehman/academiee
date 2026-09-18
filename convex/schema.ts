import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    role: v.union(v.literal("admin"), v.literal("academy_owner"), v.literal("staff")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  academies: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    postalCode: v.optional(v.string()),
    currency: v.string(),
    whatsappNumber: v.string(),
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    subscriptionPlan: v.union(v.literal("free"), v.literal("basic"), v.literal("pro")),
    timestamps: v.object({
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  courses: defineTable({
    academyId: v.id("academies"),
    name: v.string(),
    description: v.optional(v.string()),
    level: v.optional(v.string()),
    durationWeeks: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_academyId", ["academyId"]),

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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_status", ["status"]),

  batches: defineTable({
    academyId: v.id("academies"),
    courseId: v.id("courses"),
    teacherId: v.id("teachers"),
    name: v.string(),
    time: v.string(),
    days: v.string(),
    capacity: v.number(),
    currentStudents: v.number(),
    occupancyPercentage: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("completed")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_courseId", ["courseId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_status", ["status"]),

  students: defineTable({
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    name: v.string(),
    fatherName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    studentPhone: v.string(),
    parentPhone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    course: v.string(),
    monthlyFee: v.number(),
    admissionDate: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated")),
    attendancePercentage: v.number(),
    outstandingBalance: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_batchId", ["batchId"])
    .index("by_status", ["status"]),

  fees: defineTable({
    academyId: v.id("academies"),
    studentId: v.id("students"),
    month: v.string(),
    year: v.number(),
    feeAmount: v.number(),
    discount: v.number(),
    paymentPaid: v.number(),
    balance: v.number(),
    status: v.union(v.literal("paid"), v.literal("partial"), v.literal("overdue"), v.literal("pending")),
    paymentMethod: v.optional(v.string()),
    paymentDate: v.optional(v.string()),
    dueDate: v.string(),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_studentId", ["studentId"])
    .index("by_status", ["status"])
    .index("by_month", ["month", "year"]),

  attendance: defineTable({
    academyId: v.id("academies"),
    studentId: v.id("students"),
    batchId: v.id("batches"),
    date: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_studentId", ["studentId"])
    .index("by_batchId", ["batchId"])
    .index("by_date", ["date"]),

  expenses: defineTable({
    academyId: v.id("academies"),
    date: v.string(),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    paidBy: v.string(),
    paymentMethod: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("paid")),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_date", ["date"])
    .index("by_category", ["category"]),

  whatsappLogs: defineTable({
    academyId: v.id("academies"),
    studentId: v.id("students"),
    messageType: v.string(),
    phoneNumber: v.string(),
    message: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("pending")),
    sentAt: v.optional(v.number()),
    response: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_studentId", ["studentId"])
    .index("by_status", ["status"]),

  monthlyAnalytics: defineTable({
    academyId: v.id("academies"),
    month: v.string(),
    year: v.number(),
    totalStudents: v.number(),
    activeStudents: v.number(),
    newStudents: v.number(),
    totalCollected: v.number(),
    outstandingFees: v.number(),
    overdueCount: v.number(),
    averageAttendance: v.number(),
    totalExpenses: v.number(),
    netIncome: v.number(),
    updatedAt: v.number(),
  }).index("by_academyId", ["academyId"]),

  auditLogs: defineTable({
    academyId: v.id("academies"),
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    changes: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_academyId", ["academyId"])
    .index("by_userId", ["userId"])
    .index("by_action", ["action"]),
});
