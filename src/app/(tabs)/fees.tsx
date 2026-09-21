import { useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { Redirect } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useSession } from "../../context/session";
import { currentMonthKey, formatMoney, monthLabel, useTheme } from "../../theme";
import {
  AppBar,
  AppText,
  Button,
  Card,
  EmptyState,
  Loader,
  Row,
  Segmented,
  type Tone,
} from "../../components/ui";
import { PaymentSheet } from "../../components/PaymentSheet";
import { ReversalSheet } from "../../components/ReversalSheet";
import { cleanError } from "../../lib/errors";

const TONE: Record<string, Tone> = {
  paid: "success",
  partial: "warning",
  due: "info",
  overdue: "danger",
};

function recentMonths(count: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

export default function Fees() {
  const t = useTheme();
  const { session } = useSession();

  const [month, setMonth] = useState(currentMonthKey());
  const [status, setStatus] = useState("all");
  const [active, setActive] = useState<{
    feeId: Id<"fees">;
    studentName: string;
    balance: number;
  } | null>(null);
  const [reversal, setReversal] = useState<{
    feeId: Id<"fees">;
    studentName: string;
    amountPaid: number;
  } | null>(null);

  const generate = useMutation(api.fees.generateMonthlyFees);

  const fees = useQuery(
    api.fees.listFees,
    session?.academyId
      ? {
          academyId: session.academyId,
          month,
          status: status === "all" ? undefined : status,
        }
      : "skip"
  );

  if (!session) return <Redirect href="/login" />;
  if (!session.academyId) return <Redirect href="/select-academy" />;

  const collected = (fees ?? []).reduce((s, f) => s + f.amountPaid, 0);
  const outstanding = (fees ?? []).reduce((s, f) => s + f.balance, 0);

  async function runGenerate() {
    if (!session?.academyId) return;
    try {
      const result = await generate({
        academyId: session.academyId,
        month,
        dueDate: `${month}-10`,
      });
      Alert.alert(
        "Invoices generated",
        `${result.created} created, ${result.skipped} already existed.`
      );
    } catch (e) {
      Alert.alert("Could not generate", cleanError(e, "Unknown error"));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Fees" subtitle={monthLabel(month)} large />

      <View style={{ paddingHorizontal: t.spacing.lg, gap: t.spacing.md, paddingBottom: t.spacing.md }}>
        <Segmented
          value={month}
          onChange={setMonth}
          options={recentMonths(6).map((m) => ({ label: monthLabel(m).split(" ")[0], value: m }))}
        />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { label: "All", value: "all" },
            { label: "Overdue", value: "overdue" },
            { label: "Partial", value: "partial" },
            { label: "Due", value: "due" },
            { label: "Paid", value: "paid" },
          ]}
        />

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ gap: 2 }}>
              <AppText variant="caption" color={t.colors.textMuted}>
                Collected
              </AppText>
              <AppText variant="heading" color={t.colors.success}>
                {formatMoney(collected)}
              </AppText>
            </View>
            <View style={{ gap: 2, alignItems: "flex-end" }}>
              <AppText variant="caption" color={t.colors.textMuted}>
                Outstanding
              </AppText>
              <AppText variant="heading" color={outstanding > 0 ? t.colors.danger : t.colors.text}>
                {formatMoney(outstanding)}
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      {fees === undefined ? (
        <Loader />
      ) : fees.length === 0 ? (
        <EmptyState
          title="No invoices for this month"
          message="Generate monthly invoices for every active student in one step."
          actionLabel="Generate invoices"
          onAction={runGenerate}
        />
      ) : (
        <FlatList
          data={fees}
          keyExtractor={(f) => f.feeId}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={{ marginTop: t.spacing.md }}>
              <Button label="Generate missing invoices" variant="tonal" onPress={runGenerate} />
            </View>
          }
          renderItem={({ item }) => (
            <Card padded={false} style={{ marginBottom: t.spacing.sm }}>
              <Row
                last
                title={item.studentName}
                subtitle={
                  item.balance > 0
                    ? `Balance ${formatMoney(item.balance)} · due ${item.dueDate}`
                    : `Paid ${item.paymentMethod ?? ""} · ${item.paymentDate ?? ""}`
                }
                meta={formatMoney(item.feeAmount)}
                badge={item.status}
                badgeTone={TONE[item.status]}
                onPress={() => {
                  if (item.balance > 0) {
                    setActive({
                      feeId: item.feeId,
                      studentName: item.studentName,
                      balance: item.balance,
                    });
                  } else {
                    setReversal({
                      feeId: item.feeId,
                      studentName: item.studentName,
                      amountPaid: item.amountPaid,
                    });
                  }
                }}
              />
            </Card>
          )}
        />
      )}

      <PaymentSheet
        open={active !== null}
        feeId={active?.feeId ?? null}
        studentName={active?.studentName ?? ""}
        balance={active?.balance ?? 0}
        onClose={() => setActive(null)}
      />

      <ReversalSheet
        open={reversal !== null}
        feeId={reversal?.feeId ?? null}
        studentName={reversal?.studentName ?? ""}
        amountPaid={reversal?.amountPaid ?? 0}
        onClose={() => setReversal(null)}
      />
    </View>
  );
}
