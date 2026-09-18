import { Alert, View } from "react-native";
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
  const remove = useMutation(api.students.deleteStudent);

  if (student === undefined || fees === undefined || attendance === undefined) {
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
              Alert.alert("Could not delete", e instanceof Error ? e.message : "Unknown error");
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

        <Button label="Move to recycle bin" variant="danger" onPress={confirmDelete} />
      </Screen>
    </View>
  );
}
