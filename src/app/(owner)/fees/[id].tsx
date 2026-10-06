import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chips,
  DateField,
  Divider,
  EmptyState,
  Icon,
  Input,
  ListGroup,
  ListRow,
  Progress,
  Reveal,
  Screen,
  Section,
  Segmented,
  Sheet,
  Skeleton,
  Text,
  useToast,
  type Tone,
} from "../../../components/ui";
import { useAcademy, useAcademyId } from "../../../context/AcademyContext";
import { useI18n, type TKey } from "../../../i18n/I18nProvider";
import { errorMessage } from "../../../lib/errors";
import { useToday } from "../../../lib/useToday";
import { openWhatsApp } from "../../../lib/whatsapp";
import { space } from "../../../theme/tokens";

type Status = "paid" | "partial" | "due" | "overdue" | "voided";
type Method = "cash" | "bank" | "jazzcash" | "easypaisa";

const TONE: Record<Status, Tone> = {
  paid: "success",
  partial: "warning",
  due: "neutral",
  overdue: "danger",
  voided: "neutral",
};
const METHODS: Method[] = ["cash", "bank", "jazzcash", "easypaisa"];
const digits = (s: string) => s.replace(/\D/g, "");

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "danger" | "success" }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md }}>
      <Text color="textMuted">{label}</Text>
      <Text latin tabular weight={strong ? "bold" : "medium"} variant={strong ? "heading" : "body"} color={tone ?? "text"}>
        {value}
      </Text>
    </View>
  );
}

export default function InvoiceDetail() {
  const { id, pay } = useLocalSearchParams<{ id: string; pay?: string }>();
  const { t, money, monthLabel, dateLabel } = useI18n();
  const toast = useToast();
  const { academy } = useAcademy();
  const academyId = useAcademyId();
  const { today } = useToday();

  const recordPayment = useMutation(api.fees.recordPayment);
  const voidPayment = useMutation(api.fees.voidPayment);
  const voidInvoice = useMutation(api.fees.voidInvoice);
  const setDiscount = useMutation(api.fees.setDiscount);

  const data = useQuery(api.fees.getInvoice, { academyId, invoiceId: id as Id<"invoices">, today });

  // Sheets
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("cash");
  const [date, setDate] = useState(today);
  const [done, setDone] = useState<{ paymentId: string; receiptNo: number; amount: number } | null>(null);

  const [voidingPayment, setVoidingPayment] = useState<{ _id: Id<"payments">; receiptNo: number; amount: number } | null>(null);
  const [voidInvoiceOpen, setVoidInvoiceOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState("");

  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const inv = data?.invoice;
  const student = data?.student ?? null;
  const voided = inv?.status === "voided";
  const canPay = !!inv && !voided && inv.balance > 0;

  function openPay() {
    if (!inv) return;
    setAmount(String(inv.balance));
    setMethod("cash");
    setDate(today);
    setError(null);
    setPayOpen(true);
  }

  // Arrive from "Record payment" with ?pay=1 → open the sheet once.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (pay === "1" && canPay && !autoOpened.current) {
      autoOpened.current = true;
      openPay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay, canPay]);

  function resetForms() {
    setReason("");
    setError(null);
    setSaving(false);
  }

  async function submitPayment() {
    if (!inv) return;
    const a = Number(amount);
    if (!a || a <= 0) return setError(t("fees.amountInvalid"));
    if (a > inv.balance) return setError(t("fees.amountTooHigh", { amount: money(inv.balance) }));
    setSaving(true);
    setError(null);
    try {
      const res = await recordPayment({ academyId, invoiceId: inv._id, amount: a, method, date });
      setPayOpen(false);
      setDone({ paymentId: res.paymentId, receiptNo: res.receiptNo, amount: a });
      toast(t("fees.recorded", { receipt: res.receiptNo }));
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  async function submitVoidPayment() {
    if (!voidingPayment) return;
    if (reason.trim().length < 3) return setError(t("fees.reasonShort"));
    setSaving(true);
    setError(null);
    try {
      await voidPayment({ academyId, paymentId: voidingPayment._id, reason: reason.trim() });
      setVoidingPayment(null);
      toast(t("fees.paymentVoided"));
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  async function submitVoidInvoice() {
    if (!inv) return;
    if (reason.trim().length < 3) return setError(t("fees.reasonShort"));
    setSaving(true);
    setError(null);
    try {
      await voidInvoice({ academyId, invoiceId: inv._id, reason: reason.trim() });
      setVoidInvoiceOpen(false);
      toast(t("fees.invoiceVoided"));
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  async function submitDiscount() {
    if (!inv) return;
    const d = Number(discountValue || "0");
    if (d > inv.amount) return setError(t("fees.discountInvalid"));
    if (reason.trim().length < 3) return setError(t("fees.reasonShort"));
    setSaving(true);
    setError(null);
    try {
      await setDiscount({ academyId, invoiceId: inv._id, discount: d, reason: reason.trim() });
      setDiscountOpen(false);
      toast(t("fees.discountSaved"));
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  function sendReminder() {
    if (!inv || !student) return;
    const academyName = academy?.name ?? "";
    const text =
      inv.status === "overdue"
        ? t("whatsapp.overdue", { name: student.name, amount: money(inv.balance), academy: academyName })
        : t("whatsapp.reminder", {
            name: student.name,
            amount: money(inv.balance),
            month: monthLabel(inv.month),
            date: dateLabel(inv.dueDate),
            academy: academyName,
          });
    void openWhatsApp(student.parentPhone, text);
  }

  function sendReceipt() {
    if (!done || !student) return;
    void openWhatsApp(
      student.parentPhone,
      t("whatsapp.received", { amount: money(done.amount), name: student.name, receipt: done.receiptNo, academy: academy?.name ?? "" })
    );
  }

  const halfAmount = inv ? Math.max(1, Math.ceil(inv.balance / 2)) : 0;
  const net = inv ? inv.amount - inv.discount : 0;

  return (
    <Screen narrow back="/fees" title={inv ? monthLabel(inv.month) : ""} subtitle={t("fees.invoice")}>
      {data === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={70} />
          <Skeleton height={200} />
          <Skeleton height={120} />
        </View>
      ) : !inv ? (
        <EmptyState icon="alert-circle" title={t("common.somethingWrong")} />
      ) : (
        <>
          {voided ? (
            <Reveal index={0}>
              <Section>
                <Card tone="muted" style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
                  <Icon name="slash" size={20} color="danger" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight="semibold" color="danger">
                      {t("fees.voidedBanner")}
                    </Text>
                    {inv.voidReason ? (
                      <Text variant="caption" color="textMuted">
                        {t("fees.voidedReason", { reason: inv.voidReason })}
                      </Text>
                    ) : null}
                  </View>
                </Card>
              </Section>
            </Reveal>
          ) : null}

          {student ? (
            <Reveal index={0}>
              <Section>
                <ListGroup>
                  {[
                    <ListRow
                      key="student"
                      leading={<Avatar name={student.name} size={44} />}
                      title={student.name}
                      subtitle={`${student.code} · ${student.fatherName}`}
                      onPress={() => router.push(`/students/${student._id}` as never)}
                    />,
                  ]}
                </ListGroup>
              </Section>
            </Reveal>
          ) : null}

          <Reveal index={1}>
            <Section>
              <Card style={{ gap: space.md, padding: space.xl }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md, flexWrap: "wrap" }}>
                  <Badge label={t(`status.${inv.status}` as TKey)} tone={TONE[inv.status]} />
                  <Text variant="caption" color="textMuted">
                    {t("fees.dueDate", { date: dateLabel(inv.dueDate) })}
                  </Text>
                </View>
                {!voided ? <Progress value={net > 0 ? inv.paid / net : 0} tone={inv.status === "paid" ? "success" : "accent"} /> : null}
                <Divider />
                <Line label={t("fees.amount")} value={money(inv.amount)} />
                {inv.discount > 0 ? <Line label={t("fees.discount")} value={`- ${money(inv.discount)}`} /> : null}
                <Line label={t("fees.paid")} value={money(inv.paid)} tone={inv.paid > 0 ? "success" : undefined} />
                <Divider />
                <Line label={t("fees.balance")} value={money(inv.balance)} strong tone={inv.balance > 0 ? (inv.status === "overdue" ? "danger" : undefined) : "success"} />
              </Card>
            </Section>
          </Reveal>

          {!voided ? (
            <Reveal index={2}>
              <Section>
                <View style={{ gap: space.sm }}>
                  {canPay ? <Button full size="lg" icon="dollar-sign" label={t("fees.recordPayment")} onPress={openPay} /> : null}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                    {canPay && student?.parentPhone ? (
                      <Button variant="secondary" size="sm" icon="message-circle" label={t("fees.sendReminder")} onPress={sendReminder} />
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="percent"
                      label={t("fees.changeDiscount")}
                      onPress={() => {
                        resetForms();
                        setDiscountValue(String(inv.discount));
                        setDiscountOpen(true);
                      }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      icon="slash"
                      label={t("fees.voidInvoice")}
                      onPress={() => {
                        resetForms();
                        setVoidInvoiceOpen(true);
                      }}
                    />
                  </View>
                </View>
              </Section>
            </Reveal>
          ) : null}

          <Reveal index={3}>
            <Section title={t("fees.payments")}>
              {data.payments.length === 0 ? (
                <Card>
                  <Text weight="semibold">{t("fees.noPayments")}</Text>
                  <Text variant="caption" color="textMuted">
                    {t("fees.noPaymentsBody")}
                  </Text>
                </Card>
              ) : (
                <ListGroup>
                  {data.payments.map((p) => (
                    <View key={p._id} style={{ padding: space.lg, gap: space.sm }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text latin variant="label" weight="semibold" tabular color={p.voided ? "textFaint" : "text"} style={p.voided ? { textDecorationLine: "line-through" } : undefined}>
                            #{p.receiptNo}
                          </Text>
                          <Text variant="caption" color="textMuted">
                            {dateLabel(p.date)} · {t(`fees.method_${p.method}` as TKey)}
                          </Text>
                        </View>
                        <Text
                          latin
                          weight="semibold"
                          tabular
                          color={p.voided ? "textFaint" : "success"}
                          style={p.voided ? { textDecorationLine: "line-through" } : undefined}
                        >
                          {money(p.amount)}
                        </Text>
                      </View>
                      {p.voided ? (
                        <Text variant="caption" color="danger">
                          {t("fees.voidedReason", { reason: p.voidReason ?? "" })}
                        </Text>
                      ) : null}
                      {!p.voided ? (
                        <View style={{ flexDirection: "row", gap: space.sm }}>
                          <Button variant="secondary" size="sm" icon="file-text" label={t("fees.receipt")} onPress={() => router.push(`/receipt/${p._id}` as never)} />
                          <Button
                            variant="danger"
                            size="sm"
                            label={t("fees.void")}
                            onPress={() => {
                              resetForms();
                              setVoidingPayment({ _id: p._id, receiptNo: p.receiptNo, amount: p.amount });
                            }}
                          />
                        </View>
                      ) : null}
                    </View>
                  ))}
                </ListGroup>
              )}
            </Section>
          </Reveal>
        </>
      )}

      {/* Record payment */}
      <Sheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={t("fees.recordPayment")}
        subtitle={inv && student ? `${student.name} · ${monthLabel(inv.month)}` : undefined}
        footer={<Button full label={t("fees.recordPayment")} loading={saving} onPress={submitPayment} />}
      >
        <Input
          label={t("fees.payAmount")}
          value={amount}
          onChangeText={(v) => setAmount(digits(v))}
          keyboardType="number-pad"
          latin
        />
        {inv ? (
          <Chips
            value={Number(amount) === inv.balance ? "full" : Number(amount) === halfAmount ? "half" : ("" as never)}
            onChange={(v) => setAmount(String(v === "full" ? inv.balance : halfAmount))}
            options={[
              { value: "full", label: `${t("fees.fullBalance")} · ${money(inv.balance)}` },
              ...(inv.balance > 1 ? [{ value: "half", label: `${t("fees.halfBalance")} · ${money(halfAmount)}` }] : []),
            ]}
          />
        ) : null}
        <View style={{ gap: space.xs + 2 }}>
          <Text variant="label" color="textMuted">
            {t("fees.method")}
          </Text>
          <Segmented
            value={method}
            onChange={setMethod}
            options={METHODS.map((m) => ({ value: m, label: t(m === "bank" ? "fees.methodShort_bank" : (`fees.method_${m}` as TKey)) }))}
          />
        </View>
        <DateField label={t("fees.paymentDate")} value={date} onChange={setDate} max={today} />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </Sheet>

      {/* After a payment */}
      <Sheet
        open={!!done}
        onClose={() => setDone(null)}
        title={t("fees.paymentSaved")}
        subtitle={done ? t("fees.paymentSavedBody", { receipt: done.receiptNo, amount: money(done.amount) }) : undefined}
        footer={<Button full variant="ghost" label={t("common.done")} onPress={() => setDone(null)} />}
      >
        <Button
          full
          icon="file-text"
          label={t("fees.viewReceipt")}
          onPress={() => {
            const target = done?.paymentId;
            setDone(null);
            if (target) router.push(`/receipt/${target}` as never);
          }}
        />
        {student?.parentPhone ? <Button full variant="secondary" icon="message-circle" label={t("whatsapp.send")} onPress={sendReceipt} /> : null}
      </Sheet>

      {/* Void payment */}
      <Sheet
        open={!!voidingPayment}
        onClose={() => setVoidingPayment(null)}
        title={t("fees.voidPayment")}
        subtitle={voidingPayment ? t("fees.voidPaymentBody", { receipt: voidingPayment.receiptNo, amount: money(voidingPayment.amount) }) : undefined}
        footer={<Button full variant="danger" label={t("fees.voidPayment")} loading={saving} onPress={submitVoidPayment} />}
      >
        <Input label={t("fees.reason")} hint={t("fees.reasonHint")} value={reason} onChangeText={setReason} maxLength={200} />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </Sheet>

      {/* Void invoice */}
      <Sheet
        open={voidInvoiceOpen}
        onClose={() => setVoidInvoiceOpen(false)}
        title={t("fees.voidInvoice")}
        subtitle={inv ? (inv.paid > 0 ? t("fees.voidInvoiceHasPayments") : t("fees.voidInvoiceBody", { month: monthLabel(inv.month) })) : undefined}
        footer={<Button full variant="danger" label={t("fees.voidInvoice")} loading={saving} disabled={!!inv && inv.paid > 0} onPress={submitVoidInvoice} />}
      >
        {inv && inv.paid === 0 ? (
          <Input label={t("fees.reason")} hint={t("fees.reasonHint")} value={reason} onChangeText={setReason} maxLength={200} />
        ) : null}
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </Sheet>

      {/* Change discount */}
      <Sheet
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
        title={t("fees.changeDiscount")}
        subtitle={inv ? `${t("fees.amount")}: ${money(inv.amount)}` : undefined}
        footer={<Button full label={t("common.save")} loading={saving} onPress={submitDiscount} />}
      >
        <Input
          label={t("fees.discount")}
          value={discountValue}
          onChangeText={(v) => setDiscountValue(digits(v))}
          keyboardType="number-pad"
          placeholder="0"
          latin
        />
        <Input label={t("fees.reason")} hint={t("fees.discountReasonHint")} value={reason} onChangeText={setReason} maxLength={200} />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </Sheet>
    </Screen>
  );
}
