import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTest = mutation({
  args: {
    academyId: v.id("academies"),
    batchId: v.id("batches"),
    name: v.string(),
    subject: v.optional(v.string()),
    date: v.string(),
    totalMarks: v.number(),
  },
  async handler(ctx, args) {
    const testId = await ctx.db.insert("tests", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { testId, name: args.name };
  },
});

export const listTests = query({
  args: { academyId: v.id("academies") },
  async handler(ctx, args) {
    const tests = await ctx.db
      .query("tests")
      .withIndex("by_academy_deleted", (q) =>
        q.eq("academyId", args.academyId).eq("deletedAt", undefined)
      )
      .collect();

    tests.sort((a, b) => b.date.localeCompare(a.date));

    return Promise.all(
      tests.map(async (t) => {
        const batch = await ctx.db.get(t.batchId);

        const results = await ctx.db
          .query("results")
          .withIndex("by_testId", (q) => q.eq("testId", t._id))
          .collect();

        const live = results.filter((r) => r.deletedAt === undefined);

        return {
          testId: t._id,
          name: t.name,
          subject: t.subject,
          batchName: batch?.name ?? "—",
          date: t.date,
          totalMarks: t.totalMarks,
          resultCount: live.length,
        };
      })
    );
  },
});

export const saveResults = mutation({
  args: {
    academyId: v.id("academies"),
    testId: v.id("tests"),
    entries: v.array(
      v.object({
        studentId: v.id("students"),
        marksObtained: v.number(),
        remarks: v.optional(v.string()),
      })
    ),
  },
  async handler(ctx, args) {
    const test = await ctx.db.get(args.testId);
    if (!test || test.deletedAt !== undefined) {
      throw new Error("Test not found");
    }

    for (const entry of args.entries) {
      if (entry.marksObtained < 0 || entry.marksObtained > test.totalMarks) {
        throw new Error(
          `Marks must be between 0 and ${test.totalMarks}`
        );
      }
    }

    const existing = await ctx.db
      .query("results")
      .withIndex("by_testId", (q) => q.eq("testId", args.testId))
      .collect();

    const byStudent = new Map(
      existing.filter((r) => r.deletedAt === undefined).map((r) => [r.studentId, r])
    );

    let created = 0;
    let updated = 0;

    for (const entry of args.entries) {
      const prior = byStudent.get(entry.studentId);

      if (prior) {
        await ctx.db.patch(prior._id, {
          marksObtained: entry.marksObtained,
          remarks: entry.remarks,
          updatedAt: Date.now(),
        });
        updated++;
      } else {
        await ctx.db.insert("results", {
          academyId: args.academyId,
          testId: args.testId,
          studentId: entry.studentId,
          marksObtained: entry.marksObtained,
          remarks: entry.remarks,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        created++;
      }
    }

    return { created, updated };
  },
});

export const getTestResults = query({
  args: { testId: v.id("tests") },
  async handler(ctx, args) {
    const test = await ctx.db.get(args.testId);
    if (!test || test.deletedAt !== undefined) {
      return null;
    }

    const students = await ctx.db
      .query("students")
      .withIndex("by_batchId", (q) => q.eq("batchId", test.batchId))
      .collect();

    const results = await ctx.db
      .query("results")
      .withIndex("by_testId", (q) => q.eq("testId", args.testId))
      .collect();

    const byStudent = new Map(
      results.filter((r) => r.deletedAt === undefined).map((r) => [r.studentId, r])
    );

    const rows = students
      .filter((s) => s.deletedAt === undefined)
      .map((s) => {
        const result = byStudent.get(s._id);
        return {
          studentId: s._id,
          studentName: s.name,
          marksObtained: result?.marksObtained ?? null,
          percentage:
            result && test.totalMarks > 0
              ? Math.round((result.marksObtained / test.totalMarks) * 100)
              : null,
          remarks: result?.remarks,
        };
      });

    const graded = rows.filter((r) => r.marksObtained !== null);

    return {
      testName: test.name,
      date: test.date,
      totalMarks: test.totalMarks,
      average:
        graded.length > 0
          ? Math.round(
              graded.reduce((sum, r) => sum + (r.marksObtained ?? 0), 0) /
                graded.length
            )
          : 0,
      rows,
    };
  },
});

export const deleteTest = mutation({
  args: { testId: v.id("tests") },
  async handler(ctx, args) {
    const test = await ctx.db.get(args.testId);
    if (!test || test.deletedAt !== undefined) {
      throw new Error("Test not found");
    }

    const results = await ctx.db
      .query("results")
      .withIndex("by_testId", (q) => q.eq("testId", args.testId))
      .collect();

    for (const result of results) {
      if (result.deletedAt === undefined) {
        await ctx.db.patch(result._id, { deletedAt: Date.now() });
      }
    }

    await ctx.db.patch(args.testId, { deletedAt: Date.now() });
    return { testId: args.testId };
  },
});
