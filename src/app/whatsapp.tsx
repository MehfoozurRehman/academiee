import { useState } from "react";
import { Alert, Linking, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { formatMoney, useTheme } from "../theme";
import {
  AppBar,
  AppText,
  Card,
  EmptyState,
  Loader,
  Row,
  Screen,
  Segmented,
} from "../components/ui";

function toInternational(local: string) {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export default function WhatsApp() {
  const t = useTheme();
  const { session } = useSession();
  const [selected, setSelected] = useState<string | null>(null);

  const academy = useQuery(
    api.academies.getAcademy,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  const students = useQuery(
    api.students.listStudents,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );

  if (students === undefined || academy === undefined) return <Loader />;

  const student = students.find((s) => s.studentId === selected) ?? students[0];

  const templates = student
    ? [
        {
          label: "Fee reminder",
          body: `Assalam o Alaikum, this is a reminder that the monthly fee for ${student.name} is ${formatMoney(student.monthlyFee)}. Kindly clear it at your earliest. — ${academy?.name ?? "Academy"}`,
        },
        {
          label: "Overdue notice",
          body: `Assalam o Alaikum, the fee for ${student.name} is overdue. Outstanding balance is ${formatMoney(student.outstanding)}. Please contact the office. — ${academy?.name ?? "Academy"}`,
        },
        {
          label: "Payment received",
          body: `Assalam o Alaikum, we have received the fee payment for ${student.name}. Thank you. — ${academy?.name ?? "Academy"}`,
        },
        {
          label: "Attendance warning",
          body: `Assalam o Alaikum, the attendance of ${student.name} needs improvement. Please ensure regular attendance. — ${academy?.name ?? "Academy"}`,
        },
      ]
    : [];

  async function send(body: string) {
    if (!student) return;
    const url = `whatsapp://send?phone=${toInternational(student.parentPhone)}&text=${encodeURIComponent(body)}`;
    const web = `https://wa.me/${toInternational(student.parentPhone)}?text=${encodeURIComponent(body)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      await Linking.openURL(supported ? url : web);
    } catch {
      Alert.alert("Could not open WhatsApp", "WhatsApp may not be installed on this device.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="WhatsApp" subtitle="Message parents" onBack={() => router.back()} />

      {students.length === 0 ? (
        <EmptyState title="No students" message="Add a student to message their parent." />
      ) : (
        <Screen scroll>
          <View style={{ gap: 6 }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              STUDENT
            </AppText>
            <Segmented
              value={student?.studentId ?? ""}
              onChange={setSelected}
              options={students.map((s) => ({ label: s.name, value: s.studentId }))}
            />
          </View>

          {student ? (
            <>
              <Card padded={false}>
                <Row title="Parent phone" meta={student.parentPhone} />
                <Row title="Monthly fee" meta={formatMoney(student.monthlyFee)} />
                <Row
                  title="Outstanding"
                  meta={formatMoney(student.outstanding)}
                  metaTone={student.outstanding > 0 ? t.colors.danger : undefined}
                  last
                />
              </Card>

              <View style={{ gap: t.spacing.sm }}>
                <AppText variant="micro" color={t.colors.textMuted}>
                  TEMPLATES
                </AppText>
                <Card padded={false}>
                  {templates.map((tpl, i) => (
                    <Row
                      key={tpl.label}
                      title={tpl.label}
                      subtitle={tpl.body}
                      last={i === templates.length - 1}
                      onPress={() => send(tpl.body)}
                    />
                  ))}
                </Card>
              </View>

              <AppText variant="caption" color={t.colors.textMuted}>
                Tapping a template opens WhatsApp with the message ready. Nothing is sent
                until you press send there.
              </AppText>
            </>
          ) : null}
        </Screen>
      )}
    </View>
  );
}
