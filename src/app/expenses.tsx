import { useState } from "react";
import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { formatMoney, todayKey, useTheme } from "../theme";
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

const CATEGORIES = ["Rent", "Salary", "Electricity", "Internet", "Maintenance", "Other"];

export default function Expenses() {
  const t = useTheme();
  const { session } = useSession();
  const create = useMutation(api.expenses.createExpense);

  const data = useQuery(
    api.expenses.listExpenses,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!session?.academyId) return;

    const value = Number(amount);
    if (!description.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Enter a description and a valid amount");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await create({
        academyId: session.academyId,
        date: todayKey(),
        category,
        description: description.trim(),
        amount: value,
        paidBy: session.name,
        paymentMethod: "Cash",
      });
      setOpen(false);
      setDescription("");
      setAmount("");
    } catch (e) {
      setError(cleanError(e, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Expenses" onBack={() => router.back()} />

      {data === undefined ? (
        <Loader />
      ) : (
        <FlatList
          data={data.rows}
          keyExtractor={(e) => e.expenseId}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Card style={{ marginBottom: t.spacing.md }}>
              <View style={{ gap: t.spacing.sm }}>
                <AppText variant="caption" color={t.colors.textMuted}>
                  Total spend
                </AppText>
                <AppText variant="display">{formatMoney(data.total)}</AppText>
                <View style={{ gap: 4, marginTop: t.spacing.sm }}>
                  {Object.entries(data.byCategory).map(([cat, value]) => (
                    <View
                      key={cat}
                      style={{ flexDirection: "row", justifyContent: "space-between" }}
                    >
                      <AppText variant="caption" color={t.colors.textMuted}>
                        {cat}
                      </AppText>
                      <AppText variant="caption">{formatMoney(value)}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          }
          ListEmptyComponent={
            <EmptyState
              title="No expenses recorded"
              message="Track rent, salaries and bills to see your real monthly position."
              actionLabel="Add expense"
              onAction={() => setOpen(true)}
            />
          }
          renderItem={({ item }) => (
            <Card padded={false} style={{ marginBottom: t.spacing.sm }}>
              <Row
                last
                title={item.description}
                subtitle={`${item.category} · ${item.date} · ${item.paidBy}`}
                meta={formatMoney(item.amount)}
              />
            </Card>
          )}
        />
      )}

      <Fab onPress={() => setOpen(true)} />

      <Sheet open={open} onClose={() => setOpen(false)} title="Add expense">
        <View style={{ gap: t.spacing.md }}>
          <View style={{ gap: 6 }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              CATEGORY
            </AppText>
            <Segmented
              value={category}
              onChange={setCategory}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </View>
          <Field label="Description" value={description} onChangeText={setDescription} placeholder="Monthly academy rent" />
          <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="50000" keyboardType="numeric" suffix="PKR" />
          <ErrorNote message={error} />
          <Button label="Save expense" onPress={submit} loading={busy} />
        </View>
      </Sheet>
    </View>
  );
}
