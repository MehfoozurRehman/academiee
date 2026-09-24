import { mutation } from "./_generated/server";
import { hashPassword } from "./passwords";

const TABLES = [
  "results",
  "tests",
  "timetable",
  "salaries",
  "attendance",
  "fees",
  "students",
  "batches",
  "courses",
  "teachers",
  "expenses",
  "customFields",
  "whatsappLogs",
  "activityLogs",
  "academies",
] as const;

function monthKey(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const seedDemo = mutation({
  args: {},
  async handler(ctx) {
    for (const table of TABLES) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }

    const users = await ctx.db.query("users").collect();
    for (const u of users) {
      if (u.role !== "admin") await ctx.db.delete(u._id);
    }

    const now = Date.now();
    const stamp = { createdAt: now, updatedAt: now };

    const ownerId = await ctx.db.insert("users", {
      email: "owner@academy.pk",
      password: await hashPassword("owner123"),
      name: "Mohib Ali",
      phone: "03001234567",
      status: "active",
      role: "academy_owner",
      ...stamp,
    });

    const academyId = await ctx.db.insert("academies", {
      ownerId,
      name: "Bright Future Academy",
      phone: "042-35789123",
      email: "info@brightfuture.edu.pk",
      address: "Main Boulevard, Gulberg III",
      city: "Lahore",
      country: "Pakistan",
      currency: "PKR",
      whatsappNumber: "923001234567",
      status: "active",
      ...stamp,
    });

    const secondAcademyId = await ctx.db.insert("academies", {
      ownerId,
      name: "City Science Academy",
      phone: "021-34567890",
      email: "info@cityscience.edu.pk",
      address: "DHA Phase 5",
      city: "Karachi",
      country: "Pakistan",
      currency: "PKR",
      status: "active",
      whatsappNumber: "923009998888",
      ...stamp,
    });

    const courseSpecs = [
      { name: "Matric Science", durationMonths: 12, monthlyFee: 8000 },
      { name: "FSc Pre-Medical", durationMonths: 12, monthlyFee: 12000 },
      { name: "FSc Pre-Engineering", durationMonths: 12, monthlyFee: 12000 },
      { name: "ICS Computer Science", durationMonths: 12, monthlyFee: 10000 },
      { name: "English Language", durationMonths: 3, monthlyFee: 5000 },
    ];

    const courseIds = [];
    for (const c of courseSpecs) {
      courseIds.push(
        await ctx.db.insert("courses", {
          academyId,
          ...c,
          status: "active",
          ...stamp,
        })
      );
    }

    const teacherSpecs = [
      { name: "Ahmed Khan", subject: "Mathematics", monthlySalary: 45000, phone: "03001112233" },
      { name: "Sara Malik", subject: "English", monthlySalary: 40000, phone: "03002223344" },
      { name: "Usman Ali", subject: "Physics", monthlySalary: 48000, phone: "03003334455" },
      { name: "Fatima Noor", subject: "Chemistry", monthlySalary: 42000, phone: "03004445566" },
      { name: "Bilal Hussain", subject: "Computer Science", monthlySalary: 50000, phone: "03005556677" },
    ];

    const teacherIds = [];
    for (const t of teacherSpecs) {
      teacherIds.push(
        await ctx.db.insert("teachers", {
          academyId,
          ...t,
          hireDate: "2025-01-15",
          status: "active",
          ...stamp,
        })
      );
    }

    const batchSpecs = [
      { name: "Matric Morning A", courseIdx: 0, teacherIdx: 0, startTime: "09:00", endTime: "11:00", days: ["Monday", "Wednesday", "Friday"], capacity: 25 },
      { name: "Matric Evening B", courseIdx: 0, teacherIdx: 0, startTime: "16:00", endTime: "18:00", days: ["Tuesday", "Thursday", "Saturday"], capacity: 20 },
      { name: "FSc Medical Morning", courseIdx: 1, teacherIdx: 3, startTime: "08:00", endTime: "12:00", days: ["Monday", "Tuesday", "Wednesday"], capacity: 30 },
      { name: "FSc Engineering Evening", courseIdx: 2, teacherIdx: 2, startTime: "15:00", endTime: "19:00", days: ["Monday", "Wednesday", "Friday"], capacity: 25 },
      { name: "ICS Computer Lab", courseIdx: 3, teacherIdx: 4, startTime: "10:00", endTime: "13:00", days: ["Saturday", "Sunday"], capacity: 15 },
      { name: "English Spoken", courseIdx: 4, teacherIdx: 1, startTime: "17:00", endTime: "19:00", days: ["Tuesday", "Thursday"], capacity: 20 },
    ];

    const batchIds = [];
    for (const b of batchSpecs) {
      batchIds.push(
        await ctx.db.insert("batches", {
          academyId,
          courseId: courseIds[b.courseIdx],
          teacherId: teacherIds[b.teacherIdx],
          name: b.name,
          startTime: b.startTime,
          endTime: b.endTime,
          days: b.days,
          capacity: b.capacity,
          currentStudents: 0,
          status: "active",
          ...stamp,
        })
      );
    }

    const studentSpecs = [
      { name: "Ali Raza", fatherName: "Muhammad Raza", gender: "male", batchIdx: 0, fee: 8000 },
      { name: "Ayesha Siddiqui", fatherName: "Imran Siddiqui", gender: "female", batchIdx: 0, fee: 8000 },
      { name: "Hassan Ahmed", fatherName: "Tariq Ahmed", gender: "male", batchIdx: 0, fee: 8000 },
      { name: "Iqra Nadeem", fatherName: "Nadeem Akhtar", gender: "female", batchIdx: 1, fee: 8000 },
      { name: "Bilal Sheikh", fatherName: "Rashid Sheikh", gender: "male", batchIdx: 1, fee: 8000 },
      { name: "Zainab Fatima", fatherName: "Asif Mehmood", gender: "female", batchIdx: 2, fee: 12000 },
      { name: "Omar Farooq", fatherName: "Khalid Farooq", gender: "male", batchIdx: 2, fee: 12000 },
      { name: "Maryam Bibi", fatherName: "Ghulam Nabi", gender: "female", batchIdx: 2, fee: 12000 },
      { name: "Sanaullah Khan", fatherName: "Naeem Khan", gender: "male", batchIdx: 3, fee: 12000 },
      { name: "Hamza Tariq", fatherName: "Tariq Mehmood", gender: "male", batchIdx: 3, fee: 12000 },
      { name: "Nida Aslam", fatherName: "Aslam Pervez", gender: "female", batchIdx: 4, fee: 10000 },
      { name: "Usama Javed", fatherName: "Javed Iqbal", gender: "male", batchIdx: 5, fee: 5000 },
    ];

    const studentIds = [];
    for (let i = 0; i < studentSpecs.length; i++) {
      const s = studentSpecs[i];
      const id = await ctx.db.insert("students", {
        academyId,
        batchId: batchIds[s.batchIdx],
        name: s.name,
        fatherName: s.fatherName,
        gender: s.gender as "male" | "female",
        studentPhone: `0311${String(1000000 + i * 11111).slice(0, 7)}`,
        parentPhone: `0300${String(1112233 + i * 10101).slice(0, 7)}`,
        monthlyFee: s.fee,
        admissionDate: "2025-09-01",
        status: i === 11 ? "inactive" : "active",
        ...stamp,
      });
      studentIds.push(id);

      const batch = await ctx.db.get(batchIds[s.batchIdx]);
      if (batch) {
        await ctx.db.patch(batch._id, {
          currentStudents: batch.currentStudents + 1,
        });
      }
    }

    const months = [monthKey(-2), monthKey(-1), monthKey(0)];
    for (let m = 0; m < months.length; m++) {
      for (let i = 0; i < studentIds.length; i++) {
        const spec = studentSpecs[i];
        const isCurrent = m === months.length - 1;

        let amountPaid = spec.fee;
        let status: "paid" | "partial" | "due" | "overdue" = "paid";

        if (isCurrent) {
          if (i % 4 === 0) {
            amountPaid = 0;
            status = "due";
          } else if (i % 4 === 1) {
            amountPaid = Math.round(spec.fee / 2);
            status = "partial";
          }
        } else if (i % 5 === 0) {
          amountPaid = 0;
          status = "overdue";
        }

        await ctx.db.insert("fees", {
          academyId,
          studentId: studentIds[i],
          month: months[m],
          feeAmount: spec.fee,
          discount: 0,
          amountPaid,
          balance: spec.fee - amountPaid,
          status,
          paymentMethod:
            amountPaid > 0
              ? ["Cash", "Bank Transfer", "JazzCash", "EasyPaisa"][i % 4]
              : undefined,
          paymentDate: amountPaid > 0 ? `${months[m]}-08` : undefined,
          dueDate: `${months[m]}-10`,
          ...stamp,
        });
      }
    }

    for (let d = 0; d < 14; d++) {
      const date = dayKey(-d);
      for (let i = 0; i < studentIds.length - 1; i++) {
        const roll = (i + d) % 10;
        const status = roll === 0 ? "absent" : roll === 1 ? "late" : "present";

        await ctx.db.insert("attendance", {
          academyId,
          studentId: studentIds[i],
          batchId: batchIds[studentSpecs[i].batchIdx],
          date,
          status,
          ...stamp,
        });
      }
    }

    const expenseSpecs = [
      { category: "Rent", description: "Monthly academy rent", amount: 50000 },
      { category: "Electricity", description: "WAPDA bill", amount: 12500 },
      { category: "Internet", description: "PTCL monthly", amount: 3500 },
      { category: "Maintenance", description: "AC repair and cleaning", amount: 4500 },
      { category: "Other", description: "Whiteboard markers and stationery", amount: 2800 },
    ];

    for (let m = 0; m < months.length; m++) {
      for (const e of expenseSpecs) {
        await ctx.db.insert("expenses", {
          academyId,
          date: `${months[m]}-05`,
          category: e.category,
          description: e.description,
          amount: e.amount,
          paidBy: "Admin",
          paymentMethod: "Cash",
          ...stamp,
        });
      }
    }

    for (let m = 0; m < months.length - 1; m++) {
      for (let i = 0; i < teacherIds.length; i++) {
        const spec = teacherSpecs[i];
        await ctx.db.insert("salaries", {
          academyId,
          teacherId: teacherIds[i],
          month: months[m],
          baseAmount: spec.monthlySalary,
          bonus: i === 0 ? 2000 : 0,
          deduction: i === 1 ? 500 : 0,
          amountPaid: spec.monthlySalary + (i === 0 ? 2000 : 0) - (i === 1 ? 500 : 0),
          status: "paid",
          paidDate: `${months[m]}-28`,
          ...stamp,
        });
      }
    }

    const testSpecs = [
      { name: "Math Monthly Test", batchIdx: 0, subject: "Mathematics", totalMarks: 50 },
      { name: "Physics Chapter 1-3", batchIdx: 2, subject: "Physics", totalMarks: 100 },
      { name: "Chemistry Mid Term", batchIdx: 2, subject: "Chemistry", totalMarks: 75 },
      { name: "English Assessment", batchIdx: 5, subject: "English", totalMarks: 40 },
    ];

    for (let t = 0; t < testSpecs.length; t++) {
      const spec = testSpecs[t];
      const testId = await ctx.db.insert("tests", {
        academyId,
        batchId: batchIds[spec.batchIdx],
        name: spec.name,
        subject: spec.subject,
        date: dayKey(-7 - t * 3),
        totalMarks: spec.totalMarks,
        ...stamp,
      });

      for (let i = 0; i < studentIds.length; i++) {
        if (studentSpecs[i].batchIdx !== spec.batchIdx) continue;
        await ctx.db.insert("results", {
          academyId,
          testId,
          studentId: studentIds[i],
          marksObtained: Math.round(spec.totalMarks * (0.55 + ((i * 7) % 40) / 100)),
          ...stamp,
        });
      }
    }

    for (let b = 0; b < batchSpecs.length; b++) {
      const spec = batchSpecs[b];
      for (const day of spec.days) {
        await ctx.db.insert("timetable", {
          academyId,
          batchId: batchIds[b],
          teacherId: teacherIds[spec.teacherIdx],
          day,
          startTime: spec.startTime,
          endTime: spec.endTime,
          subject: teacherSpecs[spec.teacherIdx].subject,
          ...stamp,
        });
      }
    }

    for (const field of [
      { label: "CNIC", key: "cnic" },
      { label: "Blood Group", key: "blood_group" },
    ]) {
      await ctx.db.insert("customFields", {
        academyId,
        ...field,
        createdAt: now,
      });
    }

    return {
      ownerEmail: "owner@academy.pk",
      ownerPassword: "owner123",
      academies: 2,
      students: studentIds.length,
      teachers: teacherIds.length,
      batches: batchIds.length,
      primaryAcademyId: academyId,
      secondAcademyId,
    };
  },
});
