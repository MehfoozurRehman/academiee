import { useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Avatar,
  Button,
  Card,
  Chips,
  DateField,
  EmptyState,
  Icon,
  Pressable,
  Progress,
  Reveal,
  Screen,
  Section,
  Select,
  Sheet,
  Skeleton,
  Text,
  useToast,
  type IconName,
  type Tone,
} from "../../components/ui";
import { useAcademyId } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { errorMessage } from "../../lib/errors";
import { useToday } from "../../lib/useToday";
import { useTheme } from "../../theme/ThemeProvider";
import { layout, radius, space, type ColorName } from "../../theme/tokens";

type Status = "present" | "late" | "absent";

const STATUSES: { value: Status; icon: IconName; fg: ColorName; bg: ColorName }[] = [
  { value: "present", icon: "check", fg: "success", bg: "successSoft" },
  { value: "late", icon: "clock", fg: "warning", bg: "warningSoft" },
  { value: "absent", icon: "x", fg: "danger", bg: "dangerSoft" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parse(date: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return fmt(d) === date ? d : null;
}
function addDays(date: string, delta: number) {
  const d = parse(date) ?? new Date();
  d.setDate(d.getDate() + delta);
  return fmt(d);
}

function StatusToggle({
  value,
  onChange,
  labels,
}: {
  value: Status | null;
  onChange: (next: Status) => void;
  labels: Record<Status, string>;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: space.xs, flex: 1, minWidth: 0 }}>
      {STATUSES.map((s) => {
        const active = value === s.value;
        return (
          <Pressable
            key={s.value}
            onPress={() => onChange(s.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            scaleTo={0.95}
            style={{
              flex: 1,
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: space.xs,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: active ? colors[s.fg] : colors.border,
              backgroundColor: active ? colors[s.bg] : colors.surface,
            }}
          >
            <Icon name={s.icon} size={15} color={active ? s.fg : "textFaint"} />
            <Text variant="label" weight={active ? "semibold" : "medium"} color={active ? s.fg : "textMuted"} numberOfLines={1}>
              {labels[s.value]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function rateTone(rate: number | null): Tone {
  if (rate === null) return "neutral";
  return rate >= 85 ? "success" : rate >= 70 ? "warning" : "danger";
}

export default function Attendance() {
  const { t, dayName } = useI18n();
  const { colors } = useTheme();
  const toast = useToast();
  const academyId = useAcademyId();
  const insets = useSafeAreaInsets();
  const { today, month } = useToday();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;
  const params = useLocalSearchParams<{ batch?: string }>();

  const batches = useQuery(api.classes.listBatches, { academyId });
  const summary = useQuery(api.attendance.summary, { academyId, month });
  const save = useMutation(api.attendance.save);

  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [edits, setEdits] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ kind: "batch" | "date"; value: string } | null>(null);

  const batchId = useMemo(() => {
    if (!batches || batches.length === 0) return null;
    const wanted = selectedBatch ?? params.batch ?? null;
    if (wanted && batches.some((b) => b._id === wanted)) return wanted;
    const weekday = (parse(today) ?? new Date()).getDay();
    return (batches.find((b) => b.days.includes(weekday)) ?? batches[0])._id as string;
  }, [batches, selectedBatch, params.batch, today]);

  const dateObj = parse(date);
  const future = date > today;
  const dateOk = !!dateObj && !future;

  const roll = useQuery(
    api.attendance.forBatchDay,
    batchId && dateOk ? { academyId, batchId: batchId as Id<"batches">, date } : "skip"
  );

  const labels: Record<Status, string> = {
    present: t("status.present"),
    late: t("status.late"),
    absent: t("status.absent"),
  };

  const effective = (id: string, server: Status | null): Status | null => edits[id] ?? server;

  const students = roll?.students ?? [];
  const dirty = students.some((s) => edits[s._id] !== undefined && edits[s._id] !== s.status);
  const counts = { present: 0, late: 0, absent: 0, unmarked: 0 };
  for (const s of students) {
    const st = effective(s._id, s.status);
    if (st) counts[st]++;
    else counts.unmarked++;
  }
  const markedCount = students.length - counts.unmarked;

  function apply(kind: "batch" | "date", value: string) {
    setEdits({});
    setError(null);
    if (kind === "batch") setSelectedBatch(value);
    else setDate(value);
  }
  function change(kind: "batch" | "date", value: string) {
    if ((kind === "batch" && value === batchId) || (kind === "date" && value === date)) return;
    if (dirty) setPending({ kind, value });
    else apply(kind, value);
  }

  function setStatus(id: string, status: Status) {
    setEdits((e) => ({ ...e, [id]: status }));
  }
  function markAll() {
    const next: Record<string, Status> = {};
    for (const s of students) next[s._id] = "present";
    setEdits(next);
  }

  async function onSave() {
    if (!batchId || markedCount === 0) {
      setError(t("attendanceUi.nothingToSave"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const entries = students.flatMap((s) => {
        const st = effective(s._id, s.status);
        return st ? [{ studentId: s._id, status: st }] : [];
      });
      const res = await save({ academyId, batchId: batchId as Id<"batches">, date, entries });
      setEdits({});
      toast(t("attendanceUi.saved", { count: res.saved }), "success");
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  const currentBatch = batches?.find((b) => b._id === batchId);
  const notClassDay = roll && !roll.isClassDay && currentBatch && dateObj;

  const batchOptions = (batches ?? []).map((b) => ({ value: b._id as string, label: b.name, hint: `${b.courseName}` }));

  const footer =
    students.length > 0 ? (
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: space.md,
          paddingBottom: insets.bottom + space.md,
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", maxWidth: layout.maxContent, paddingHorizontal: space.lg, gap: space.sm }}>
          {error ? (
            <Text variant="caption" color="danger">
              {error}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", columnGap: space.md, rowGap: 2 }}>
              <Count color="success" n={counts.present} label={labels.present} />
              <Count color="warning" n={counts.late} label={labels.late} />
              <Count color="danger" n={counts.absent} label={labels.absent} />
              <Count color="textMuted" n={counts.unmarked} label={t("attendanceUi.unmarked")} />
            </View>
            <Button
              label={t("attendanceUi.save")}
              icon="check"
              loading={saving}
              disabled={markedCount === 0 || (!dirty && counts.unmarked === 0)}
              onPress={onSave}
            />
          </View>
        </View>
      </View>
    ) : undefined;

  return (
    <Screen title={t("attendanceUi.title")} subtitle={t("attendanceUi.subtitle")} footer={footer}>
      {batches === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={44} />
          <Skeleton height={50} />
          <Skeleton height={300} />
        </View>
      ) : batches.length === 0 ? (
        <EmptyState
          icon="layers"
          title={t("attendanceUi.noBatches")}
          body={t("attendanceUi.noBatchesBody")}
          action={<Button label={t("attendanceUi.goToClasses")} onPress={() => router.push("/classes" as never)} />}
        />
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <View style={{ gap: space.md }}>
                {batches.length > 6 ? (
                  <Select label={t("attendanceUi.batch")} value={batchId} options={batchOptions} onChange={(v) => change("batch", v)} />
                ) : (
                  <Chips value={batchId ?? ""} options={batchOptions} onChange={(v) => change("batch", v)} />
                )}
                <View style={{ flexDirection: wide ? "row" : "column", gap: space.md, alignItems: wide ? "flex-end" : "stretch" }}>
                  <View style={{ flex: wide ? 1 : undefined, maxWidth: wide ? 260 : undefined }}>
                    <DateField
                      label={t("attendanceUi.date")}
                      value={date}
                      max={today}
                      onChange={(v) => change("date", v)}
                      error={future ? t("attendanceUi.futureDate") : undefined}
                    />
                  </View>
                  <Chips
                    value={date}
                    options={[
                      { value: today, label: t("common.today") },
                      { value: addDays(today, -1), label: t("attendanceUi.yesterday") },
                    ]}
                    onChange={(v) => change("date", v)}
                  />
                </View>
              </View>
            </Section>
          </Reveal>

          {notClassDay ? (
            <Reveal index={1}>
              <Section>
                <Card tone="muted" style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
                  <Icon name="info" size={18} color="textMuted" />
                  <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                    {t("attendanceUi.notClassDay", { batch: currentBatch.name, day: dayName(dateObj.getDay()) })}
                  </Text>
                </Card>
              </Section>
            </Reveal>
          ) : null}

          <Reveal index={2}>
            <Section
              action={
                students.length > 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                    {dirty ? (
                      <Text variant="caption" color="warning" weight="semibold">
                        {t("attendanceUi.unsaved")}
                      </Text>
                    ) : null}
                    <Button size="sm" variant="secondary" icon="check-circle" label={t("attendanceUi.markAll")} onPress={markAll} />
                  </View>
                ) : undefined
              }
            >
              {!dateOk ? null : roll === undefined ? (
                <View style={{ gap: space.sm }}>
                  <Skeleton height={72} />
                  <Skeleton height={72} />
                  <Skeleton height={72} />
                </View>
              ) : students.length === 0 ? (
                <Card>
                  <EmptyState icon="users" title={t("attendanceUi.noStudents")} body={t("attendanceUi.noStudentsBody")} />
                </Card>
              ) : (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                  }}
                >
                  {students.map((s, i) => {
                    const st = effective(s._id, s.status);
                    return (
                      <View
                        key={s._id}
                        style={{
                          flexDirection: wide ? "row" : "column",
                          alignItems: wide ? "center" : "stretch",
                          gap: space.md,
                          padding: space.md,
                          borderTopWidth: i > 0 ? 1 : 0,
                          borderTopColor: colors.border,
                          backgroundColor: st === null ? colors.warningSoft : "transparent",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, flex: wide ? 1 : undefined }}>
                          <Avatar name={s.name} size={36} />
                          <View style={{ flex: 1 }}>
                            <Text variant="label" weight="semibold" numberOfLines={1}>
                              {s.name}
                            </Text>
                            <Text latin variant="caption" color="textMuted" tabular>
                              {s.code}
                            </Text>
                          </View>
                          {st === null ? (
                            <Text variant="micro" color="warning">
                              {t("attendanceUi.unmarked")}
                            </Text>
                          ) : null}
                        </View>
                        <View style={{ width: wide ? 330 : "100%" }}>
                          <StatusToggle value={st} onChange={(v) => setStatus(s._id, v)} labels={labels} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </Section>
          </Reveal>

          <Reveal index={3}>
            <Section title={t("attendanceUi.monthTitle")}>
              {summary === undefined ? (
                <Skeleton height={120} />
              ) : (
                <Card style={{ gap: space.lg }}>
                  {summary.map((b) => (
                    <View key={b.batchId} style={{ gap: space.sm }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: space.md }}>
                        <Text variant="label" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
                          {b.batchName}
                        </Text>
                        <Text variant="caption" color={b.rate === null ? "textFaint" : "textMuted"}>
                          {b.rate === null ? t("attendanceUi.noMonthData") : t("attendanceUi.rate", { rate: b.rate })}
                        </Text>
                      </View>
                      <Progress value={(b.rate ?? 0) / 100} tone={rateTone(b.rate)} />
                      {b.rate !== null ? (
                        <Text variant="caption" color="textFaint">
                          {t("attendanceUi.markedDays", { count: b.markedDays })} · {labels.present} {b.present} · {labels.late} {b.late} · {labels.absent} {b.absent}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </Card>
              )}
            </Section>
          </Reveal>
        </>
      )}

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title={t("attendanceUi.unsavedTitle")}
        footer={
          <View style={{ gap: space.sm }}>
            <Button
              full
              variant="danger"
              label={t("attendanceUi.discard")}
              onPress={() => {
                if (pending) apply(pending.kind, pending.value);
                setPending(null);
              }}
            />
            <Button full variant="secondary" label={t("attendanceUi.keepEditing")} onPress={() => setPending(null)} />
          </View>
        }
      >
        <Text color="textMuted">{t("attendanceUi.unsavedBody")}</Text>
      </Sheet>
    </Screen>
  );
}

function Count({ n, label, color }: { n: number; label: string; color: ColorName }) {
  return (
    <Text variant="caption" color={color}>
      <Text latin variant="caption" weight="bold" color={color} tabular>
        {n}
      </Text>{" "}
      {label}
    </Text>
  );
}
