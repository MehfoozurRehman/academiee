import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Redirect } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useSession } from "../../context/session";
import { todayKey, useTheme } from "../../theme";
import {
  AppBar,
  AppText,
  Button,
  Card,
  EmptyState,
  Loader,
  Screen,
  Segmented,
} from "../../components/ui";
import { cleanError } from "../../lib/errors";

type Status = "present" | "absent" | "late";

const OPTIONS: { value: Status; label: string }[] = [
  { value: "present", label: "P" },
  { value: "late", label: "L" },
  { value: "absent", label: "A" },
];

function shiftDay(key: string, delta: number) {
  const d = new Date(key);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function Attendance() {
  const t = useTheme();
  const { session } = useSession();

  const [batchId, setBatchId] = useState<Id<"batches"> | null>(null);
  const [date, setDate] = useState(todayKey());
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);

  const batches = useQuery(
    api.batches.listBatches,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );

  const roster = useQuery(
    api.attendance.getBatchAttendance,
    batchId ? { batchId, date } : "skip"
  );

  const save = useMutation(api.attendance.markBatchAttendance);

  useEffect(() => {
    if (batches && batches.length > 0 && !batchId) {
      setBatchId(batches[0].batchId);
    }
  }, [batches, batchId]);

  useEffect(() => {
    if (!roster) return;
    const next: Record<string, Status> = {};
    for (const r of roster) {
      next[r.studentId] = (r.status as Status) ?? "present";
    }
    setMarks(next);
  }, [roster]);

  if (!session) return <Redirect href="/login" />;
  if (!session.academyId) return <Redirect href="/select-academy" />;

  async function submit() {
    if (!session?.academyId || !batchId || !roster) return;

    setBusy(true);
    try {
      const result = await save({
        academyId: session.academyId,
        batchId,
        date,
        entries: roster.map((r) => ({
          studentId: r.studentId,
          status: marks[r.studentId] ?? "present",
        })),
      });
      Alert.alert(
        "Attendance saved",
        `${result.created} new, ${result.updated} updated for ${date}.`
      );
    } catch (e) {
      Alert.alert("Could not save", cleanError(e, "Unknown error"));
    } finally {
      setBusy(false);
    }
  }

  const summary = Object.values(marks).reduce(
    (acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Attendance" subtitle={date} large />

      <View style={{ paddingHorizontal: t.spacing.lg, gap: t.spacing.md, paddingBottom: t.spacing.md }}>
        {batches && batches.length > 0 ? (
          <Segmented
            value={batchId ?? ""}
            onChange={(v) => setBatchId(v as Id<"batches">)}
            options={batches.map((b) => ({ label: b.name, value: b.batchId }))}
          />
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.sm }}>
          <Button label="‹" variant="tonal" compact full={false} onPress={() => setDate(shiftDay(date, -1))} />
          <View style={{ flex: 1, alignItems: "center" }}>
            <AppText variant="callout">{date === todayKey() ? "Today" : date}</AppText>
          </View>
          <Button
            label="›"
            variant="tonal"
            compact
            full={false}
            onPress={() => setDate(shiftDay(date, 1))}
          />
        </View>
      </View>

      {batches === undefined ? (
        <Loader />
      ) : batches.length === 0 ? (
        <EmptyState title="No active batches" message="Create a batch before marking attendance." />
      ) : roster === undefined ? (
        <Loader />
      ) : roster.length === 0 ? (
        <EmptyState title="No students in this batch" message="Add students to this batch first." />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          <Card padded={false}>
            {roster.map((r, i) => (
              <View
                key={r.studentId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: t.spacing.md,
                  paddingHorizontal: t.spacing.lg,
                  borderBottomWidth: i === roster.length - 1 ? 0 : 1,
                  borderBottomColor: t.colors.border,
                  gap: t.spacing.md,
                }}
              >
                <AppText variant="body" style={{ flex: 1 } as never} numberOfLines={1}>
                  {r.studentName}
                </AppText>

                <View style={{ flexDirection: "row", gap: 6 }}>
                  {OPTIONS.map((o) => {
                    const on = (marks[r.studentId] ?? "present") === o.value;
                    const bg = on
                      ? o.value === "present"
                        ? t.colors.success
                        : o.value === "late"
                          ? t.colors.warning
                          : t.colors.danger
                      : t.colors.surfaceAlt;

                    return (
                      <Pressable
                        key={o.value}
                        onPress={() => setMarks((m) => ({ ...m, [r.studentId]: o.value }))}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: t.isIOS ? 19 : 12,
                          backgroundColor: bg,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: on ? 0 : 1,
                          borderColor: t.colors.border,
                        }}
                      >
                        <AppText
                          variant="callout"
                          color={on ? "#FFFFFF" : t.colors.textMuted}
                          style={{ fontWeight: "700" } as never}
                        >
                          {o.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </Card>

          <View style={{ marginTop: t.spacing.lg, gap: t.spacing.md }}>
            <AppText variant="caption" color={t.colors.textMuted}>
              {summary.present ?? 0} present · {summary.late ?? 0} late · {summary.absent ?? 0} absent
            </AppText>
            <Button label="Save attendance" onPress={submit} loading={busy} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
