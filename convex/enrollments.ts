import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const getStudentCourses = query({
  args: {
    studentId: v.id("students"),
  },
  async handler(ctx, args) {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        return {
          enrollmentId: enrollment._id,
          courseId: course?._id,
          courseName: course?.name ?? "—",
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
        };
      })
    );
  },
});

export const enrollStudentInCourse = mutation({
  args: {
    studentId: v.id("students"),
    courseId: v.id("courses"),
  },
  async handler(ctx, args) {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Validate course belongs to same academy as student
    if (course.academyId !== student.academyId) {
      throw new Error("Course does not belong to student's academy");
    }

    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_student_course", (q) =>
        q.eq("studentId", args.studentId).eq("courseId", args.courseId)
      )
      .first();

    if (existing) {
      throw new Error("Student is already enrolled in this course");
    }

    const enrollmentId = await ctx.db.insert("enrollments", {
      academyId: student.academyId,
      studentId: args.studentId,
      courseId: args.courseId,
      enrolledAt: Date.now(),
    });

    return { enrollmentId };
  },
});

export const unenrollStudentFromCourse = mutation({
  args: {
    enrollmentId: v.id("enrollments"),
  },
  async handler(ctx, args) {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    await ctx.db.delete(args.enrollmentId);
    return { enrollmentId: args.enrollmentId };
  },
});
