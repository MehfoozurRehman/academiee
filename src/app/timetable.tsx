import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
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
  Screen,
  Segmented,
} from "../components/ui";
import { Sheet } from "../components/PaymentSheet";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Timetable() {
  const t = useTheme();
  const { session } = useSession();
  const addSlot = useMutation(api.timetable.addSlot);
  const deleteSlot = useMutation(api.timetable.deleteSlot);

  const slots = useQuery(
    api.timetable.getTimetable,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );
  const batches = useQuery(
    api.batches.listBatches,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );
  const teachers = useQuery(
    api.teachers.listTeachers,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );

  const [open, setOpen] = useState(false);
  const [batchId, setBatchId] = useState<Id<"batches"> | null>(null);
  const [teacherId, setTeacherId] = useState<Id<"teachers"> | null>(null);
  const [day, setDay] = useState(DAYS[0]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (batches && batches.length && !batchId) setBatchId(batches[0].batchId);
  }, [batches, batchId]);
  useEffect(() => {
    if (teachers && teachers.length && !teacherId) setTeacherId(teachers[0].teacherId);
  }, [teachers, teacherId]);

  async function submit() {
    if (!session?.academyId || !batchId || !teacherId) return;
    if (!subject.trim()) {
      setError("Enter a subject");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await addSlot({
        academyId: session.academyId,
        batchId,
        teacherId,
        day,
        startTime: start,
        endTime: end,
        subject: subject.trim(),
      });
      setOpen(false);
      setSubject("");
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^.*Uncaught Error:\s*/, "") : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (slots === undefined) return <Loader />;

  const byDay = DAYS.map((d) => ({ day: d, items: slots.filter((s) => s.day === d) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Timetable" subtitle={`${slots.length} slots`} onBack={() => router.back()} />

      {slots.length === 0 ? (
        <EmptyState
          title="No timetable yet"
          message="Add class slots. Clashing teachers or batches are rejected automatically."
          actionLabel="Add slot"
          onAction={() => setOpen(true)}
        />
      ) : (
        <Screen scroll>
          {byDay.map((group) => (
            <View key={group.day} style={{ gap: t.spacing.sm }}>
              <AppText variant="micro" color={t.colors.textMuted}>
                {group.day.toUpperCase()}
              </AppText>
              <Card padded={false}>
                {group.items.map((s, i) => (
                  <Row
                    key={s.slotId}
                    title={`${s.startTime}–${s.endTime}  ${s.subject}`}
                    subtitle={`${s.batchName} · ${s.teacherName}`}
                    last={i === group.items.length - 1}
                    onPress={() =>
                      Alert.alert("Remove slot?", `${s.subject} on ${s.day}`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => deleteSlot({ slotId: s.slotId }),
                        },
                      ])
                    }
                  />
                ))}
              </Card>
            </View>
          ))}
        </Screen>
      )}

      <Fab onPress={() => setOpen(true)} />

      <Sheet open={open} onClose={() => setOpen(false)} title="Add class slot">
        <View style={{ gap: t.spacing.md }}>
          <View style={{ gap: 6 }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              DAY
            </AppText>
            <Segmented
              value={day}
              onChange={setDay}
              options={DAYS.map((d) => ({ label: d.slice(0, 3), value: d }))}
            />
          </View>

          {batches && batches.length > 0 ? (
            <View style={{ gap: 6 }}>
              <AppText variant="micro" color={t.colors.textMuted}>
                BATCH
              </AppText>
              <Segmented
                value={batchId ?? ""}
                onChange={(v) => setBatchId(v as Id<"batches">)}
                options={batches.map((b) => ({ label: b.name, value: b.batchId }))}
              />
            </View>
          ) : null}

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
          ) : null}

          <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Mathematics" autoCapitalize="words" />

          <View style={{ flexDirection: "row", gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Field label="Start" value={start} onChangeText={setStart} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="End" value={end} onChangeText={setEnd} />
            </View>
          </View>

          <ErrorNote message={error} />
          <Button label="Add slot" onPress={submit} loading={busy} />
        </View>
      </Sheet>
    </View>
  );
}
