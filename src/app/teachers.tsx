import { useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { formatMoney, todayKey, useTheme } from "../theme";
import { AppBar, AppText, Avatar, Card, EmptyState, Fab, Loader } from "../components/ui";
import { FormSheet } from "../components/FormSheet";
import { cleanError } from "../lib/errors";

const EMPTY = { name: "", subject: "", phone: "", salary: "" };

export default function Teachers() {
  const t = useTheme();
  const { session } = useSession();
  const create = useMutation(api.teachers.createTeacher);

  const teachers = useQuery(
    api.teachers.listTeachers,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function openAdd() {
    setValues(EMPTY);
    setError("");
    setOpen(true);
  }

  async function submit() {
    if (!session?.academyId) return;

    if (!values.name?.trim() || !values.phone?.trim() || !values.subject?.trim()) {
      setError("Name, subject and phone are required");
      return;
    }
    const monthlySalary = Number(values.salary);
    if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
      setError("Enter a valid salary");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await create({
        academyId: session.academyId,
        name: values.name.trim(),
        phone: values.phone.trim(),
        subject: values.subject.trim(),
        monthlySalary,
        hireDate: todayKey(),
      });
      setOpen(false);
      setValues(EMPTY);
    } catch (e) {
      setError(cleanError(e, "Could not add teacher"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar
        title="Teachers"
        subtitle={teachers ? `${teachers.length} on staff` : undefined}
        onBack={() => router.back()}
      />

      {teachers === undefined ? (
        <Loader />
      ) : teachers.length === 0 ? (
        <EmptyState
          title="No teachers yet"
          message="Add the people who teach your batches."
          actionLabel="Add teacher"
          onAction={() => setOpen(true)}
        />
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={(x) => x.teacherId}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/teacher/${item.teacherId}`)}>
              <Card style={{ marginBottom: t.spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}>
                  <Avatar name={item.name} />

                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="body" numberOfLines={1} style={{ fontWeight: "600" } as never}>
                      {item.name}
                    </AppText>
                    <AppText variant="caption" color={t.colors.textMuted} numberOfLines={1}>
                      {item.subject} · {item.batchCount} batch{item.batchCount === 1 ? "" : "es"}
                    </AppText>
                    <AppText variant="caption" color={t.colors.textFaint} numberOfLines={1}>
                      {item.phone}
                    </AppText>
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <AppText variant="callout" style={{ fontWeight: "600" } as never}>
                      {formatMoney(item.monthlySalary)}
                    </AppText>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}

      <Fab onPress={openAdd} />

      <FormSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add teacher"
        values={values}
        onChange={setValue}
        submitLabel="Add teacher"
        onSubmit={submit}
        busy={busy}
        error={error}
        fields={[
          { key: "name", label: "Name", placeholder: "Ahmed Khan", autoCapitalize: "words" },
          { key: "subject", label: "Subject", placeholder: "Mathematics", autoCapitalize: "words" },
          { key: "phone", label: "Phone", placeholder: "03001112233", keyboard: "phone-pad" },
          { key: "salary", label: "Monthly salary", placeholder: "45000", keyboard: "numeric" },
        ]}
      />
    </View>
  );
}
