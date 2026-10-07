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
import { FormSheet } from "../components/FormSheet";
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
  const [values, setValues] = useState<Record<string, string>>({ teacherId: "", bonus: "0", deduction: "0" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (teachers && teachers.length && !values.teacherId) {
      setValues((prev) => ({ ...prev, teacherId: teachers[0].teacherId }));
    }
  }, [teachers, values.teacherId]);

  async function submit() {
    if (!session?.academyId || !values.teacherId) return;

    setBusy(true);
    setError("");
    try {
      await pay({
        academyId: session.academyId,
        teacherId: values.teacherId as Id<"teachers">,
        month: currentMonthKey(),
        bonus: Number(values.bonus) || 0,
        deduction: Number(values.deduction) || 0,
        markPaid: true,
      });
      setOpen(false);
      setValues((prev) => ({ ...prev, bonus: "0", deduction: "0" }));
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

      <FormSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Pay salary \u00b7 ${monthLabel(currentMonthKey())}`}
        values={values}
        onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
        submitLabel="Record payment"
        onSubmit={submit}
        busy={busy}
        error={error}
        note={teachers && teachers.length === 0 ? "Add a teacher first." : undefined}
        choices={
          teachers && teachers.length > 0
            ? [
                {
                  key: "teacherId",
                  label: "Teacher",
                  options: teachers.map((x) => ({ label: x.name, value: x.teacherId })),
                },
              ]
            : []
        }
        fields={[
          { key: "bonus", label: "Bonus", placeholder: "0", keyboard: "numeric" },
          { key: "deduction", label: "Deduction", placeholder: "0", keyboard: "numeric" },
        ]}
      />
    </View>
  );
}
