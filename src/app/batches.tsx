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
import { FormSheet } from "../components/FormSheet";
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
  const update = useMutation(api.batches.updateBatch);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({
    name: "",
    courseId: "",
    teacherId: "",
    start: "09:00",
    end: "11:00",
    capacity: "25",
  });
  const [days, setDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (courses && courses.length && !values.courseId) {
      setValues((prev) => ({ ...prev, courseId: courses[0].courseId }));
    }
  }, [courses, values.courseId]);

  useEffect(() => {
    if (teachers && teachers.length && !values.teacherId) {
      setValues((prev) => ({ ...prev, teacherId: teachers[0].teacherId }));
    }
  }, [teachers, values.teacherId]);

  function openAdd() {
    setEditingId(null);
    setValues({ name: "", courseId: courses?.[0]?.courseId || "", teacherId: teachers?.[0]?.teacherId || "", start: "09:00", end: "11:00", capacity: "25" });
    setDays(["Mon", "Wed", "Fri"]);
    setError("");
    setOpen(true);
  }

  function openEdit(batch: any) {
    setEditingId(batch.batchId);
    setValues({
      name: batch.name,
      courseId: batch.courseId,
      teacherId: batch.teacherId,
      start: batch.startTime,
      end: batch.endTime,
      capacity: batch.capacity.toString(),
    });
    setDays(batch.days.map((d: string) => Object.entries(FULL).find(([_, v]) => v === d)?.[0] || ""));
    setError("");
    setOpen(true);
  }

  async function submit() {
    if (!session?.academyId || !values.courseId || !values.teacherId) {
      setError("A course and a teacher are required");
      return;
    }
    if (!values.name?.trim() || days.length === 0) {
      setError("Enter a name and pick at least one day");
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (editingId) {
        await update({
          batchId: editingId as Id<"batches">,
          name: values.name.trim(),
          startTime: values.start,
          endTime: values.end,
          days: days.map((d) => FULL[d]),
          capacity: Number(values.capacity) || 20,
        });
      } else {
        await create({
          academyId: session.academyId,
          courseId: values.courseId as Id<"courses">,
          teacherId: values.teacherId as Id<"teachers">,
          name: values.name.trim(),
          startTime: values.start,
          endTime: values.end,
          days: days.map((d) => FULL[d]),
          capacity: Number(values.capacity) || 20,
        });
      }
      setOpen(false);
      setEditingId(null);
      setValues((prev) => ({ ...prev, name: "" }));
    } catch (e) {
      setError(cleanError(e, editingId ? "Could not update batch" : "Failed"));
    } finally {
      setBusy(false);
    }
  }

  const needsCourse = courses !== undefined && courses.length === 0;
  const needsTeacher = teachers !== undefined && teachers.length === 0;
  const blocked = needsCourse || needsTeacher;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Batches" onBack={() => router.back()} />

      {batches === undefined ? (
        <Loader />
      ) : batches.length === 0 ? (
        <EmptyState
          title="No batches yet"
          message={
            needsCourse && needsTeacher
              ? "A batch needs a course and a teacher. Add one of each first."
              : needsCourse
                ? "A batch needs a course. Add one first."
                : needsTeacher
                  ? "A batch needs a teacher. Add one first."
                  : "Batches are the classes students join."
          }
          actionLabel={
            needsCourse ? "Add a course" : needsTeacher ? "Add a teacher" : "Add batch"
          }
          onAction={
            needsCourse
              ? () => router.push("/courses")
              : needsTeacher
                ? () => router.push("/teachers")
                : () => setOpen(true)
          }
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
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                      <AppText variant="caption" color={t.colors.primary}>
                        Edit
                      </AppText>
                    </Pressable>
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
              </View>
            </Card>
          )}
        />
      )}

      {!blocked ? <Fab onPress={openAdd} /> : null}

      <FormSheet
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit batch" : "New batch"}
        values={values}
        onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
        submitLabel={editingId ? "Save changes" : "Create batch"}
        onSubmit={submit}
        busy={busy}
        error={error}
        selected={{ days }}
        onToggle={(_key, value) =>
          setDays((prev) =>
            prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
          )
        }
        toggleGroups={[
          { key: "days", label: "Days", options: DAYS.map((d) => ({ label: d, value: d })) },
        ]}
        choices={[
          ...(courses && courses.length > 0
            ? [
                {
                  key: "courseId",
                  label: "Course",
                  options: courses.map((c) => ({ label: c.name, value: c.courseId })),
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
          { key: "name", label: "Batch name", placeholder: "Matric Morning A", autoCapitalize: "words" },
          { key: "start", label: "Start time", placeholder: "09:00" },
          { key: "end", label: "End time", placeholder: "11:00" },
          { key: "capacity", label: "Seats", placeholder: "25", keyboard: "numeric" },
        ]}
      />
    </View>
  );
}
