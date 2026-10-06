import { useMemo, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Button,
  Card,
  DateField,
  EmptyState,
  Input,
  ListGroup,
  MonthStepper,
  Progress,
  Reveal,
  Screen,
  Section,
  Select,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from "../../components/ui";
import { useAcademyId } from "../../context/AcademyContext";
import { useI18n, type TKey } from "../../i18n/I18nProvider";
import { errorMessage } from "../../lib/errors";
import { useToday } from "../../lib/useToday";
import { space } from "../../theme/tokens";

const CATEGORIES = ["rent", "salaries", "utilities", "supplies", "marketing", "maintenance", "other"] as const;
const digits = (s: string) => s.replace(/\D/g, "");

export default function Expenses() {
  const { t, money, dateLabel } = useI18n();
  const toast = useToast();
  const academyId = useAcademyId();
  const { today, month: currentMonth } = useToday();
  const create = useMutation(api.expenses.create);
  const voidExpense = useMutation(api.expenses.void);

  const [month, setMonth] = useState(currentMonth);
  const data = useQuery(api.expenses.list, { academyId, month });

  const catLabel = (c: string) => t(`expenses.cat_${c}` as TKey);

  // Add
  const [addOpen, setAddOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  // Void
  const [voiding, setVoiding] = useState<{ _id: Id<"expenses">; description: string; amount: number } | null>(null);
  const [reason, setReason] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setDate(today.startsWith(month) ? today : `${month}-01`);
    setCategory(null);
    setDescription("");
    setAmount("");
    setError(null);
    setAddOpen(true);
  }

  async function submitAdd() {
    const a = Number(amount);
    if (!category) return setError(t("expenses.categoryMissing"));
    if (description.trim().length < 2) return setError(t("expenses.descriptionShort"));
    if (!a || a <= 0) return setError(t("expenses.amountInvalid"));
    setSaving(true);
    setError(null);
    try {
      await create({ academyId, date, category, description: description.trim(), amount: a });
      setAddOpen(false);
      toast(t("expenses.saved"));
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  async function submitVoid() {
    if (!voiding) return;
    if (reason.trim().length < 3) return setError(t("expenses.reasonShort"));
    setSaving(true);
    setError(null);
    try {
      await voidExpense({ academyId, expenseId: voiding._id, reason: reason.trim() });
      setVoiding(null);
      toast(t("expenses.voided"));
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  const categories = useMemo(
    () => (data ? Object.entries(data.byCategory).sort((a, b) => b[1] - a[1]) : []),
    [data]
  );
  const liveCount = data ? data.rows.filter((r) => !r.voided).length : 0;

  return (
    <Screen
      title={t("expenses.title")}
      action={<Button size="sm" icon="plus" label={t("expenses.add")} onPress={openAdd} />}
    >
      <Section>
        <MonthStepper value={month} onChange={setMonth} />
      </Section>

      {data === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={100} />
          <Skeleton height={160} />
          <Skeleton height={240} />
        </View>
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <Card style={{ gap: space.xs, padding: space.xl }}>
                <Text variant="label" color="textMuted">
                  {t("expenses.total")}
                </Text>
                <Text latin tabular variant="figure">
                  {money(data.total)}
                </Text>
                <Text variant="caption" color="textMuted">
                  {t("expenses.entries", { count: liveCount })}
                </Text>
              </Card>
            </Section>
          </Reveal>

          {categories.length > 0 ? (
            <Reveal index={1}>
              <Section title={t("expenses.byCategory")}>
                <Card style={{ gap: space.lg }}>
                  {categories.map(([c, sum]) => (
                    <View key={c} style={{ gap: space.xs + 2 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
                        <Text variant="label" weight="medium">
                          {catLabel(c)}
                        </Text>
                        <Text latin tabular variant="label" weight="semibold">
                          {money(sum)}
                        </Text>
                      </View>
                      <Progress value={data.total > 0 ? sum / data.total : 0} />
                    </View>
                  ))}
                </Card>
              </Section>
            </Reveal>
          ) : null}

          <Reveal index={2}>
            <Section title={t("expenses.list")}>
              {data.rows.length === 0 ? (
                <EmptyState
                  icon="trending-down"
                  title={t("expenses.empty")}
                  body={t("expenses.emptyBody")}
                  action={<Button icon="plus" label={t("expenses.add")} onPress={openAdd} />}
                />
              ) : (
                <ListGroup>
                  {data.rows.map((r) => (
                    <View key={r._id} style={{ padding: space.lg, gap: space.sm }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space.md }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            weight="semibold"
                            color={r.voided ? "textFaint" : "text"}
                            style={r.voided ? { textDecorationLine: "line-through" } : undefined}
                          >
                            {r.description}
                          </Text>
                          <Text variant="caption" color="textMuted">
                            {dateLabel(r.date)} · {catLabel(r.category)}
                          </Text>
                        </View>
                        <Text
                          latin
                          tabular
                          weight="semibold"
                          color={r.voided ? "textFaint" : "text"}
                          style={r.voided ? { textDecorationLine: "line-through" } : undefined}
                        >
                          {money(r.amount)}
                        </Text>
                      </View>
                      {r.voided ? (
                        <Text variant="caption" color="danger">
                          {t("expenses.voidedReason", { reason: r.voidReason ?? "—" })}
                        </Text>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          label={t("expenses.void")}
                          onPress={() => {
                            setReason("");
                            setError(null);
                            setVoiding({ _id: r._id, description: r.description, amount: r.amount });
                          }}
                        />
                      )}
                    </View>
                  ))}
                </ListGroup>
              )}
            </Section>
          </Reveal>
        </>
      )}

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("expenses.add")}
        subtitle={t("expenses.addBody")}
        footer={<Button full label={t("expenses.add")} loading={saving} onPress={submitAdd} />}
      >
        <DateField label={t("expenses.date")} value={date} onChange={setDate} max={today} />
        <Select
          label={t("expenses.category")}
          placeholder={t("expenses.categoryPlaceholder")}
          value={category}
          onChange={setCategory}
          options={CATEGORIES.map((c) => ({ value: c as string, label: catLabel(c) }))}
        />
        <Input
          label={t("expenses.description")}
          placeholder={t("expenses.descriptionPlaceholder")}
          value={description}
          onChangeText={setDescription}
          maxLength={120}
        />
        <Input
          label={t("expenses.amount")}
          value={amount}
          onChangeText={(v) => setAmount(digits(v))}
          keyboardType="number-pad"
          latin
        />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </Sheet>

      <Sheet
        open={!!voiding}
        onClose={() => setVoiding(null)}
        title={t("expenses.voidTitle")}
        subtitle={voiding ? t("expenses.voidBody", { description: voiding.description, amount: money(voiding.amount) }) : undefined}
        footer={<Button full variant="danger" label={t("expenses.voidTitle")} loading={saving} onPress={submitVoid} />}
      >
        <Input label={t("expenses.reason")} hint={t("expenses.reasonHint")} value={reason} onChangeText={setReason} maxLength={200} />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </Sheet>
    </Screen>
  );
}
