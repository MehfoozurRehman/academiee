import { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Button,
  Card,
  Chips,
  EmptyState,
  Icon,
  Input,
  Pressable,
  Reveal,
  Screen,
  Section,
  Select,
  Sheet,
  Skeleton,
  Text,
  TimeField,
  useToast,
} from "../../components/ui";
import { useAcademyId } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { errorMessage } from "../../lib/errors";
import { useToday } from "../../lib/useToday";
import { useTheme } from "../../theme/ThemeProvider";
import { layout, radius, space } from "../../theme/tokens";

const WEEK = [1, 2, 3, 4, 5, 6, 0];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Slot = {
  _id: Id<"slots">;
  batchId: Id<"batches">;
  batchName: string;
  day: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
};

function SlotCard({ slot, onPress }: { slot: Slot; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      scaleTo={0.98}
      style={{
        gap: 2,
        padding: space.md,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text latin variant="caption" weight="bold" color="accent" tabular>
        {slot.startTime} – {slot.endTime}
      </Text>
      <Text variant="label" weight="semibold" numberOfLines={2}>
        {slot.subject}
      </Text>
      <Text variant="caption" color="textMuted" numberOfLines={1}>
        {slot.batchName}
      </Text>
      <Text variant="caption" color="textFaint" numberOfLines={1}>
        {slot.teacherName}
      </Text>
    </Pressable>
  );
}

export default function Timetable() {
  const { t, dayName } = useI18n();
  const { colors } = useTheme();
  const toast = useToast();
  const academyId = useAcademyId();
  const { today } = useToday();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;

  const slots = useQuery(api.academics.listSlots, { academyId });
  const batches = useQuery(api.classes.listBatches, { academyId });
  const saveSlot = useMutation(api.academics.saveSlot);
  const deleteSlot = useMutation(api.academics.deleteSlot);

  const todayDay = new Date(`${today}T00:00:00`).getDay();
  const [day, setDay] = useState<number | null>(null);
  const activeDay = day ?? todayDay;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [fBatch, setFBatch] = useState<string | null>(null);
  const [fDay, setFDay] = useState("1");
  const [fStart, setFStart] = useState("16:00");
  const [fEnd, setFEnd] = useState("17:00");
  const [fSubject, setFSubject] = useState("");
  const [fTeacher, setFTeacher] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toDelete, setToDelete] = useState<Slot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  const batchOptions = (batches ?? []).map((b) => ({ value: b._id as string, label: b.name, hint: b.courseName }));
  const dayOptions = WEEK.map((d) => ({ value: String(d), label: dayName(d) }));

  function openNew() {
    const only = batches?.length === 1 ? batches[0] : null;
    setEditing(null);
    setFBatch(only ? (only._id as string) : null);
    setFDay(String(activeDay));
    setFStart(only?.startTime ?? "16:00");
    setFEnd(only?.endTime ?? "17:00");
    setFSubject("");
    setFTeacher(only?.teacherName ?? "");
    setError(null);
    setOpen(true);
  }

  function openEdit(s: Slot) {
    setEditing(s);
    setFBatch(s.batchId);
    setFDay(String(s.day));
    setFStart(s.startTime);
    setFEnd(s.endTime);
    setFSubject(s.subject);
    setFTeacher(s.teacherName);
    setError(null);
    setOpen(true);
  }

  function pickBatch(id: string) {
    setFBatch(id);
    const b = batches?.find((x) => x._id === id);
    if (!b) return;
    if (!editing) {
      setFStart(b.startTime);
      setFEnd(b.endTime);
    }
    if (!fTeacher.trim() || batches?.some((x) => x.teacherName === fTeacher)) setFTeacher(b.teacherName);
  }

  async function submit() {
    if (!fBatch) return setError(t("timetable.batchRequired"));
    if (!TIME_RE.test(fStart) || !TIME_RE.test(fEnd) || fEnd <= fStart) return setError(t("timetable.timeInvalid"));
    if (!fSubject.trim()) return setError(t("timetable.subjectRequired"));
    if (fTeacher.trim().length < 2) return setError(t("timetable.teacherRequired"));
    setSaving(true);
    setError(null);
    try {
      await saveSlot({
        academyId,
        slotId: editing?._id,
        batchId: fBatch as Id<"batches">,
        day: Number(fDay),
        startTime: fStart,
        endTime: fEnd,
        subject: fSubject,
        teacherName: fTeacher,
      });
      toast(t("timetable.saved"), "success");
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDelError(null);
    try {
      await deleteSlot({ academyId, slotId: toDelete._id });
      toast(t("timetable.deleted"), "success");
      setToDelete(null);
    } catch (e) {
      setDelError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setDeleting(false);
    }
  }

  const noBatches = batches !== undefined && batches.length === 0;
  const byDay = (d: number) => (slots ?? []).filter((s) => s.day === d);

  return (
    <Screen
      title={t("timetable.title")}
      subtitle={t("timetable.subtitle")}
      action={noBatches ? undefined : <Button size="sm" icon="plus" label={t("timetable.addSlot")} onPress={openNew} />}
    >
      {slots === undefined || batches === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={44} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </View>
      ) : noBatches ? (
        <EmptyState
          icon="layers"
          title={t("timetable.noBatches")}
          body={t("timetable.noBatchesBody")}
          action={<Button label={t("timetable.goToClasses")} onPress={() => router.push("/classes" as never)} />}
        />
      ) : slots.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={t("timetable.empty")}
          body={t("timetable.emptyBody")}
          action={<Button icon="plus" label={t("timetable.addSlot")} onPress={openNew} />}
        />
      ) : wide ? (
        <Reveal index={0}>
          <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
            {WEEK.map((d) => (
              <View key={d} style={{ flex: 1, minWidth: 0, gap: space.sm }}>
                <View
                  style={{
                    paddingVertical: space.sm,
                    paddingHorizontal: space.md,
                    borderRadius: radius.md,
                    backgroundColor: d === todayDay ? colors.accentSoft : colors.surfaceMuted,
                  }}
                >
                  <Text variant="label" weight="semibold" color={d === todayDay ? "accent" : "textMuted"} numberOfLines={1}>
                    {dayName(d)}
                  </Text>
                </View>
                {byDay(d).length === 0 ? (
                  <Text variant="caption" color="textFaint" style={{ paddingHorizontal: space.md }}>
                    —
                  </Text>
                ) : (
                  byDay(d).map((s) => <SlotCard key={s._id} slot={s} onPress={() => openEdit(s)} />)
                )}
              </View>
            ))}
          </View>
        </Reveal>
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <Chips
                value={String(activeDay)}
                options={WEEK.map((d) => ({ value: String(d), label: dayName(d) }))}
                onChange={(v) => setDay(Number(v))}
              />
            </Section>
          </Reveal>
          <Reveal index={1}>
            <Section>
              {byDay(activeDay).length === 0 ? (
                <Card style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
                  <Icon name="coffee" size={20} color="textMuted" />
                  <Text color="textMuted" style={{ flex: 1 }}>
                    {t("timetable.noClassesDay", { day: dayName(activeDay) })}
                  </Text>
                </Card>
              ) : (
                <View style={{ gap: space.sm }}>
                  {byDay(activeDay).map((s) => (
                    <SlotCard key={s._id} slot={s} onPress={() => openEdit(s)} />
                  ))}
                </View>
              )}
            </Section>
          </Reveal>
        </>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t("timetable.editSlot") : t("timetable.newSlot")}
        footer={
          <View style={{ gap: space.sm }}>
            <Button full label={t("timetable.save")} loading={saving} onPress={submit} />
            {editing ? (
              <Button
                full
                variant="danger"
                icon="trash-2"
                label={t("timetable.delete")}
                onPress={() => {
                  setOpen(false);
                  setDelError(null);
                  setToDelete(editing);
                }}
              />
            ) : null}
          </View>
        }
      >
        <View style={{ gap: space.lg }}>
          <Select label={t("timetable.batch")} value={fBatch} options={batchOptions} onChange={pickBatch} />
          <Select label={t("timetable.day")} value={fDay} options={dayOptions} onChange={setFDay} />
          <View style={{ flexDirection: "row", gap: space.md }}>
            <TimeField label={t("timetable.start")} value={fStart} onChange={setFStart} />
            <TimeField label={t("timetable.end")} value={fEnd} onChange={setFEnd} />
          </View>
          <Input label={t("timetable.subject")} value={fSubject} onChangeText={setFSubject} placeholder={t("timetable.subjectPlaceholder")} />
          <Input label={t("timetable.teacher")} value={fTeacher} onChangeText={setFTeacher} placeholder={t("timetable.teacherPlaceholder")} />
          {error ? (
            <Text variant="caption" color="danger">
              {error}
            </Text>
          ) : null}
        </View>
      </Sheet>

      <Sheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t("timetable.deleteTitle")}
        footer={
          <View style={{ gap: space.sm }}>
            <Button full variant="danger" label={t("timetable.delete")} loading={deleting} onPress={confirmDelete} />
            <Button full variant="secondary" label={t("common.cancel")} onPress={() => setToDelete(null)} />
          </View>
        }
      >
        <View style={{ gap: space.md }}>
          {toDelete ? (
            <Text color="textMuted">
              {t("timetable.deleteBody", { subject: toDelete.subject, batch: toDelete.batchName, day: dayName(toDelete.day) })}
            </Text>
          ) : null}
          {delError ? (
            <Text variant="caption" color="danger">
              {delError}
            </Text>
          ) : null}
        </View>
      </Sheet>
    </Screen>
  );
}
