import { useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useSession } from "../context/session";
import { currentMonthKey, formatMoney, monthLabel, useTheme } from "../theme";
import {
  AppBar,
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Fab,
  Field,
  Loader,
  Row,
  Segmented,
} from "../components/ui";
import { Sheet } from "../components/Sheet";
import { cleanError } from "../lib/errors";

export default function Salary() {
  const t = useTheme();
  const { session } = useSession();
  const pay = useMutation(api.salaries.paySalary);
  const markPaid = useMutation(api.salaries.markPaid);

  const salaries = useQuery(
    api.salaries.listSalaries,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );
  const teachers = useQuery(
    api.teachers.listTeachers,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );

  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<Id<"teachers"> | null>(null);
  const [bonus, setBonus] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (teachers && teachers.length && !teacherId) setTeacherId(teachers[0].teacherId);
  }, [teachers, teacherId]);

  async function submit() {
    if (!session?.academyId || !teacherId) return;

    setBusy(true);
    setError("");
    try {
      await pay({
        academyId: session.academyId,
        teacherId,
        month: currentMonthKey(),
        bonus: Number(bonus) || 0,
        deduction: Number(deduction) || 0,
        markPaid: true,
      });
      setOpen(false);
      setBonus("0");
      setDeduction("0");
    } catch (e) {
      setError(cleanError(e, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  const total = (salaries ?? []).reduce((s, x) => s + x.amountPaid, 0);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Salaries" onBack={() => router.back()} />

      {salaries === undefined ? (
        <Loader />
      ) : (
        <FlatList
          data={salaries}
          keyExtractor={(s) => s.salaryId}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Card style={{ marginBottom: t.spacing.md }}>
              <View style={{ gap: 4 }}>
                <AppText variant="caption" color={t.colors.textMuted}>
                  Total paid out
                </AppText>
                <AppText variant="display">{formatMoney(total)}</AppText>
              </View>
            </Card>
          }
          ListEmptyComponent={
            <EmptyState
              title="No salary records"
              message="Pay a teacher to start a salary history."
              actionLabel="Pay salary"
              onAction={() => setOpen(true)}
            />
          }
          renderItem={({ item }) => (
            <Card padded={false} style={{ marginBottom: t.spacing.sm }}>
              <Row
                last
                title={item.teacherName}
                subtitle={`${monthLabel(item.month)} · base ${formatMoney(item.baseAmount)}${
                  item.bonus ? ` · bonus ${formatMoney(item.bonus)}` : ""
                }${item.deduction ? ` · less ${formatMoney(item.deduction)}` : ""}`}
                meta={formatMoney(item.payable)}
                badge={item.status}
                badgeTone={item.status === "paid" ? "success" : "warning"}
                onPress={
                  item.status === "pending"
                    ? () =>
                        Alert.alert("Mark as paid?", `${item.teacherName} · ${formatMoney(item.payable)}`, [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Mark paid",
                            onPress: async () => {
                              try {
                                await markPaid({ salaryId: item.salaryId });
                              } catch (e) {
                                Alert.alert(
                                  "Failed",
                                  cleanError(e, "Unknown error")
                                );
                              }
                            },
                          },
                        ])
                    : undefined
                }
              />
            </Card>
          )}
        />
      )}

      <Fab onPress={() => setOpen(true)} />

      <Sheet open={open} onClose={() => setOpen(false)} title={`Pay salary · ${monthLabel(currentMonthKey())}`}>
        <View style={{ gap: t.spacing.md }}>
          {teachers && teachers.length > 0 ? (
            <View style={{ gap: 6 }}>
              <AppText variant="micro" color={t.colors.textMuted}>
                TEACHER
              </AppText>
              <Segmented
                value={teacherId ?? ""}
                onChange={(v) => setTeacherId(v as Id<"teachers">)}
                options={teachers.map((x) => ({ label: x.name, value: x.teacherId }))}
              />
            </View>
          ) : (
            <AppText variant="caption" color={t.colors.textMuted}>
              Add a teacher first.
            </AppText>
          )}

          <View style={{ flexDirection: "row", gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Field label="Bonus" value={bonus} onChangeText={setBonus} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Deduction" value={deduction} onChangeText={setDeduction} keyboardType="numeric" />
            </View>
          </View>

          <ErrorNote message={error} />
          <Button label="Record payment" onPress={submit} loading={busy} />
        </View>
      </Sheet>
    </View>
  );
}
