import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chips,
  EmptyState,
  Icon,
  Input,
  ListGroup,
  ListRow,
  MonthStepper,
  Progress,
  Reveal,
  Screen,
  Section,
  Skeleton,
  Sheet,
  Text,
  useToast,
  type Tone,
} from "../../../components/ui";
import { useAcademyId } from "../../../context/AcademyContext";
import { useI18n, type TKey } from "../../../i18n/I18nProvider";
import { errorMessage } from "../../../lib/errors";
import { useToday } from "../../../lib/useToday";
import { space } from "../../../theme/tokens";

type Status = "paid" | "partial" | "due" | "overdue" | "voided";
type Filter = "all" | Status;

const TONE: Record<Status, Tone> = {
  paid: "success",
  partial: "warning",
  due: "neutral",
  overdue: "danger",
  voided: "neutral",
};

const FILTERS: Filter[] = ["all", "overdue", "due", "partial", "paid", "voided"];

const digits = (s: string) => s.replace(/\D/g, "");

type PickedStudent = { _id: Id<"students">; name: string; code: string; monthlyFee: number };

/** Record payment / add invoice: choose a student, then one of their invoices. */
function RecordPaymentSheet({ open, onClose, defaultMonth }: { open: boolean; onClose: () => void; defaultMonth: string }) {
  const { t, money, monthLabel } = useI18n();
  const academyId = useAcademyId();
  const { today } = useToday();
  const toast = useToast();
  const createInvoice = useMutation(api.fees.createInvoice);

  const [step, setStep] = useState<"student" | "invoices" | "new">("student");
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState<PickedStudent | null>(null);

  const [month, setMonth] = useState(defaultMonth);
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("student");
      setTerm("");
      setSearch("");
      setStudent(null);
      setError(null);
      setMonth(defaultMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const id = setTimeout(() => setSearch(term.trim()), 250);
    return () => clearTimeout(id);
  }, [term]);

  const students = usePaginatedQuery(
    api.students.list,
    open && step === "student" ? { academyId, status: "active", search: search || undefined } : "skip",
    { initialNumItems: 20 }
  );
  const invoices = useQuery(
    api.fees.openInvoicesForStudent,
    open && step === "invoices" && student ? { academyId, studentId: student._id, today } : "skip"
  );

  function pick(s: PickedStudent) {
    setStudent(s);
    setStep("invoices");
  }

  function go(invoiceId: string, pay: boolean) {
    onClose();
    router.push((pay ? `/fees/${invoiceId}?pay=1` : `/fees/${invoiceId}`) as never);
  }

  function startNew() {
    if (!student) return;
    setAmount(String(student.monthlyFee));
    setDiscount("");
    setError(null);
    setStep("new");
  }

  async function submitNew() {
    if (!student) return;
    const a = Number(amount);
    const d = Number(discount || "0");
    if (!a || a <= 0) return setError(t("fees.amountInvalid"));
    if (d > a) return setError(t("fees.discountInvalid"));
    setSaving(true);
    setError(null);
    try {
      const id = await createInvoice({ academyId, studentId: student._id, month, amount: a, discount: d });
      toast(t("fees.invoiceCreated"));
      go(id, false);
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  const title =
    step === "student" ? t("fees.recordPayment") : step === "invoices" ? t("fees.openInvoices") : t("fees.newInvoiceTitle");
  const subtitle =
    step === "student"
      ? t("fees.pickStudentBody")
      : student
        ? step === "new"
          ? t("fees.newInvoiceBody", { name: student.name })
          : t("fees.openInvoicesFor", { name: student.name, code: student.code })
        : undefined;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={step === "new" ? <Button full label={t("fees.addInvoice")} loading={saving} onPress={submitNew} /> : undefined}
    >
      {step === "student" ? (
        <>
          <Input icon="search" value={term} onChangeText={setTerm} placeholder={t("fees.searchStudent")} autoCapitalize="none" />
          {students.status === "LoadingFirstPage" ? (
            <View style={{ gap: space.sm }}>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </View>
          ) : students.results.length === 0 ? (
            <Text color="textMuted" align="center">
              {t("fees.noStudents")}
            </Text>
          ) : (
            <>
              <ListGroup>
                {students.results.map((s) => (
                  <ListRow
                    key={s._id}
                    leading={<Avatar name={s.name} size={36} />}
                    title={s.name}
                    subtitle={`${s.code} · ${s.batchName}`}
                    onPress={() => pick({ _id: s._id, name: s.name, code: s.code, monthlyFee: s.monthlyFee })}
                  />
                ))}
              </ListGroup>
              {students.status === "CanLoadMore" ? (
                <Button variant="secondary" size="sm" label={t("fees.loadMore")} onPress={() => students.loadMore(20)} />
              ) : null}
            </>
          )}
        </>
      ) : null}

      {step === "invoices" ? (
        <>
          {invoices === undefined ? (
            <View style={{ gap: space.sm }}>
              <Skeleton height={56} />
              <Skeleton height={56} />
            </View>
          ) : invoices.length === 0 ? (
            <View style={{ gap: space.xs }}>
              <Text weight="semibold">{t("fees.noOpenInvoices")}</Text>
              <Text color="textMuted">{t("fees.noOpenInvoicesBody")}</Text>
            </View>
          ) : (
            <ListGroup>
              {invoices.map((i) => (
                <ListRow
                  key={i._id}
                  title={monthLabel(i.month)}
                  subtitle={t("fees.balanceNote", { amount: money(i.balance) })}
                  trailing={<Badge label={t(`status.${i.status}` as TKey)} tone={TONE[i.status]} />}
                  onPress={() => go(i._id, true)}
                />
              ))}
            </ListGroup>
          )}
          <Button variant="secondary" icon="file-plus" label={t("fees.addInvoice")} onPress={startNew} />
          <Button variant="ghost" size="sm" label={t("fees.changeStudent")} onPress={() => setStep("student")} />
        </>
      ) : null}

      {step === "new" ? (
        <>
          <View style={{ gap: space.xs + 2 }}>
            <Text variant="label" color="textMuted">
              {t("fees.invoiceMonth")}
            </Text>
            <MonthStepper value={month} onChange={setMonth} />
          </View>
          <Input
            label={t("fees.invoiceAmount")}
            value={amount}
            onChangeText={(v) => setAmount(digits(v))}
            keyboardType="number-pad"
            latin
          />
          <Input
            label={t("fees.invoiceDiscount")}
            value={discount}
            onChangeText={(v) => setDiscount(digits(v))}
            keyboardType="number-pad"
            placeholder="0"
            latin
          />
          {error ? (
            <Text variant="caption" color="danger">
              {error}
            </Text>
          ) : null}
          <Button variant="ghost" size="sm" label={t("common.back")} onPress={() => setStep("invoices")} />
        </>
      ) : null}
    </Sheet>
  );
}

export default function Fees() {
  const { t, money, monthLabel } = useI18n();
  const toast = useToast();
  const academyId = useAcademyId();
  const { today, month: currentMonth } = useToday();
  const generate = useMutation(api.fees.generateMonth);

  const [month, setMonth] = useState(currentMonth);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const data = useQuery(api.fees.listMonth, { academyId, month, today });

  async function generateFees() {
    setGenerating(true);
    try {
      const res = await generate({ academyId, month });
      toast(res.created === 0 ? t("fees.allBilled") : t("fees.generated", { count: res.created }));
    } catch (e) {
      toast(errorMessage(e, t("common.somethingWrong")), "error");
    } finally {
      setGenerating(false);
    }
  }

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.rows.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q || r.studentName.toLowerCase().includes(q) || r.studentCode.toLowerCase().includes(q))
    );
  }, [data, filter, query]);

  const empty = data !== undefined && data.rows.length === 0;
  const ratio = data && data.expected > 0 ? data.collected / data.expected : 0;

  return (
    <Screen
      title={t("fees.title")}
      action={<Button size="sm" icon="plus" label={t("fees.recordPayment")} onPress={() => setPayOpen(true)} />}
    >
      <Section>
        <MonthStepper value={month} onChange={setMonth} />
      </Section>

      {data === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={170} />
          <Skeleton height={40} />
          <Skeleton height={260} />
        </View>
      ) : (
        <>
          {empty ? (
            <Reveal index={0}>
              <Section>
                <Card style={{ gap: space.lg, padding: space.xl, alignItems: "flex-start" }}>
                  <Icon name="file-plus" size={26} color="accent" />
                  <View style={{ gap: space.xs }}>
                    <Text variant="heading">{t("fees.generateMonth", { month: monthLabel(month) })}</Text>
                    <Text color="textMuted">{t("fees.generateBody")}</Text>
                  </View>
                  <Button size="lg" icon="zap" label={t("fees.generateMonth", { month: monthLabel(month) })} loading={generating} onPress={generateFees} />
                </Card>
              </Section>
            </Reveal>
          ) : (
            <>
              <Reveal index={0}>
                <Section>
                  <Card style={{ gap: space.lg, padding: space.xl }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.md, flexWrap: "wrap" }}>
                      <View style={{ gap: space.xs }}>
                        <Text variant="label" color="textMuted">
                          {t("fees.collected")}
                        </Text>
                        <Text latin variant="figure" tabular>
                          {money(data.collected)}
                        </Text>
                        <Text variant="caption" color="textMuted">
                          {t("fees.ofExpected", { amount: money(data.expected) })}
                        </Text>
                      </View>
                      <View style={{ gap: space.xs, alignItems: "flex-end" }}>
                        <Text variant="label" color="textMuted">
                          {t("fees.outstanding")}
                        </Text>
                        <Text latin variant="heading" weight="bold" tabular color={data.outstanding > 0 ? "danger" : "success"}>
                          {money(data.outstanding)}
                        </Text>
                      </View>
                    </View>
                    <Progress value={ratio} tone={ratio >= 1 ? "success" : "accent"} />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                      {(["overdue", "due", "partial", "paid"] as const).map((s) => (
                        <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                          <Badge label={t(`status.${s}` as TKey)} tone={TONE[s]} />
                          <Text latin variant="label" weight="semibold" tabular>
                            {data.counts[s]}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="refresh-cw"
                      label={t("fees.generateMissing")}
                      loading={generating}
                      onPress={generateFees}
                    />
                  </Card>
                </Section>
              </Reveal>

              <Reveal index={1}>
                <Section>
                  <Chips
                    value={filter}
                    onChange={setFilter}
                    options={FILTERS.map((f) => ({
                      value: f,
                      label: `${f === "all" ? t("fees.filterAll") : t(`status.${f}` as TKey)} ${f === "all" ? data.rows.length : data.counts[f]}`,
                    }))}
                  />
                  <Input icon="search" value={query} onChangeText={setQuery} placeholder={t("fees.searchPlaceholder")} autoCapitalize="none" />
                </Section>
              </Reveal>

              <Reveal index={2}>
                <Section>
                  {rows.length === 0 ? (
                    <EmptyState icon="search" title={t("fees.noMatch")} body={t("fees.noMatchBody")} />
                  ) : (
                    <ListGroup>
                      {rows.map((r) => {
                        const net = r.amount - r.discount;
                        const voided = r.status === "voided";
                        return (
                          <ListRow
                            key={r._id}
                            leading={<Avatar name={r.studentName} size={40} />}
                            title={r.studentName}
                            subtitle={r.discount > 0 ? `${r.studentCode} · ${t("fees.discountNote", { amount: money(r.discount) })}` : r.studentCode}
                            onPress={() => router.push(`/fees/${r._id}` as never)}
                            chevron={false}
                            trailing={
                              <View style={{ alignItems: "flex-end", gap: 3 }}>
                                <Text
                                  latin
                                  variant="label"
                                  weight="semibold"
                                  tabular
                                  color={voided ? "textFaint" : "text"}
                                  style={voided ? { textDecorationLine: "line-through" } : undefined}
                                >
                                  {money(net)}
                                </Text>
                                {!voided && r.balance > 0 ? (
                                  <Text latin variant="caption" color={r.status === "overdue" ? "danger" : "textMuted"} tabular>
                                    {t("fees.balanceNote", { amount: money(r.balance) })}
                                  </Text>
                                ) : null}
                                <Badge label={t(`status.${r.status}` as TKey)} tone={TONE[r.status]} />
                              </View>
                            }
                          />
                        );
                      })}
                    </ListGroup>
                  )}
                </Section>
              </Reveal>
            </>
          )}
        </>
      )}

      <RecordPaymentSheet open={payOpen} onClose={() => setPayOpen(false)} defaultMonth={month} />
    </Screen>
  );
}
