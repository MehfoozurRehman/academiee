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
import { FormSheet } from "../components/FormSheet";
import { cleanError } from "../lib/errors";

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
  const [values, setValues] = useState<Record<string, string>>({
    batchId: "",
    teacherId: "",
    day: DAYS[0],
    start: "09:00",
    end: "11:00",
    subject: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (batches && batches.length && !values.batchId) {
      setValues((prev) => ({ ...prev, batchId: batches[0].batchId }));
    }
  }, [batches, values.batchId]);
  useEffect(() => {
    if (teachers && teachers.length && !values.teacherId) {
      setValues((prev) => ({ ...prev, teacherId: teachers[0].teacherId }));
    }
  }, [teachers, values.teacherId]);

  async function submit() {
    if (!session?.academyId || !values.batchId || !values.teacherId) return;
    if (!values.subject?.trim()) {
      setError("Enter a subject");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await addSlot({
        academyId: session.academyId,
        batchId: values.batchId as Id<"batches">,
        teacherId: values.teacherId as Id<"teachers">,
        day: values.day,
        startTime: values.start,
        endTime: values.end,
        subject: values.subject.trim(),
      });
      setOpen(false);
      setValues((prev) => ({ ...prev, subject: "" }));
    } catch (e) {
      setError(cleanError(e, "Failed"));
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
                    onDelete={() =>
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

      <FormSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add class slot"
        values={values}
        onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
        submitLabel="Add slot"
        onSubmit={submit}
        busy={busy}
        error={error}
        choices={[
          { key: "day", label: "Day", options: DAYS.map((d) => ({ label: d, value: d })) },
          ...(batches && batches.length > 0
            ? [
                {
                  key: "batchId",
                  label: "Batch",
                  options: batches.map((b) => ({ label: b.name, value: b.batchId })),
                },
              ]
            : []),
          ...(teachers && teachers.length > 0
            ? [
                {
                  key: "teacherId",
                  label: "Teacher",
                  options: teachers.map((x) => ({ label: x.name, value: x.teacherId })),
                },
              ]
            : []),
        ]}
        fields={[
          { key: "subject", label: "Subject", placeholder: "Mathematics", autoCapitalize: "words" },
          { key: "start", label: "Start time", placeholder: "09:00" },
          { key: "end", label: "End time", placeholder: "11:00" },
        ]}
      />
    </View>
  );
}
