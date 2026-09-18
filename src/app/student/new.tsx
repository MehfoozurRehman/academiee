import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useSession } from "../../context/session";
import { todayKey, useTheme } from "../../theme";
import {
  AppBar,
  AppText,
  Button,
  EmptyState,
  ErrorNote,
  Field,
  Loader,
  Screen,
  Segmented,
} from "../../components/ui";
import { cleanError } from "../../lib/errors";

export default function NewStudent() {
  const t = useTheme();
  const { session } = useSession();
  const create = useMutation(api.students.createStudent);

  const batches = useQuery(
    api.batches.listBatches,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );

  const [batchId, setBatchId] = useState<Id<"batches"> | null>(null);
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentPhone, setParentPhone] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [fee, setFee] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (batches && batches.length > 0 && !batchId) {
      setBatchId(batches[0].batchId);
    }
  }, [batches, batchId]);

  async function submit() {
    if (!session?.academyId || !batchId) return;

    if (!name.trim() || !fatherName.trim() || !parentPhone.trim()) {
      setError("Name, father name and parent phone are required");
      return;
    }

    const monthlyFee = Number(fee);
    if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
      setError("Enter a valid monthly fee");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await create({
        academyId: session.academyId,
        batchId,
        name: name.trim(),
        fatherName: fatherName.trim(),
        gender,
        parentPhone: parentPhone.trim(),
        studentPhone: studentPhone.trim() || undefined,
        monthlyFee,
        admissionDate: todayKey(),
      });
      router.back();
    } catch (e) {
      setError(
        cleanError(e, "Could not add student")
      );
    } finally {
      setBusy(false);
    }
  }

  if (batches === undefined) return <Loader />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: t.colors.bg }}
    >
      <AppBar title="New student" onBack={() => router.back()} />

      {batches.length === 0 ? (
        <EmptyState
          title="No active batches"
          message="Create a batch before adding students, so each student has a class to join."
          actionLabel="Go to batches"
          onAction={() => router.replace("/batches")}
        />
      ) : (
        <Screen scroll>
          <View style={{ gap: 6 }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              BATCH
            </AppText>
            <Segmented
              value={batchId ?? ""}
              onChange={(v) => {
                setBatchId(v as Id<"batches">);
                const b = batches.find((x) => x.batchId === v);
                if (b && !fee) setFee("");
              }}
              options={batches.map((b) => ({
                label: `${b.name} (${b.seatsLeft} left)`,
                value: b.batchId,
              }))}
            />
          </View>

          <View style={{ gap: t.spacing.md }}>
            <Field label="Student name" value={name} onChangeText={setName} placeholder="Ali Raza" autoCapitalize="words" />
            <Field label="Father name" value={fatherName} onChangeText={setFatherName} placeholder="Muhammad Raza" autoCapitalize="words" />

            <View style={{ gap: 6 }}>
              <AppText variant="micro" color={t.colors.textMuted}>
                GENDER
              </AppText>
              <Segmented
                value={gender}
                onChange={(v) => setGender(v as "male" | "female")}
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                ]}
              />
            </View>

            <Field label="Parent phone" value={parentPhone} onChangeText={setParentPhone} placeholder="03001112233" keyboardType="phone-pad" />
            <Field label="Student phone" value={studentPhone} onChangeText={setStudentPhone} placeholder="Optional" keyboardType="phone-pad" />
            <Field label="Monthly fee" value={fee} onChangeText={setFee} placeholder="8000" keyboardType="numeric" suffix="PKR" />

            <ErrorNote message={error} />

            <Button label="Add student" onPress={submit} loading={busy} />
          </View>
        </Screen>
      )}
    </KeyboardAvoidingView>
  );
}
