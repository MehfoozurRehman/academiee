import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const seedData = mutation({
  args: { academyId: v.id("academies") },
  async handler(ctx, args) {
    const now = Date.now();

    // Create courses
    const courseIds: Record<string, Id<"courses">> = {};
    const courses = ["Mathematics", "English", "Physics", "Chemistry"];
    for (const name of courses) {
      const id = await ctx.db.insert("courses", {
        academyId: args.academyId,
        name,
        monthlyFee: 5000,
        createdAt: now,
        updatedAt: now,
      });
      courseIds[name] = id;
    }

    // Create batches
    const batchIds: string[] = [];
    for (const [courseName, courseId] of Object.entries(courseIds)) {
      for (let i = 1; i <= 3; i++) {
        const id = await ctx.db.insert("batches", {
          academyId: args.academyId,
          courseId,
          name: `${courseName} - Batch ${i}`,
          startDate: "2024-01-01",
          currentStudents: 0,
          createdAt: now,
          updatedAt: now,
        });
        batchIds.push(id);
      }
    }

    // Create teachers
    const teacherIds: Id<"teachers">[] = [];
    const teacherNames = [
      { name: "Ahmed Khan", phone: "03001234567" },
      { name: "Fatima Ali", phone: "03002345678" },
      { name: "Muhammad Hassan", phone: "03003456789" },
      { name: "Ayesha Malik", phone: "03004567890" },
      { name: "Ali Raza", phone: "03005678901" },
    ];
    for (const teacher of teacherNames) {
      const id = await ctx.db.insert("teachers", {
        academyId: args.academyId,
        name: teacher.name,
        phone: teacher.phone,
        createdAt: now,
        updatedAt: now,
      });
      teacherIds.push(id);
    }

    // Create students
    const studentNames = [
      "Ali Ahmed",
      "Fatima Hassan",
      "Muhammad Khan",
      "Zainab Ali",
      "Hassan Raza",
      "Amina Khan",
      "Omar Ahmed",
      "Hana Hassan",
      "Ibrahim Khan",
      "Layla Ali",
      "Karim Hassan",
      "Noor Khan",
    ];

    const studentIds: Id<"students">[] = [];
    for (let i = 0; i < studentNames.length; i++) {
      const batchId = batchIds[i % batchIds.length];
      const batch = await ctx.db.get(batchId);
      
      const id = await ctx.db.insert("students", {
        academyId: args.academyId,
        batchId,
        name: studentNames[i],
        fatherName: `Father of ${studentNames[i]}`,
        status: "active",
        monthlyFee: 5000,
        phone: `0300${String(i + 1000).padStart(7, "0")}`,
        createdAt: now,
        updatedAt: now,
      });
      studentIds.push(id);

      if (batch) {
        await ctx.db.patch(batchId, {
          currentStudents: batch.currentStudents + 1,
        });
      }
    }

    // Create fees for current month and generate some payments
    const currentMonth = new Date();
    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    const dueDate = `${monthKey}-10`;

    const paymentMethods = ["Cash", "Bank Transfer", "JazzCash"];
    const statuses = ["paid", "partial", "due", "overdue"];
    let statusIdx = 0;

    for (const studentId of studentIds) {
      const student = await ctx.db.get(studentId);
      if (!student) continue;

      const feeAmount = student.monthlyFee;
      const discount = Math.random() > 0.7 ? 500 : 0;
      const balance = feeAmount - discount;

      let amountPaid = 0;
      let status = "due";
      let paymentMethod: string | undefined;
      let paymentDate: string | undefined;

      // Distribute different statuses
      const statusType = statuses[statusIdx % statuses.length];
      statusIdx++;

      if (statusType === "paid") {
        amountPaid = balance;
        status = "paid";
        paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        paymentDate = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      } else if (statusType === "partial") {
        amountPaid = Math.floor(balance / 2);
        status = "partial";
        paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        paymentDate = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      }

      await ctx.db.insert("fees", {
        academyId: args.academyId,
        studentId,
        month: monthKey,
        feeAmount,
        discount,
        amountPaid,
        balance: balance - amountPaid,
        status,
        paymentMethod,
        paymentDate,
        dueDate,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      courses: Object.keys(courseIds).length,
      batches: batchIds.length,
      teachers: teacherIds.length,
      students: studentIds.length,
      fees: studentIds.length,
    };
  },
});
