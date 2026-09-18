import { useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { formatMoney, todayKey, useTheme } from "../theme";
import {
  AppBar,
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Fab,
  Field,
  Loader,
  Row,
} from "../components/ui";
import { Sheet } from "../components/PaymentSheet";
import { cleanError } from "../lib/errors";

export default function Teachers() {
  const t = useTheme();
  const { session } = useSession();
  const create = useMutation(api.teachers.createTeacher);
  const remove = useMutation(api.teachers.deleteTeacher);

  const teachers = useQuery(
    api.teachers.listTeachers,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [salary, setSalary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!session?.academyId) return;

    if (!name.trim() || !phone.trim() || !subject.trim()) {
      setError("Name, phone and subject are required");
      return;
    }
    const monthlySalary = Number(salary);
    if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
      setError("Enter a valid salary");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await create({
        academyId: session.academyId,
        name: name.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        monthlySalary,
        hireDate: todayKey(),
      });
      setOpen(false);
      setName("");
      setPhone("");
      setSubject("");
      setSalary("");
    } catch (e) {
      setError(cleanError(e, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(teacherId: string, teacherName: string) {
    Alert.alert("Delete teacher?", `${teacherName} will move to the recycle bin.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await remove({ teacherId: teacherId as never });
          } catch (e) {
            Alert.alert("Could not delete", cleanError(e, "Unknown error"));
          }
        },
      },
    ]);
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
            <Card padded={false} style={{ marginBottom: t.spacing.sm }}>
              <Row
                last
                title={item.name}
                subtitle={`${item.subject} · ${item.phone} · ${item.batchCount} batch(es)`}
                meta={formatMoney(item.monthlySalary)}
                badge={item.status !== "active" ? item.status : undefined}
                badgeTone="neutral"
                leading={<Avatar name={item.name} />}
                onPress={() => confirmDelete(item.teacherId, item.name)}
              />
            </Card>
          )}
        />
      )}

      <Fab onPress={() => setOpen(true)} />

      <Sheet open={open} onClose={() => setOpen(false)} title="Add teacher">
        <View style={{ gap: t.spacing.md }}>
          <Field label="Name" value={name} onChangeText={setName} placeholder="Ahmed Khan" autoCapitalize="words" />
          <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Mathematics" autoCapitalize="words" />
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="03001112233" keyboardType="phone-pad" />
          <Field label="Monthly salary" value={salary} onChangeText={setSalary} placeholder="45000" keyboardType="numeric" suffix="PKR" />
          <ErrorNote message={error} />
          <Button label="Add teacher" onPress={submit} loading={busy} />
        </View>
      </Sheet>
    </View>
  );
}
