import { useState } from "react";
import { Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatMoney, useTheme } from "../../theme";
import {
  AppBar,
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  Loader,
  Row,
  Screen,
} from "../../components/ui";
import { FormSheet } from "../../components/FormSheet";
import { cleanError } from "../../lib/errors";

export default function TeacherDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teacherId = id as Id<"teachers">;

  const teacher = useQuery(api.teachers.getTeacher, { teacherId });
  const update = useMutation(api.teachers.updateTeacher);
  const remove = useMutation(api.teachers.deleteTeacher);

  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string>>({
    name: "",
    subject: "",
    phone: "",
    salary: "",
  });

  if (teacher === undefined) {
    return <Loader />;
  }

  if (teacher === null) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <AppBar title="Teacher" onBack={() => router.back()} />
        <Screen>
          <AppText variant="body" color={t.colors.textMuted}>
            This teacher no longer exists.
          </AppText>
        </Screen>
      </View>
    );
  }

  function openEdit() {
    setEditValues({
      name: teacher.name,
      subject: teacher.subject,
      phone: teacher.phone,
      salary: teacher.monthlySalary.toString(),
    });
    setEditError("");
    setEditOpen(true);
  }

  async function submitEdit() {
    if (!editValues.name?.trim() || !editValues.phone?.trim() || !editValues.subject?.trim()) {
      setEditError("Name, subject and phone are required");
      return;
    }

    const monthlySalary = Number(editValues.salary);
    if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
      setEditError("Enter a valid salary");
      return;
    }

    setEditBusy(true);
    setEditError("");

    try {
      await update({
        teacherId,
        name: editValues.name.trim(),
        subject: editValues.subject.trim(),
        phone: editValues.phone.trim(),
        monthlySalary,
      });
      setEditOpen(false);
    } catch (e) {
      setEditError(cleanError(e, "Could not update teacher"));
    } finally {
      setEditBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete teacher?",
      `${teacher.name} will move to the recycle bin.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove({ teacherId });
              router.back();
            } catch (e) {
              Alert.alert("Could not delete", cleanError(e, "Unknown error"));
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title={teacher.name} subtitle={teacher.subject} onBack={() => router.back()} />

      <Screen scroll>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}>
            <Avatar name={teacher.name} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{teacher.name}</AppText>
              <AppText variant="caption" color={t.colors.textMuted}>
                {teacher.subject}
              </AppText>
            </View>
            <Badge
              label="Active"
              tone="success"
            />
          </View>
        </Card>

        <Card padded={false}>
          <Row title="Phone" meta={teacher.phone} />
          <Row title="Monthly salary" meta={formatMoney(teacher.monthlySalary)} />
          <Row title="Teaches" meta={`${teacher.batchCount} batch${teacher.batchCount === 1 ? "" : "es"}`} last />
        </Card>

        <View style={{ gap: t.spacing.md }}>
          <Button label="Edit teacher" onPress={openEdit} />
          <Button label="Move to recycle bin" variant="danger" onPress={confirmDelete} />
        </View>
      </Screen>

      <FormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit teacher"
        values={editValues}
        onChange={(key, value) => setEditValues((prev) => ({ ...prev, [key]: value }))}
        submitLabel="Save changes"
        onSubmit={submitEdit}
        busy={editBusy}
        error={editError}
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
