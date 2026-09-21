import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useSession } from "../../context/session";
import { todayKey, useTheme } from "../../theme";
import {
  AppBar,
  AppText,
  Button,
  EmptyState,
  ErrorNote,
  Field,
  Loader,
  Screen,
  Segmented,
} from "../../components/ui";
import { cleanError } from "../../lib/errors";

export default function NewStudent() {
  const t = useTheme();
  const { session } = useSession();
  const create = useMutation(api.students.createStudent);
  const enrollCourse = useMutation(api.enrollments.enrollStudentInCourse);

  const batches = useQuery(
    api.batches.listBatches,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );

  const courses = useQuery(
    api.courses.listCourses,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  const [batchId, setBatchId] = useState<Id<"batches"> | null>(null);
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentPhone, setParentPhone] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [discount, setDiscount] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<Set<Id<"courses">>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const currentBatch = batches?.find((b) => b.batchId === batchId);

  useEffect(() => {
    if (batches && batches.length > 0 && !batchId) {
      setBatchId(batches[0].batchId);
    }
  }, [batches, batchId]);

  async function submit() {
    if (!session?.academyId || !batchId) return;

    const errors: string[] = [];

    if (!name.trim()) errors.push("Student name is required");
    if (!fatherName.trim()) errors.push("Father name is required");
    if (!parentPhone.trim()) errors.push("Parent phone is required");
    if (parentPhone.trim() && !/^03\d{9}$/.test(parentPhone.trim())) {
      errors.push("Parent phone must be in format: 03001234567");
    }
    if (studentPhone.trim() && !/^03\d{9}$/.test(studentPhone.trim())) {
      errors.push("Student phone must be in format: 03001234567");
    }

    const discountAmount = Number(discount);
    if (discount && (!Number.isFinite(discountAmount) || discountAmount < 0)) {
      errors.push("Discount must be a valid positive number");
    }

    if (errors.length > 0) {
      setError(errors.join("\n"));
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await create({
        academyId: session.academyId,
        batchId,
        name: name.trim(),
        fatherName: fatherName.trim(),
        gender,
        parentPhone: parentPhone.trim(),
        studentPhone: studentPhone.trim() || undefined,
        discount: Number.isFinite(discountAmount) ? discountAmount : 0,
        admissionDate: todayKey(),
      });

      // Enroll student in selected courses
      const enrollmentErrors: string[] = [];
      for (const courseId of selectedCourses) {
        try {
          await enrollCourse({ studentId: result.studentId, courseId: courseId as never });
        } catch (enrollError) {
          enrollmentErrors.push(cleanError(enrollError, `Failed to enroll in a course`));
        }
      }

      if (enrollmentErrors.length > 0) {
        setError(`Student added but ${enrollmentErrors.length} course enrollment(s) failed:\n${enrollmentErrors.join("\n")}`);
        return;
      }

      router.back();
    } catch (e) {
      setError(cleanError(e, "Could not add student"));
    } finally {
      setBusy(false);
    }
  }

  if (batches === undefined || courses === undefined) return <Loader />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: t.colors.bg }}
    >
      <AppBar title="New student" onBack={() => router.back()} />

      {batches.length === 0 ? (
        <EmptyState
          title="No active batches"
          message="Create a batch before adding students, so each student has a class to join."
          actionLabel="Go to batches"
          onAction={() => router.replace("/batches")}
        />
      ) : (
        <Screen scroll>
          <View style={{ gap: 6 }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              BATCH
            </AppText>
            <Segmented
              value={batchId ?? ""}
              onChange={(v) => {
                setBatchId(v as Id<"batches">);
              }}
              options={batches.map((b) => ({
                label: `${b.name} (${b.seatsLeft} left)`,
                value: b.batchId,
              }))}
            />
          </View>

          <View style={{ gap: t.spacing.md }}>
            <Field label="Student name" value={name} onChangeText={setName} placeholder="Ali Raza" autoCapitalize="words" />
            <Field label="Father name" value={fatherName} onChangeText={setFatherName} placeholder="Muhammad Raza" autoCapitalize="words" />

            <View style={{ gap: 6 }}>
              <AppText variant="micro" color={t.colors.textMuted}>
                GENDER
              </AppText>
              <Segmented
                value={gender}
                onChange={(v) => setGender(v as "male" | "female")}
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                ]}
              />
            </View>

            <Field label="Parent phone" value={parentPhone} onChangeText={setParentPhone} placeholder="03001112233" keyboardType="phone-pad" />
            <Field label="Student phone" value={studentPhone} onChangeText={setStudentPhone} placeholder="Optional" keyboardType="phone-pad" />

            {currentBatch && (
              <View style={{ gap: t.spacing.sm, paddingVertical: t.spacing.sm }}>
                <AppText variant="micro" color={t.colors.textMuted}>
                  MONTHLY FEE
                </AppText>
                <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm }}>
                  <AppText variant="body" color={t.colors.text}>
                    PKR {currentBatch.monthlyFee?.toLocaleString() || "—"}
                  </AppText>
                </View>
              </View>
            )}

            <Field label="Discount" value={discount} onChangeText={setDiscount} placeholder="0" keyboardType="numeric" suffix="PKR" />

            <View style={{ gap: t.spacing.sm }}>
              <AppText variant="micro" color={t.colors.textMuted}>
                COURSES (OPTIONAL)
              </AppText>
              {courses.length === 0 ? (
                <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm }}>
                  <AppText variant="body" color={t.colors.textMuted}>
                    No courses available
                  </AppText>
                </View>
              ) : (
                <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.lg, overflow: "hidden" }}>
                  {courses.map((course, idx) => {
                    const selected = selectedCourses.has(course.courseId);
                    return (
                      <View key={course.courseId}>
                        <Pressable
                          onPress={() => {
                            const newSet = new Set(selectedCourses);
                            if (selected) {
                              newSet.delete(course.courseId);
                            } else {
                              newSet.add(course.courseId);
                            }
                            setSelectedCourses(newSet);
                          }}
                          style={{
                            paddingHorizontal: t.spacing.lg,
                            paddingVertical: t.spacing.md,
                            backgroundColor: selected ? t.colors.accentSoft : "transparent",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <AppText variant="body" color={t.colors.text}>
                            {course.name}
                          </AppText>
                          {selected && <AppText style={{ color: t.colors.accent, fontSize: 20 }}>✓</AppText>}
                        </Pressable>
                        {idx < courses.length - 1 && (
                          <View style={{ height: 1, backgroundColor: t.colors.border, marginHorizontal: t.spacing.lg }} />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <ErrorNote message={error} />

            <Button label="Add student" onPress={submit} loading={busy} />
          </View>
        </Screen>
      )}
    </KeyboardAvoidingView>
  );
}
