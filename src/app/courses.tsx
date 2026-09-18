import { useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { formatMoney, useTheme } from "../theme";
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
} from "../components/ui";
import { FormSheet } from "../components/FormSheet";
import { cleanError } from "../lib/errors";

export default function Courses() {
  const t = useTheme();
  const { session } = useSession();
  const create = useMutation(api.courses.createCourse);
  const remove = useMutation(api.courses.deleteCourse);

  const courses = useQuery(
    api.courses.listCourses,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({ name: "", fee: "", months: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!session?.academyId) return;

    const monthlyFee = Number(values.fee);
    if (!values.name?.trim() || !Number.isFinite(monthlyFee) || monthlyFee <= 0) {
      setError("Enter a course name and a valid monthly fee");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await create({
        academyId: session.academyId,
        name: values.name.trim(),
        monthlyFee,
        durationMonths: Number(values.months) || undefined,
      });
      setOpen(false);
      setValues({ name: "", fee: "", months: "" });
    } catch (e) {
      setError(cleanError(e, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Courses" onBack={() => router.back()} />

      {courses === undefined ? (
        <Loader />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          message="Courses group your batches and set the default monthly fee."
          actionLabel="Add course"
          onAction={() => setOpen(true)}
        />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(c) => c.courseId}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: t.spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="body" numberOfLines={1} style={{ fontWeight: "600" } as never}>
                    {item.name}
                  </AppText>
                  <AppText variant="caption" color={t.colors.textMuted} numberOfLines={1}>
                    {item.batchCount} batch{item.batchCount === 1 ? "" : "es"} ·{" "}
                    {item.studentCount} student{item.studentCount === 1 ? "" : "s"}
                    {item.durationMonths ? ` · ${item.durationMonths} months` : ""}
                  </AppText>
                </View>

                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <AppText variant="callout" style={{ fontWeight: "600" } as never}>
                    {formatMoney(item.monthlyFee)}
                  </AppText>
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                  Alert.alert("Delete course?", `${item.name} will move to the recycle bin.`, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await remove({ courseId: item.courseId });
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

      <Fab onPress={() => setOpen(true)} />

      <FormSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add course"
        values={values}
        onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
        submitLabel="Add course"
        onSubmit={submit}
        busy={busy}
        error={error}
        fields={[
          { key: "name", label: "Course name", placeholder: "FSc Pre-Medical", autoCapitalize: "words" },
          { key: "fee", label: "Monthly fee", placeholder: "12000", keyboard: "numeric" },
          { key: "months", label: "Duration in months", placeholder: "12", keyboard: "numeric" },
        ]}
      />
    </View>
  );
}
