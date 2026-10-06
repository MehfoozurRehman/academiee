import { useMemo, useState } from "react";
import { Linking, Platform, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Avatar,
  Badge,
  Button,
  Card,
  DateField,
  Divider,
  EmptyState,
  Icon,
  Input,
  ListGroup,
  ListRow,
  Pressable,
  Progress,
  Reveal,
  Screen,
  Section,
  Segmented,
  Select,
  Skeleton,
  Sheet,
  Text,
  useToast,
  type IconName,
  type Tone,
} from "../../../components/ui";
import { useAcademy, useAcademyId } from "../../../context/AcademyContext";
import { useI18n } from "../../../i18n/I18nProvider";
import { errorMessage } from "../../../lib/errors";
import { useToday } from "../../../lib/useToday";
import { openWhatsApp } from "../../../lib/whatsapp";
import { useTheme } from "../../../theme/ThemeProvider";
import { radius, space } from "../../../theme/tokens";

type Tab = "fees" | "attendance" | "results";
type Confirm = "left" | "graduated" | "active" | "delete";
type SignInResult = { code: string; academyCode: string; studentCode: string; studentName: string; phone: string };

const PHONE_RE = /^[0-9+\-\s]{7,16}$/;
const digits = (s: string) => s.replace(/\D/g, "");

const STATUS_TONE: Record<string, Tone> = { active: "success", left: "neutral", graduated: "accent" };
const FEE_TONE: Record<string, Tone> = { paid: "success", partial: "warning", due: "neutral", overdue: "danger", voided: "neutral" };
const ATT_TONE: Record<string, Tone> = { present: "success", late: "warning", absent: "danger" };

function RoundAction({ icon, tone, label, onPress }: { icon: IconName; tone: "success" | "accent"; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tone === "success" ? colors.successSoft : colors.accentSoft,
      }}
    >
      <Icon name={icon} size={18} color={tone} />
    </Pressable>
  );
}

function PhoneRow({ label, phone, whatsappText }: { label: string; phone: string; whatsappText: string }) {
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
        <Text latin weight="semibold" tabular>
          {phone}
        </Text>
      </View>
      <RoundAction icon="message-circle" tone="success" label={t("whatsapp.send")} onPress={() => openWhatsApp(phone, whatsappText)} />
      <RoundAction icon="phone" tone="accent" label={t("students.call")} onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`)} />
    </View>
  );
}

function ActionRow({ icon, label, onPress, danger }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <ListRow
      leading={<Icon name={icon} size={18} color={danger ? "danger" : "textMuted"} />}
      title={label}
      onPress={onPress}
    />
  );
}

function CodeLine({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text
        latin
        tabular
        variant={big ? "figure" : "body"}
        weight="bold"
        selectable
        style={big ? { letterSpacing: 6 } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

export default function StudentProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = id as Id<"students">;
  const { t, money, monthLabel, dateLabel, dayName } = useI18n();
  const { colors } = useTheme();
  const toast = useToast();
  const { academy } = useAcademy();
  const academyId = useAcademyId();
  const { today } = useToday();

  const data = useQuery(api.students.get, { academyId, studentId, today });
  const batches = useQuery(api.classes.listBatches, { academyId });

  const update = useMutation(api.students.update);
  const moveBatch = useMutation(api.students.moveBatch);
  const setStatus = useMutation(api.students.setStatus);
  const removeMistake = useMutation(api.students.removeMistake);
  const issueCode = useMutation(api.students.issueSignInCode);

  const [tab, setTab] = useState<Tab>("fees");

  // Edit sheet
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", fatherName: "", gender: "male" as "male" | "female", parentPhone: "", phone: "", address: "", fee: "", admissionDate: today });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  // Move sheet
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTo, setMoveTo] = useState<string | null>(null);
  const [moveError, setMoveError] = useState("");
  const [moving, setMoving] = useState(false);

  // Confirm sheet
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [confirming, setConfirming] = useState(false);

  // Sign-in
  const [issuing, setIssuing] = useState(false);
  const [signIn, setSignIn] = useState<SignInResult | null>(null);
  const [signInError, setSignInError] = useState("");

  const moveOptions = useMemo(
    () =>
      (batches ?? [])
        .filter((b) => b._id !== data?.student.batchId)
        .map((b) => {
          const full = b.enrolled >= b.capacity;
          return {
            value: b._id as string,
            label: `${b.name} · ${b.courseName}`,
            hint: full
              ? t("students.batchFullHint", { course: b.courseName, capacity: b.capacity })
              : t("students.batchHint", { course: b.courseName, enrolled: b.enrolled, capacity: b.capacity }),
          };
        }),
    [batches, data?.student.batchId, t]
  );

  if (data === undefined) {
    return (
      <Screen narrow back="/students">
        <View style={{ gap: space.md }}>
          <Skeleton height={190} />
          <Skeleton height={90} />
          <Skeleton height={44} />
          <Skeleton height={200} />
        </View>
      </Screen>
    );
  }
  if (data === null) {
    return (
      <Screen narrow back="/students">
        <EmptyState
          icon="user-x"
          title={t("students.notFound")}
          body={t("students.notFoundBody")}
          action={<Button variant="secondary" label={t("students.backToStudents")} onPress={() => router.replace("/students")} />}
        />
      </Screen>
    );
  }

  const { student, batch, courseName, invoices, attendance, results } = data;
  const isActive = student.status === "active";
  const statusLabel = t(`students.${student.status}` as never);
  const hasHistory = invoices.length > 0 || attendance.recent.length > 0 || results.length > 0;
  const oldestUnpaid = [...invoices]
    .reverse()
    .find((i) => i.status !== "paid" && i.status !== "voided" && i.balance > 0);
  const academyName = academy?.name ?? "";

  function openEdit() {
    setForm({
      name: student.name,
      fatherName: student.fatherName,
      gender: student.gender,
      parentPhone: student.parentPhone,
      phone: student.phone ?? "",
      address: student.address ?? "",
      fee: String(student.monthlyFee),
      admissionDate: student.admissionDate,
    });
    setFormErrors({});
    setEditError("");
    setEditOpen(true);
  }

  async function saveEdit() {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = t("students.errName");
    if (form.fatherName.trim().length < 2) next.fatherName = t("students.errFather");
    if (!PHONE_RE.test(form.parentPhone.trim())) next.parentPhone = t("students.errParentPhone");
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) next.phone = t("students.errStudentPhone");
    if (form.fee === "") next.fee = t("students.errFee");
    setFormErrors(next);
    setEditError("");
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await update({
        academyId,
        studentId,
        name: form.name,
        fatherName: form.fatherName,
        gender: form.gender,
        parentPhone: form.parentPhone,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        monthlyFee: Number(form.fee),
        admissionDate: form.admissionDate,
      });
      setEditOpen(false);
      toast(t("students.saved"));
    } catch (e) {
      setEditError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  function pickMove(value: string) {
    const b = batches?.find((x) => x._id === value);
    if (b && b.enrolled >= b.capacity) {
      setMoveError(t("students.batchFull"));
      return;
    }
    setMoveError("");
    setMoveTo(value);
  }

  async function saveMove() {
    if (!moveTo) {
      setMoveError(t("students.errBatch"));
      return;
    }
    setMoving(true);
    setMoveError("");
    try {
      await moveBatch({ academyId, studentId, batchId: moveTo as Id<"batches"> });
      const target = batches?.find((b) => b._id === moveTo);
      setMoveOpen(false);
      toast(t("students.moved", { batch: target?.name ?? "" }));
    } catch (e) {
      setMoveError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setMoving(false);
    }
  }

  function ask(kind: Confirm) {
    setConfirmError("");
    setConfirm(kind);
  }

  async function runConfirm() {
    if (!confirm) return;
    setConfirming(true);
    setConfirmError("");
    try {
      if (confirm === "delete") {
        await removeMistake({ academyId, studentId });
        toast(t("students.deleted"));
        setConfirm(null);
        router.replace("/students");
        return;
      }
      await setStatus({ academyId, studentId, status: confirm });
      toast(t("students.statusChanged", { name: student.name, status: t(`students.${confirm}` as never).toLowerCase() }));
      setConfirm(null);
    } catch (e) {
      setConfirmError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setConfirming(false);
    }
  }

  async function createCode() {
    setIssuing(true);
    setSignInError("");
    try {
      setSignIn(await issueCode({ academyId, studentId }));
    } catch (e) {
      setSignInError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setIssuing(false);
    }
  }

  const canCopy = Platform.OS === "web" && typeof navigator !== "undefined" && !!navigator.clipboard?.writeText;
  function copyDetails() {
    if (!signIn) return;
    const text = t("whatsapp.signInCode", {
      name: signIn.studentName,
      academyCode: signIn.academyCode,
      studentCode: signIn.studentCode,
      code: signIn.code,
    });
    void navigator.clipboard.writeText(text).then(() => toast(t("students.copied")));
  }

  const confirmCopy: Record<Confirm, { title: string; body: string; label: string; danger: boolean }> = {
    left: { title: t("students.confirmLeftTitle", { name: student.name }), body: t("students.confirmLeftBody"), label: t("students.markLeft"), danger: true },
    graduated: { title: t("students.confirmGraduatedTitle", { name: student.name }), body: t("students.confirmGraduatedBody"), label: t("students.markGraduated"), danger: false },
    active: { title: t("students.confirmRestoreTitle", { name: student.name }), body: t("students.confirmRestoreBody"), label: t("students.restore"), danger: false },
    delete: { title: t("students.deleteTitle", { name: student.name }), body: t("students.deleteBody"), label: t("students.deleteMistake"), danger: true },
  };
  const cc = confirm ? confirmCopy[confirm] : null;

  const setF = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Screen narrow back="/students">
      <Reveal index={0}>
        <Section>
          <Card style={{ gap: space.lg }}>
            <View style={{ flexDirection: "row", gap: space.lg, alignItems: "center" }}>
              <Avatar name={student.name} size={64} />
              <View style={{ flex: 1, gap: space.xs }}>
                <Text variant="title" numberOfLines={2}>
                  {student.name}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, alignItems: "center" }}>
                  <Badge label={student.code} tone="accent" />
                  <Badge label={statusLabel} tone={STATUS_TONE[student.status]} />
                </View>
              </View>
            </View>
            <View style={{ gap: 2 }}>
              <Text color="textMuted">{t("students.father", { name: student.fatherName })}</Text>
              {batch ? (
                <Text color="textMuted">
                  {batch.name}
                  {courseName ? ` · ${courseName}` : ""}
                </Text>
              ) : null}
              {batch ? <Text color="textMuted">{t("students.teacher", { name: batch.teacherName })}</Text> : null}
              <Text color="textMuted">
                {t("students.monthlyFeeLine", { amount: money(student.monthlyFee) })}
              </Text>
              {student.address ? <Text variant="caption" color="textFaint">{student.address}</Text> : null}
            </View>
            <Divider />
            <View style={{ gap: space.md }}>
              <PhoneRow
                label={t("students.parent")}
                phone={student.parentPhone}
                whatsappText={`Assalam o Alaikum. — ${academyName}`}
              />
              {student.phone ? (
                <PhoneRow label={t("students.student")} phone={student.phone} whatsappText={`Assalam o Alaikum ${student.name}. — ${academyName}`} />
              ) : null}
            </View>
          </Card>
        </Section>
      </Reveal>

      <Reveal index={1}>
        <Section>
          <Card
            tone={data.outstanding > 0 ? "accent" : "muted"}
            style={{ flexDirection: "row", alignItems: "center", gap: space.md, flexWrap: "wrap" }}
          >
            <View style={{ flex: 1, minWidth: 160, gap: space.xs }}>
              <Text variant="label" color={data.outstanding > 0 ? "onAccent" : "textMuted"} style={data.outstanding > 0 ? { opacity: 0.8 } : undefined}>
                {t("students.outstanding")}
              </Text>
              {data.outstanding > 0 ? (
                <Text latin variant="heading" weight="bold" color="onAccent" tabular>
                  {money(data.outstanding)}
                </Text>
              ) : (
                <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
                  <Icon name="check-circle" size={18} color="success" />
                  <Text weight="semibold">{t("students.allClear")}</Text>
                </View>
              )}
            </View>
            {oldestUnpaid ? (
              <Button
                variant="secondary"
                icon="dollar-sign"
                label={t("students.recordPayment")}
                onPress={() => router.push(`/fees/${oldestUnpaid._id}` as never)}
              />
            ) : null}
          </Card>
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "fees", label: t("students.tabFees") },
              { value: "attendance", label: t("students.tabAttendance") },
              { value: "results", label: t("students.tabResults") },
            ]}
          />
          <View style={{ marginTop: space.xs }}>
            {tab === "fees" ? (
              invoices.length === 0 ? (
                <EmptyState icon="file-text" title={t("students.noInvoices")} body={t("students.noInvoicesBody")} />
              ) : (
                <ListGroup>
                  {invoices.map((i) => {
                    const voided = i.status === "voided";
                    const strike = voided ? { textDecorationLine: "line-through" as const } : undefined;
                    return (
                      <ListRow
                        key={i._id}
                        title={monthLabel(i.month)}
                        subtitle={t("students.ofAmount", { amount: money(i.amount - i.discount) })}
                        trailing={
                          <View style={{ alignItems: "flex-end", gap: space.xs }}>
                            <Badge label={t(`status.${i.status}` as never)} tone={FEE_TONE[i.status]} />
                            {!voided && i.balance > 0 ? (
                              <Text latin variant="caption" color="textMuted" tabular style={strike}>
                                {t("students.balance", { amount: money(i.balance) })}
                              </Text>
                            ) : null}
                          </View>
                        }
                        onPress={() => router.push(`/fees/${i._id}` as never)}
                      />
                    );
                  })}
                </ListGroup>
              )
            ) : null}

            {tab === "attendance" ? (
              attendance.recent.length === 0 ? (
                <EmptyState icon="check-square" title={t("students.noAttendance")} body={t("students.noAttendanceBody")} />
              ) : (
                <View style={{ gap: space.lg }}>
                  <Card style={{ gap: space.md }}>
                    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.md }}>
                      <Text variant="label" color="textMuted">
                        {t("students.attendanceRate")}
                      </Text>
                      <Text latin variant="heading" weight="bold" tabular>
                        {attendance.rate === null ? "—" : `${attendance.rate}%`}
                      </Text>
                    </View>
                    <Progress
                      value={(attendance.rate ?? 0) / 100}
                      tone={(attendance.rate ?? 0) >= 85 ? "success" : (attendance.rate ?? 0) >= 70 ? "warning" : "danger"}
                    />
                  </Card>
                  <ListGroup>
                    {attendance.recent.map((a) => (
                      <ListRow
                        key={a.date}
                        title={dateLabel(a.date)}
                        trailing={<Badge label={t(`status.${a.status}` as never)} tone={ATT_TONE[a.status]} />}
                      />
                    ))}
                  </ListGroup>
                </View>
              )
            ) : null}

            {tab === "results" ? (
              results.length === 0 ? (
                <EmptyState icon="award" title={t("students.noResults")} body={t("students.noResultsBody")} />
              ) : (
                <ListGroup>
                  {results.map((r) => {
                    const pct = r.totalMarks > 0 ? Math.round((r.marks / r.totalMarks) * 100) : 0;
                    return (
                      <ListRow
                        key={`${r.testId}`}
                        title={r.title}
                        subtitle={r.date ? dateLabel(r.date) : undefined}
                        trailing={
                          <View style={{ alignItems: "flex-end" }}>
                            <Text latin weight="semibold" tabular>
                              {t("students.marksOf", { marks: r.marks, total: r.totalMarks })}
                            </Text>
                            <Text latin variant="caption" color={pct >= 50 ? "success" : "danger"} tabular>
                              {pct}%
                            </Text>
                          </View>
                        }
                      />
                    );
                  })}
                </ListGroup>
              )
            ) : null}
          </View>
        </Section>
      </Reveal>

      <Reveal index={3}>
        <Section title={t("students.signIn")}>
          <Card style={{ gap: space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
                <Icon name="key" size={18} color="accent" />
              </View>
              <Text color="textMuted" style={{ flex: 1 }}>
                {isActive ? t("students.signInBody") : t("students.signInInactive")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
              <Badge label={data.hasSignedIn ? t("students.hasSignedIn") : t("students.notSignedIn")} tone={data.hasSignedIn ? "success" : "neutral"} />
              {isActive ? (
                <Button
                  size="sm"
                  variant="secondary"
                  icon="key"
                  label={data.hasSignedIn ? t("students.newCode") : t("students.createCode")}
                  loading={issuing}
                  onPress={createCode}
                />
              ) : null}
            </View>
            {signInError ? (
              <Text variant="caption" color="danger">
                {signInError}
              </Text>
            ) : null}
          </Card>
        </Section>
      </Reveal>

      <Reveal index={4}>
        <Section title={t("students.manage")}>
          <ListGroup>
            {[
              <ActionRow key="edit" icon="edit-2" label={t("students.edit")} onPress={openEdit} />,
              ...(isActive
                ? [
                    <ActionRow
                      key="move"
                      icon="repeat"
                      label={t("students.moveBatch")}
                      onPress={() => {
                        setMoveTo(null);
                        setMoveError("");
                        setMoveOpen(true);
                      }}
                    />,
                    <ActionRow key="left" icon="log-out" label={t("students.markLeft")} onPress={() => ask("left")} />,
                    <ActionRow key="grad" icon="award" label={t("students.markGraduated")} onPress={() => ask("graduated")} />,
                  ]
                : [<ActionRow key="restore" icon="rotate-ccw" label={t("students.restore")} onPress={() => ask("active")} />]),
              ...(!hasHistory ? [<ActionRow key="delete" icon="trash-2" danger label={t("students.deleteMistake")} onPress={() => ask("delete")} />] : []),
            ]}
          </ListGroup>
        </Section>
      </Reveal>

      {/* Edit */}
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("students.editTitle")}
        footer={<Button full label={t("common.save")} loading={saving} onPress={saveEdit} />}
      >
        <View style={{ gap: space.lg }}>
          <Input label={t("students.name")} value={form.name} onChangeText={(v) => setF({ name: v })} error={formErrors.name} autoCapitalize="words" maxLength={80} />
          <Input label={t("students.fatherName")} value={form.fatherName} onChangeText={(v) => setF({ fatherName: v })} error={formErrors.fatherName} autoCapitalize="words" maxLength={80} />
          <View style={{ gap: space.xs + 2 }}>
            <Text variant="label" color="textMuted">
              {t("students.gender")}
            </Text>
            <Segmented
              value={form.gender}
              onChange={(g) => setF({ gender: g })}
              options={[
                { value: "male", label: t("students.male") },
                { value: "female", label: t("students.female") },
              ]}
            />
          </View>
          <Input latin label={t("students.parentPhone")} value={form.parentPhone} onChangeText={(v) => setF({ parentPhone: v })} error={formErrors.parentPhone} keyboardType="phone-pad" maxLength={16} />
          <Input latin label={`${t("students.studentPhone")} · ${t("common.optional")}`} value={form.phone} onChangeText={(v) => setF({ phone: v })} error={formErrors.phone} keyboardType="phone-pad" maxLength={16} />
          <Input label={`${t("students.address")} · ${t("common.optional")}`} value={form.address} onChangeText={(v) => setF({ address: v })} maxLength={200} />
          <Input latin label={t("students.monthlyFee")} value={form.fee} onChangeText={(v) => setF({ fee: digits(v).slice(0, 8) })} error={formErrors.fee} keyboardType="number-pad" />
          <DateField label={t("students.admissionDate")} value={form.admissionDate} onChange={(d) => setF({ admissionDate: d })} />
          {editError ? (
            <Text variant="caption" color="danger">
              {editError}
            </Text>
          ) : null}
        </View>
      </Sheet>

      {/* Move batch */}
      <Sheet
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        title={t("students.moveBatchTitle")}
        footer={<Button full label={t("students.moveBatch")} loading={moving} onPress={saveMove} />}
      >
        <View style={{ gap: space.lg }}>
          <Text color="textMuted">{t("students.moveBatchBody", { name: student.name, from: batch?.name ?? "—" })}</Text>
          <Select label={t("students.moveTo")} placeholder={t("students.selectBatch")} value={moveTo} options={moveOptions} onChange={pickMove} />
          {moveError ? (
            <Text variant="caption" color="danger">
              {moveError}
            </Text>
          ) : null}
        </View>
      </Sheet>

      {/* Confirm status / delete */}
      <Sheet
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={cc?.title ?? ""}
        footer={
          <Button full variant={cc?.danger ? "danger" : "primary"} label={cc?.label ?? ""} loading={confirming} onPress={runConfirm} />
        }
      >
        <View style={{ gap: space.md }}>
          <Text color="textMuted">{cc?.body}</Text>
          {confirmError ? (
            <Text variant="caption" color="danger">
              {confirmError}
            </Text>
          ) : null}
        </View>
      </Sheet>

      {/* Sign-in code */}
      <Sheet
        open={signIn !== null}
        onClose={() => setSignIn(null)}
        title={t("students.codeTitle")}
        subtitle={signIn?.studentName}
        footer={
          signIn ? (
            <View style={{ gap: space.sm }}>
              <Button
                full
                icon="message-circle"
                label={t("whatsapp.send")}
                onPress={() =>
                  openWhatsApp(
                    signIn.phone,
                    t("whatsapp.signInCode", {
                      name: signIn.studentName,
                      academyCode: signIn.academyCode,
                      studentCode: signIn.studentCode,
                      code: signIn.code,
                    })
                  )
                }
              />
              {canCopy ? <Button full variant="secondary" icon="copy" label={t("students.copyAll")} onPress={copyDetails} /> : null}
            </View>
          ) : undefined
        }
      >
        {signIn ? (
          <View style={{ gap: space.lg }}>
            <Text color="textMuted">{t("students.codeBody")}</Text>
            <Card tone="muted" style={{ gap: space.lg }}>
              <CodeLine label={t("students.academyCode")} value={signIn.academyCode} />
              <CodeLine label={t("students.studentId")} value={signIn.studentCode} />
              <CodeLine label={t("students.code")} value={signIn.code} big />
            </Card>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
