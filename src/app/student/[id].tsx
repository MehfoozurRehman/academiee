import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatMoney, monthLabel, useTheme } from "../../theme";
import {
  AppBar,
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  Loader,
  Row,
  Screen,
  type Tone,
} from "../../components/ui";
import { FormSheet } from "../../components/FormSheet";
import { cleanError } from "../../lib/errors";

const TONE: Record<string, Tone> = {
  paid: "success",
  partial: "warning",
  due: "info",
  overdue: "danger",
};

export default function StudentDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = id as Id<"students">;

  const student = useQuery(api.students.getStudent, { studentId });
  const fees = useQuery(api.fees.getStudentFees, { studentId });
  const attendance = useQuery(api.attendance.getStudentAttendance, { studentId });
  const courses = useQuery(api.courses.listCourses,
    student?.academyId ? { academyId: student.academyId } : "skip"
  );
  const enrolledCourses = useQuery(api.enrollments.getStudentCourses, { studentId });
  const remove = useMutation(api.students.deleteStudent);
  const update = useMutation(api.students.updateStudent);
  const enrollCourse = useMutation(api.enrollments.enrollStudentInCourse);
  const unenrollCourse = useMutation(api.enrollments.unenrollStudentFromCourse);

  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string>>({
    name: "",
    fatherName: "",
    parentPhone: "",
    studentPhone: "",
    fee: "",
    status: "active",
  });

  if (student === undefined || fees === undefined || attendance === undefined || enrolledCourses === undefined) {
    return <Loader />;
  }

  if (student === null) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <AppBar title="Student" onBack={() => router.back()} />
        <Screen>
          <AppText variant="body" color={t.colors.textMuted}>
            This student no longer exists.
          </AppText>
        </Screen>
      </View>
    );
  }

  function openEdit() {
    setEditValues({
      name: student.name,
      fatherName: student.fatherName,
      parentPhone: student.parentPhone,
      studentPhone: student.studentPhone ?? "",
      fee: student.monthlyFee.toString(),
      status: student.status,
    });
    setEditError("");
    setEditOpen(true);
  }

  async function submitEdit() {
    if (!editValues.name?.trim() || !editValues.fatherName?.trim() || !editValues.parentPhone?.trim()) {
      setEditError("Name, father name and parent phone are required");
      return;
    }

    const monthlyFee = Number(editValues.fee);
    if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
      setEditError("Enter a valid monthly fee");
      return;
    }

    setEditBusy(true);
    setEditError("");

    try {
      await update({
        studentId,
        name: editValues.name.trim(),
        fatherName: editValues.fatherName.trim(),
        parentPhone: editValues.parentPhone.trim(),
        studentPhone: editValues.studentPhone?.trim() || undefined,
        monthlyFee,
        status: editValues.status as "active" | "inactive" | "graduated",
      });
      setEditOpen(false);
    } catch (e) {
      setEditError(cleanError(e, "Could not update student"));
    } finally {
      setEditBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Move to recycle bin?",
      `${student?.name} can be restored later from the recycle bin.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove({ studentId });
              router.back();
            } catch (e) {
              Alert.alert("Could not delete", cleanError(e, "Unknown error"));
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title={student.name} subtitle={student.batchName} onBack={() => router.back()} />

      <Screen scroll>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}>
            <Avatar name={student.name} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{student.name}</AppText>
              <AppText variant="caption" color={t.colors.textMuted}>
                s/o {student.fatherName}
              </AppText>
            </View>
            <Badge
              label={student.status}
              tone={student.status === "active" ? "success" : "neutral"}
            />
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: t.spacing.md }}>
          <Card style={{ flex: 1 }}>
            <View style={{ gap: 4 }}>
              <AppText variant="caption" color={t.colors.textMuted}>
                Attendance
              </AppText>
              <AppText variant="title">{student.attendanceRate}%</AppText>
            </View>
          </Card>
          <Card style={{ flex: 1 }}>
            <View style={{ gap: 4 }}>
              <AppText variant="caption" color={t.colors.textMuted}>
                Outstanding
              </AppText>
              <AppText
                variant="title"
                color={student.outstanding > 0 ? t.colors.danger : t.colors.success}
              >
                {formatMoney(student.outstanding)}
              </AppText>
            </View>
          </Card>
        </View>

        <Card padded={false}>
          <Row title="Parent phone" meta={student.parentPhone} />
          <Row title="Student phone" meta={student.studentPhone ?? "—"} />
          <Row title="Monthly fee" meta={formatMoney(student.monthlyFee)} />
          <Row title="Admitted" meta={student.admissionDate} last />
        </Card>

        <View style={{ gap: t.spacing.sm }}>
          <AppText variant="micro" color={t.colors.textMuted}>
            ATTENDANCE · {attendance.present} P · {attendance.late} L · {attendance.absent} A
          </AppText>
        </View>

        <View style={{ gap: t.spacing.sm }}>
          <AppText variant="micro" color={t.colors.textMuted}>
            COURSES
          </AppText>
          <Card padded={false}>
            <Row
              title="Batch course"
              meta={student.batchCourseName || "—"}
              last={enrolledCourses.length === 0}
            />
            {enrolledCourses.length > 0 && (
              <>
                {enrolledCourses.map((ec, i) => (
                  <Pressable
                    key={ec.enrollmentId}
                    onPress={() => {
                      Alert.alert(
                        "Unenroll from course?",
                        `Remove ${ec.courseName} from this student's enrollments?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Unenroll",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await unenrollCourse({ enrollmentId: ec.enrollmentId as never });
                              } catch (e) {
                                Alert.alert("Could not unenroll", cleanError(e, "Unknown error"));
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Row
                      title={ec.courseName}
                      meta="Tap to unenroll"
                      metaTone={t.colors.danger}
                      last={i === enrolledCourses.length - 1}
                    />
                  </Pressable>
                ))}
              </>
            )}
          </Card>
        </View>

        {courses && courses.length > 0 && (
          <View style={{ gap: t.spacing.md }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              ADD COURSE
            </AppText>
            <View style={{ gap: t.spacing.sm, maxHeight: 200 }}>
              {courses
                .filter(c => !enrolledCourses.some(ec => ec.courseId === c.courseId))
                .map((course) => (
                  <Button
                    key={course.courseId}
                    label={`+ ${course.name}`}
                    variant="secondary"
                    onPress={async () => {
                      try {
                        await enrollCourse({ studentId, courseId: course.courseId as never });
                      } catch (e) {
                        Alert.alert("Could not enroll", cleanError(e, "Unknown error"));
                      }
                    }}
                  />
                ))}
            </View>
          </View>
        )}

        <View style={{ gap: t.spacing.sm }}>
          <AppText variant="micro" color={t.colors.textMuted}>
            FEE HISTORY
          </AppText>
          <Card padded={false}>
            {fees.length === 0 ? (
              <Row title="No invoices yet" last />
            ) : (
              fees.map((f, i) => (
                <Row
                  key={f.feeId}
                  title={monthLabel(f.month)}
                  subtitle={
                    f.balance > 0 ? `Balance ${formatMoney(f.balance)}` : f.paymentMethod ?? "Paid"
                  }
                  meta={formatMoney(f.feeAmount)}
                  badge={f.status}
                  badgeTone={TONE[f.status]}
                  last={i === fees.length - 1}
                />
              ))
            )}
          </Card>
        </View>

        <View style={{ gap: t.spacing.md }}>
          <Button label="Edit student" onPress={openEdit} />
          <Button label="Move to recycle bin" variant="danger" onPress={confirmDelete} />
        </View>
      </Screen>

      <FormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit student"
        values={editValues}
        onChange={(key, value) => setEditValues((prev) => ({ ...prev, [key]: value }))}
        submitLabel="Save changes"
        onSubmit={submitEdit}
        busy={editBusy}
        error={editError}
        fields={[
          { key: "name", label: "Student name", placeholder: "Ali Raza", autoCapitalize: "words" },
          { key: "fatherName", label: "Father name", placeholder: "Muhammad Raza", autoCapitalize: "words" },
          { key: "parentPhone", label: "Parent phone", placeholder: "03001112233", keyboard: "phone-pad" },
          { key: "studentPhone", label: "Student phone", placeholder: "Optional", keyboard: "phone-pad" },
          { key: "fee", label: "Monthly fee", placeholder: "8000", keyboard: "numeric" },
        ]}
        choices={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Graduated", value: "graduated" },
            ],
          },
        ]}
      />
    </View>
  );
}
