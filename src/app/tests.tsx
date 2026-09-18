import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useSession } from "../context/session";
import { todayKey, useTheme } from "../theme";
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
  Segmented,
} from "../components/ui";
import { Sheet } from "../components/Sheet";
import { cleanError } from "../lib/errors";

export default function Tests() {
  const t = useTheme();
  const { session } = useSession();
  const create = useMutation(api.tests.createTest);
  const saveResults = useMutation(api.tests.saveResults);

  const tests = useQuery(
    api.tests.listTests,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );
  const batches = useQuery(
    api.batches.listBatches,
    session?.academyId ? { academyId: session.academyId, status: "active" } : "skip"
  );

  const [open, setOpen] = useState(false);
  const [batchId, setBatchId] = useState<Id<"batches"> | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [totalMarks, setTotalMarks] = useState("50");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [openTest, setOpenTest] = useState<Id<"tests"> | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});

  const detail = useQuery(api.tests.getTestResults, openTest ? { testId: openTest } : "skip");

  useEffect(() => {
    if (batches && batches.length && !batchId) setBatchId(batches[0].batchId);
  }, [batches, batchId]);

  useEffect(() => {
    if (!detail) return;
    const next: Record<string, string> = {};
    for (const r of detail.rows) {
      next[r.studentId] = r.marksObtained === null ? "" : String(r.marksObtained);
    }
    setMarks(next);
  }, [detail]);

  async function submitTest() {
    if (!session?.academyId || !batchId) return;
    if (!name.trim()) {
      setError("Enter a test name");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await create({
        academyId: session.academyId,
        batchId,
        name: name.trim(),
        subject: subject.trim() || undefined,
        date: todayKey(),
        totalMarks: Number(totalMarks) || 50,
      });
      setOpen(false);
      setName("");
      setSubject("");
    } catch (e) {
      setError(cleanError(e, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  async function submitMarks() {
    if (!session?.academyId || !openTest || !detail) return;

    const entries = detail.rows
      .filter((r) => marks[r.studentId]?.trim())
      .map((r) => ({
        studentId: r.studentId,
        marksObtained: Number(marks[r.studentId]),
      }));

    if (entries.length === 0) {
      setError("Enter at least one mark");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await saveResults({ academyId: session.academyId, testId: openTest, entries });
      setOpenTest(null);
    } catch (e) {
      setError(cleanError(e, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  if (tests === undefined) return <Loader />;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Tests & Results" onBack={() => router.back()} />

      {tests.length === 0 ? (
        <EmptyState
          title="No tests yet"
          message={
            batches !== undefined && batches.length === 0
              ? "A test belongs to a batch. Create a batch first."
              : "Create a test, then enter marks for the batch."
          }
          actionLabel={
            batches !== undefined && batches.length === 0 ? "Go to batches" : "Add test"
          }
          onAction={
            batches !== undefined && batches.length === 0
              ? () => router.push("/batches")
              : () => setOpen(true)
          }
        />
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(x) => x.testId}
          contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card padded={false} style={{ marginBottom: t.spacing.sm }}>
              <Row
                last
                title={item.name}
                subtitle={`${item.batchName} · ${item.date} · ${item.resultCount} graded`}
                meta={`${item.totalMarks} marks`}
                onPress={() => setOpenTest(item.testId)}
              />
            </Card>
          )}
        />
      )}

      <Fab onPress={() => setOpen(true)} />

      <Sheet open={open} onClose={() => setOpen(false)} title="New test">
        <View style={{ gap: t.spacing.md }}>
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
          <Field label="Test name" value={name} onChangeText={setName} placeholder="Math Monthly Test" autoCapitalize="words" />
          <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Mathematics" autoCapitalize="words" />
          <Field label="Total marks" value={totalMarks} onChangeText={setTotalMarks} keyboardType="numeric" />
          <ErrorNote message={error} />
          <Button label="Create test" onPress={submitTest} loading={busy} />
        </View>
      </Sheet>

      <Sheet
        open={openTest !== null}
        onClose={() => setOpenTest(null)}
        title={detail ? `${detail.testName} · ${detail.totalMarks} marks` : "Results"}
      >
        <View style={{ gap: t.spacing.md, maxHeight: 420 }}>
          {detail ? (
            <>
              <AppText variant="caption" color={t.colors.textMuted}>
                Class average {detail.average}/{detail.totalMarks}
              </AppText>

              {detail.rows.map((r) => (
                <View
                  key={r.studentId}
                  style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}
                >
                  <AppText variant="body" style={{ flex: 1 } as never} numberOfLines={1}>
                    {r.studentName}
                  </AppText>
                  <View style={{ width: 96 }}>
                    <Field
                      value={marks[r.studentId] ?? ""}
                      onChangeText={(v) => setMarks((m) => ({ ...m, [r.studentId]: v }))}
                      keyboardType="numeric"
                      placeholder="—"
                    />
                  </View>
                </View>
              ))}

              <ErrorNote message={error} />
              <Button label="Save marks" onPress={submitMarks} loading={busy} />
            </>
          ) : (
            <Loader />
          )}
        </View>
      </Sheet>
    </View>
  );
}
