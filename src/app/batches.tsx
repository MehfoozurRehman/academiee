import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
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
import { Sheet } from "../components/Sheet";
import { cleanError } from "../lib/errors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export default function Batches() {
  const t = useTheme();
  const { session } = useSession();
  const create = useMutation(api.batches.createBatch);
  const remove = useMutation(api.batches.deleteBatch);

  const batches = useQuery(
    api.batches.listBatches,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );
  const courses = useQuery(
    api.courses.listCourses,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );
  const teachers = useQuery(
    api.teachers.listTeachers,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState<Id<"courses"> | null>(null);
  const [teacherId, setTeacherId] = useState<Id<"teachers"> | null>(null);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");
  const [days, setDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [capacity, setCapacity] = useState("25");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (courses && courses.length && !courseId) setCourseId(courses[0].courseId);
  }, [courses, courseId]);

  useEffect(() => {
    if (teachers && teachers.length && !teacherId) setTeacherId(teachers[0].teacherId);
  }, [teachers, teacherId]);

  async function submit() {
    if (!session?.academyId || !courseId || !teacherId) {
      setError("A course and a teacher are required");
      return;
    }
    if (!name.trim() || days.length === 0) {
      setError("Enter a name and pick at least one day");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await create({
        academyId: session.academyId,
        courseId,
        teacherId,
        name: name.trim(),
        startTime: start,
        endTime: end,
        days: days.map((d) => FULL[d]),
        capacity: Number(capacity) || 20,
      });
      setOpen(false);
      setName("");
    } catch (e) {
      setError(cleanError(e, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  const blocked = (courses?.length ?? 0) === 0 || (teachers?.length ?? 0) === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Batches" onBack={() => router.back()} />

      {batches === undefined ? (
        <Loader />
      ) : batches.length === 0 ? (
        <EmptyState
          title="No batches yet"
          message={
            blocked
              ? "Add at least one course and one teacher first — a batch needs both."
              : "Batches are the classes students join."
          }
          actionLabel={blocked ? undefined : "Add batch"}
          onAction={blocked ? undefined : () => setOpen(true)}
        />
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(b) => b.batchId}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: t.spacing.sm }}>
              <View style={{ gap: t.spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText variant="heading">{item.name}</AppText>
                  <AppText variant="callout" color={t.colors.accent}>
                    {item.occupancy}%
                  </AppText>
                </View>

                <AppText variant="caption" color={t.colors.textMuted}>
                  {item.courseName} · {item.teacherName}
                </AppText>
                <AppText variant="caption" color={t.colors.textMuted}>
                  {item.days.map((d) => d.slice(0, 3)).join(", ")} · {item.startTime}–{item.endTime}
                </AppText>

                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: t.colors.surfaceAlt,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${Math.min(100, item.occupancy)}%`,
                      height: 6,
                      backgroundColor:
                        item.occupancy >= 90 ? t.colors.danger : t.colors.accent,
                    }}
                  />
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText variant="caption" color={t.colors.textMuted}>
                    {item.currentStudents}/{item.capacity} enrolled · {item.seatsLeft} seats left
                  </AppText>
                  <Pressable
                    onPress={() =>
                      Alert.alert("Delete batch?", `${item.name} will move to the recycle bin.`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await remove({ batchId: item.batchId });
                            } catch (e) {
                              Alert.alert(
                                "Could not delete",
                                cleanError(e, "Unknown error")
                              );
                            }
                          },
                        },
                      ])
                    }
                  >
                    <AppText variant="caption" color={t.colors.danger}>
                      Delete
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {!blocked ? <Fab onPress={() => setOpen(true)} /> : null}

      <Sheet open={open} onClose={() => setOpen(false)} title="New batch">
        <View style={{ gap: t.spacing.md }}>
          <Field label="Batch name" value={name} onChangeText={setName} placeholder="Matric Morning A" autoCapitalize="words" />

          {courses && courses.length > 0 ? (
            <View style={{ gap: 6 }}>
              <AppText variant="micro" color={t.colors.textMuted}>
                COURSE
              </AppText>
              <Segmented
                value={courseId ?? ""}
                onChange={(v) => setCourseId(v as Id<"courses">)}
                options={courses.map((c) => ({ label: c.name, value: c.courseId }))}
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

          <View style={{ gap: 6 }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              DAYS
            </AppText>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {DAYS.map((d) => {
                const on = days.includes(d);
                return (
                  <Pressable
                    key={d}
                    onPress={() =>
                      setDays((prev) => (on ? prev.filter((x) => x !== d) : [...prev, d]))
                    }
                    style={{
                      flex: 1,
                      paddingVertical: t.spacing.sm,
                      borderRadius: t.radius.sm,
                      alignItems: "center",
                      backgroundColor: on ? t.colors.accent : t.colors.surface,
                      borderWidth: 1,
                      borderColor: on ? t.colors.accent : t.colors.border,
                    }}
                  >
                    <AppText
                      variant="micro"
                      color={on ? t.colors.onAccent : t.colors.textMuted}
                    >
                      {d}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: t.spacing.md }}>
            <View style={{ flex: 1 }}>
              <Field label="Start" value={start} onChangeText={setStart} placeholder="09:00" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="End" value={end} onChangeText={setEnd} placeholder="11:00" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Seats" value={capacity} onChangeText={setCapacity} keyboardType="numeric" />
            </View>
          </View>

          <ErrorNote message={error} />
          <Button label="Create batch" onPress={submit} loading={busy} />
        </View>
      </Sheet>
    </View>
  );
}
