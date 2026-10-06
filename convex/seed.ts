import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const demo = internalMutation({
  args: { ownerEmail: v.string() },
  handler: async (ctx, args) => {
    // Check if seeding is allowed
    if (process.env.ALLOW_DEV_CODES !== "true") {
      throw new Error("Seeding is only allowed on dev deployments");
    }

    // Find the user by email
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.ownerEmail))
      .take(1000);

    const user = users.find((u) => u.email === args.ownerEmail);
    if (!user) {
      throw new Error(`User with email ${args.ownerEmail} not found`);
    }

    // Find user's academies
    const academies = await ctx.db
      .query("academies")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .take(100);

    if (academies.length === 0) {
      throw new Error("User has no academies");
    }

    const academy = academies[0];

    // Check if academy already has data
    const existingCourses = await ctx.db
      .query("courses")
      .withIndex("by_academyId_and_archivedAt", (q) =>
        q.eq("academyId", academy._id).eq("archivedAt", undefined)
      )
      .take(10);

    if (existingCourses.length > 0) {
      throw new Error("Academy already has data");
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonth = getPreviousMonth(currentMonth);
    const twoMonthsAgo = getPreviousMonth(prevMonth);

    // Create 4 courses
    const courseData = [
      { name: "Matric Science", monthlyFee: 6000 },
      { name: "FSc Pre-Medical", monthlyFee: 9000 },
      { name: "FSc Pre-Engineering", monthlyFee: 9000 },
      { name: "O Level Maths", monthlyFee: 12000 },
    ];

    const courseIds: Id<"courses">[] = [];
    for (const course of courseData) {
      const id = await ctx.db.insert("courses", {
        academyId: academy._id,
        name: course.name,
        monthlyFee: course.monthlyFee,
      });
      courseIds.push(id);
    }

    // Create 5 batches
    const teachers = ["Sir Ahmed Khan", "Miss Ayesha Tariq", "Sir Bilal Hussain", "Miss Sana Iqbal", "Sir Usman Ali"];
    const batchesData = [
      {
        courseIdx: 0,
        name: "Matric Science - Morning",
        teacherName: teachers[0],
        days: [1, 3, 5],
        startTime: "15:00",
        endTime: "16:30",
        capacity: 25,
      },
      {
        courseIdx: 1,
        name: "FSc Pre-Medical - Evening",
        teacherName: teachers[1],
        days: [2, 4, 6],
        startTime: "16:30",
        endTime: "18:00",
        capacity: 20,
      },
      {
        courseIdx: 2,
        name: "FSc Pre-Engineering - Afternoon",
        teacherName: teachers[2],
        days: [1, 2, 3, 4, 5],
        startTime: "17:00",
        endTime: "18:30",
        capacity: 30,
      },
      {
        courseIdx: 3,
        name: "O Level Maths - Evening",
        teacherName: teachers[3],
        days: [2, 4, 6],
        startTime: "18:00",
        endTime: "19:30",
        capacity: 22,
      },
      {
        courseIdx: 0,
        name: "Matric Science - Evening",
        teacherName: teachers[4],
        days: [1, 3, 5],
        startTime: "19:30",
        endTime: "21:00",
        capacity: 20,
      },
    ];

    const batchIds: Id<"batches">[] = [];
    for (const batch of batchesData) {
      const id = await ctx.db.insert("batches", {
        academyId: academy._id,
        courseId: courseIds[batch.courseIdx],
        name: batch.name,
        teacherName: batch.teacherName,
        days: batch.days,
        startTime: batch.startTime,
        endTime: batch.endTime,
        capacity: batch.capacity,
        enrolled: 0, // Will update after creating students
      });
      batchIds.push(id);
    }

    // Create 24 students
    const studentNames = [
      { name: "Ali Hassan", father: "Hassan Raza", gender: "male" as const },
      { name: "Fatima Khan", father: "Khan Muhammad", gender: "female" as const },
      { name: "Omar Ahmed", father: "Ahmed Hassan", gender: "male" as const },
      { name: "Zainab Ali", father: "Ali Raza", gender: "female" as const },
      { name: "Muhammad Hasan", father: "Hasan Ahmad", gender: "male" as const },
      { name: "Ayesha Malik", father: "Malik Tariq", gender: "female" as const },
      { name: "Hassan Nawaz", father: "Nawaz Khan", gender: "male" as const },
      { name: "Saira Iqbal", father: "Iqbal Hussein", gender: "female" as const },
      { name: "Bilal Ahmed", father: "Ahmed Khalid", gender: "male" as const },
      { name: "Noor Fatima", father: "Fatima Shah", gender: "female" as const },
      { name: "Karim Hassan", father: "Hassan Ali", gender: "male" as const },
      { name: "Rania Hussain", father: "Hussain Ali", gender: "female" as const },
      { name: "Adnan Khan", father: "Khan Saleem", gender: "male" as const },
      { name: "Huda Ahmed", father: "Ahmed Jamil", gender: "female" as const },
      { name: "Rashid Raza", father: "Raza Malik", gender: "male" as const },
      { name: "Maha Siddiqui", father: "Siddiqui Hassan", gender: "female" as const },
      { name: "Faisal Aziz", father: "Aziz Muhammad", gender: "male" as const },
      { name: "Leila Khan", father: "Khan Nasir", gender: "female" as const },
      { name: "Salman Malik", father: "Malik Azhar", gender: "male" as const },
      { name: "Dina Ahmed", father: "Ahmed Farooq", gender: "female" as const },
      { name: "Tahir Hassan", father: "Hassan Wasim", gender: "male" as const },
      { name: "Soha Ali", father: "Ali Zahid", gender: "female" as const },
    ];

    // Add 2 more students for "left" status
    studentNames.push({ name: "Usman Yusuf", father: "Yusuf Malik", gender: "male" as const });
    studentNames.push({ name: "Yasmin Khan", father: "Khan Rashid", gender: "female" as const });

    const studentIds: Id<"students">[] = [];
    const batchStudentCounts = [5, 5, 6, 4, 4]; // Total 24, distributing across batches
    let studentIdx = 0;

    for (let b = 0; b < batchIds.length; b++) {
      const count = batchStudentCounts[b];
      for (let i = 0; i < count; i++) {
        if (studentIdx >= studentNames.length) break;

        const studentData = studentNames[studentIdx];
        const seq = studentIdx + 1;
        const code = `S-${String(seq).padStart(4, "0")}`;
        const phone = studentIdx % 3 === 0 ? `0300-${Math.floor(Math.random() * 9000000) + 1000000}` : undefined;
        const parentPhone = `0333-${Math.floor(Math.random() * 9000000) + 1000000}`;
        const monthlyFee = courseData[batchesData[b].courseIdx].monthlyFee;
        const discount = studentIdx % 8 === 0 ? 1000 : 0;
        const actualFee = monthlyFee - discount;
        const status = studentIdx >= 22 ? "left" : "active";
        const admissionDate = getDateDaysAgo(Math.floor(Math.random() * 120) + 30);

        const searchTextValue = [
          studentData.name,
          studentData.father,
          phone ?? "",
          parentPhone,
          code,
        ]
          .join(" ")
          .toLowerCase();

        const id = await ctx.db.insert("students", {
          academyId: academy._id,
          batchId: batchIds[b],
          code,
          name: studentData.name,
          fatherName: studentData.father,
          gender: studentData.gender,
          phone,
          parentPhone,
          monthlyFee: actualFee,
          admissionDate,
          status,
          searchText: searchTextValue,
        });
        studentIds.push(id);
        studentIdx++;
      }
    }

    // Update batch enrolled counts (only active students)
    const activeStudentsPerBatch = [4, 5, 6, 4, 3]; // Adjusted for 2 "left" students
    for (let b = 0; b < batchIds.length; b++) {
      await ctx.db.patch("batches", batchIds[b], { enrolled: activeStudentsPerBatch[b] });
    }

    // Create invoices and payments
    let receiptSeq = academy.receiptSeq;
    const invoiceData: Array<{
      studentIdx: number;
      month: string;
      dueDate: string;
      paid: number;
      status: "unpaid" | "partial" | "paid";
    }> = [];

    // Generate invoices for all 3 months for each student
    for (let s = 0; s < studentIds.length; s++) {
      const studentId = studentIds[s];
      const student = await ctx.db.get("students", studentId);
      if (!student || student.status !== "active") continue;

      const months = [twoMonthsAgo, prevMonth, currentMonth];
      for (const month of months) {
        const dueDate = `${month}-10`;
        let paid = 0;
        let status: "unpaid" | "partial" | "paid" = "unpaid";

        if (month === twoMonthsAgo || month === prevMonth) {
          // Past months: most fully paid, some partial, 2 unpaid
          const r = Math.random();
          if (r < 0.7) {
            paid = student.monthlyFee;
            status = "paid";
          } else if (r < 0.85) {
            paid = Math.floor(student.monthlyFee * 0.5);
            status = "partial";
          }
        } else {
          // Current month: about half paid, some partial, rest unpaid
          const r = Math.random();
          if (r < 0.45) {
            paid = student.monthlyFee;
            status = "paid";
          } else if (r < 0.65) {
            paid = Math.floor(student.monthlyFee * 0.5);
            status = "partial";
          }
        }

        const invoiceId = await ctx.db.insert("invoices", {
          academyId: academy._id,
          studentId,
          month,
          amount: student.monthlyFee,
          discount: 0,
          paid,
          dueDate,
        });

        invoiceData.push({ studentIdx: s, month, dueDate, paid, status });

        // Create payment records for paid/partial amounts
        if (paid > 0) {
          const [year, monthNum] = month.split("-");
          const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
          const paymentDay = Math.floor(Math.random() * daysInMonth) + 1;
          const paymentDate = `${month}-${String(paymentDay).padStart(2, "0")}`;

          const methods: Array<"cash" | "bank" | "jazzcash" | "easypaisa"> = [
            "cash",
            "bank",
            "jazzcash",
            "easypaisa",
          ];
          const method = methods[Math.floor(Math.random() * methods.length)];

          receiptSeq++;
          await ctx.db.insert("payments", {
            academyId: academy._id,
            invoiceId,
            studentId,
            amount: paid,
            method,
            date: paymentDate,
            receiptNo: receiptSeq,
            recordedBy: user._id,
          });
        }
      }
    }

    // Update receiptSeq
    await ctx.db.patch("academies", academy._id, { receiptSeq });

    // Create attendance for last 14 days (only for active students)
    const today = new Date();
    for (let daysAgo = 1; daysAgo <= 14; daysAgo++) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = formatDate(date);
      const dayOfWeek = date.getDay();

      // For each batch, add attendance for its students on its days
      for (let b = 0; b < batchIds.length; b++) {
        const batch = await ctx.db.get("batches", batchIds[b]);
        if (!batch || !batch.days.includes(dayOfWeek)) continue;

        // Get active students in this batch
        const batchStudents = await ctx.db
          .query("students")
          .withIndex("by_batchId_and_status", (q) =>
            q.eq("batchId", batchIds[b]).eq("status", "active")
          )
          .take(50);

        for (const student of batchStudents) {
          const r = Math.random();
          let status: "present" | "absent" | "late" = "present";
          if (r < 0.05) {
            status = "absent";
          } else if (r < 0.1) {
            status = "late";
          }

          await ctx.db.insert("attendance", {
            academyId: academy._id,
            batchId: batchIds[b],
            studentId: student._id,
            date: dateStr,
            status,
          });
        }
      }
    }

    // Create tests (2 per batch in the last month)
    const testIds: Array<{ testId: Id<"tests">; batchId: Id<"batches"> }> = [];
    for (let b = 0; b < batchIds.length; b++) {
      const subjects = ["Mathematics", "Science", "English", "Physics", "Chemistry"];
      const subject = subjects[b % subjects.length];
      const courseId = batchesData[b].courseIdx;
      const courseName = courseData[courseId].name;

      for (let t = 0; t < 2; t++) {
        const testDay = Math.floor(Math.random() * 25) + 1;
        const testDate = `${currentMonth}-${String(testDay).padStart(2, "0")}`;
        const totalMarks = Math.random() > 0.5 ? 50 : 25;

        const testId = await ctx.db.insert("tests", {
          academyId: academy._id,
          batchId: batchIds[b],
          title: `Chapter ${t + 1} Test`,
          subject: subject,
          date: testDate,
          totalMarks,
        });

        testIds.push({ testId, batchId: batchIds[b] });

        // Create results for all active students in this batch
        const batchStudents = await ctx.db
          .query("students")
          .withIndex("by_batchId_and_status", (q) =>
            q.eq("batchId", batchIds[b]).eq("status", "active")
          )
          .take(50);

        for (const student of batchStudents) {
          const marks = Math.floor(Math.random() * (totalMarks * 0.8)) + Math.floor(totalMarks * 0.2);
          await ctx.db.insert("results", {
            academyId: academy._id,
            testId,
            studentId: student._id,
            marks,
          });
        }
      }
    }

    // Create timetable slots (no overlapping teachers on same day/time)
    const usedSlots = new Set<string>();
    for (let b = 0; b < batchIds.length; b++) {
      const batch = await ctx.db.get("batches", batchIds[b]);
      if (!batch) continue;

      const subjects = ["Mathematics", "Science", "English", "Physics", "Chemistry"];
      const subject = subjects[b % subjects.length];

      for (const day of batch.days) {
        const slotKey = `${day}-${batch.startTime}-${batch.endTime}-${batch.teacherName}`;
        if (usedSlots.has(slotKey)) continue;
        usedSlots.add(slotKey);

        await ctx.db.insert("slots", {
          academyId: academy._id,
          batchId: batchIds[b],
          day,
          startTime: batch.startTime,
          endTime: batch.endTime,
          subject,
          teacherName: batch.teacherName,
        });
      }
    }

    // Create notices (1 academy-wide, 2 batch-specific)
    await ctx.db.insert("notices", {
      academyId: academy._id,
      title: "Eid Holidays",
      body: "The academy will remain closed for Eid holidays. Classes will resume on the following Monday.",
      authorId: user._id,
    });

    const notice1 = await ctx.db.insert("notices", {
      academyId: academy._id,
      batchId: batchIds[0],
      title: "Test Schedule",
      body: "Chapter 3 test will be held on Friday. Please prepare well.",
      authorId: user._id,
    });

    const notice2 = await ctx.db.insert("notices", {
      academyId: academy._id,
      batchId: batchIds[2],
      title: "Assignment Submission",
      body: "Submit the assignment by Wednesday.",
      authorId: user._id,
    });

    // Create expenses (6 total, 3 this month, 3 last month)
    const expenseCategories = [
      { cat: "Rent", amount: 45000 },
      { cat: "Utilities", amount: 8000 },
      { cat: "Supplies", amount: 3500 },
      { cat: "Salaries", amount: 120000 },
      { cat: "Maintenance", amount: 5000 },
      { cat: "Internet", amount: 2000 },
    ];

    for (let e = 0; e < 3; e++) {
      const expCat = expenseCategories[e % expenseCategories.length];
      const day = Math.floor(Math.random() * 28) + 1;
      const date = `${currentMonth}-${String(day).padStart(2, "0")}`;

      await ctx.db.insert("expenses", {
        academyId: academy._id,
        date,
        category: expCat.cat,
        description: `${expCat.cat} for ${currentMonth}`,
        amount: expCat.amount,
      });
    }

    for (let e = 3; e < 6; e++) {
      const expCat = expenseCategories[e % expenseCategories.length];
      const day = Math.floor(Math.random() * 28) + 1;
      const date = `${prevMonth}-${String(day).padStart(2, "0")}`;

      await ctx.db.insert("expenses", {
        academyId: academy._id,
        date,
        category: expCat.cat,
        description: `${expCat.cat} for ${prevMonth}`,
        amount: expCat.amount,
      });
    }

    // Create audit log entry
    await ctx.db.insert("auditLog", {
      academyId: academy._id,
      userId: user._id,
      action: "seed.demo",
      detail: "Demo data added",
    });

    return {
      academyId: academy._id,
      courses: courseIds.length,
      batches: batchIds.length,
      students: studentIds.length,
      invoices: invoiceData.length,
      attendance: 14 * batchIds.length * 5, // Approximate
      tests: testIds.length,
      slots: batchIds.length * 3, // Approximate
      notices: 3,
      expenses: 6,
    };
  },
});

function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  let m = parseInt(monthNum);
  let y = parseInt(year);

  m--;
  if (m < 1) {
    m = 12;
    y--;
  }

  return `${y}-${String(m).padStart(2, "0")}`;
}

function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
