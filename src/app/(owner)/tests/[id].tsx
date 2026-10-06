import { useMemo, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Avatar,
  Badge,
  Button,
  Card,
  DateField,
  EmptyState,
  Input,
  Reveal,
  Screen,
  Section,
  Segmented,
  Select,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from "../../../components/ui";
import { useAcademyId } from "../../../context/AcademyContext";
import { useI18n } from "../../../i18n/I18nProvider";
import { errorMessage } from "../../../lib/errors";
import { useTheme } from "../../../theme/ThemeProvider";
import { radius, space } from "../../../theme/tokens";

/** "" -> null (remove), "12.5" -> 12.5, anything else -> undefined (invalid). */
function parseMarks(raw: string, total: number): number | null | undefined {
  const s = raw.trim();
  if (s === "") return null;
  if (!/^\d+(\.\d)?$/.test(s)) return undefined;
  const n = Number(s);
  return n >= 0 && n <= total ? n : undefined;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 90, gap: 2 }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text latin variant="heading" weight="bold" tabular>
        {value}
      </Text>
    </View>
  );
}

export default function TestDetail() {
  const { t, dateLabel } = useI18n();
  const { colors } = useTheme();
  const toast = useToast();
  const academyId = useAcademyId();
  const { id } = useLocalSearchParams<{ id: string }>();

  const data = useQuery(api.academics.getTest, { academyId, testId: id as Id<"tests"> });
  const batches = useQuery(api.classes.listBatches, { academyId });
  const saveResults = useMutation(api.academics.saveResults);
  const saveTest = useMutation(api.academics.saveTest);
  const deleteTest = useMutation(api.academics.deleteTest);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<"name" | "rank">("name");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [eBatch, setEBatch] = useState<string | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eSubject, setESubject] = useState("");
  const [eDate, setEDate] = useState("");
  const [eTotal, setETotal] = useState("");
  const [eSaving, setESaving] = useState(false);
  const [eError, setEError] = useState<string | null>(null);

  const [delOpen, setDelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = [...(data?.students ?? [])];
    if (sort === "rank") {
      list.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.name.localeCompare(b.name));
    }
    return list;
  }, [data, sort]);

  if (data === undefined) {
    return (
      <Screen narrow back="/tests">
        <View style={{ gap: space.md }}>
          <Skeleton height={140} />
          <Skeleton height={320} />
        </View>
      </Screen>
    );
  }

  if (data === null) {
    return (
      <Screen narrow back="/tests">
        <EmptyState icon="search" title={t("common.notFound")} />
      </Screen>
    );
  }

  const { test, stats } = data;
  const total = test.totalMarks;

  const display = (sid: string, marks: number | null) => drafts[sid] ?? (marks === null ? "" : String(marks));
  const dirty = data.students.some(
    (s) => drafts[s._id] !== undefined && drafts[s._id].trim() !== (s.marks === null ? "" : String(s.marks))
  );
  const anyInvalid = data.students.some((s) => parseMarks(display(s._id, s.marks), total) === undefined);

  function setDraft(sid: string, text: string) {
    setDrafts((d) => ({ ...d, [sid]: text.replace(",", ".") }));
  }

  async function onSave() {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const entries = data.students.flatMap((s) => {
        const parsed = parseMarks(display(s._id, s.marks), total);
        if (parsed === undefined) return [];
        return [{ studentId: s._id, marks: parsed }];
      });
      await saveResults({ academyId, testId: test._id, entries });
      setDrafts({});
      toast(t("tests.marksSaved"), "success");
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  function openEdit() {
    setEBatch(test.batchId);
    setETitle(test.title);
    setESubject(test.subject ?? "");
    setEDate(test.date);
    setETotal(String(test.totalMarks));
    setEError(null);
    setEditOpen(true);
  }

  async function submitEdit() {
    const marks = Number(eTotal);
    if (!eBatch) return setEError(t("tests.batchRequired"));
    if (eTitle.trim().length < 2) return setEError(t("tests.titleRequired"));
    if (!Number.isInteger(marks) || marks < 1 || marks > 1000) return setEError(t("tests.totalInvalid"));
    setESaving(true);
    setEError(null);
    try {
      await saveTest({
        academyId,
        testId: test._id,
        batchId: eBatch as Id<"batches">,
        title: eTitle,
        subject: eSubject.trim() || undefined,
        date: eDate,
        totalMarks: marks,
      });
      toast(t("tests.testSaved"), "success");
      setEditOpen(false);
    } catch (e) {
      setEError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setESaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setDelError(null);
    try {
      await deleteTest({ academyId, testId: test._id });
      toast(t("tests.deleted"), "success");
      router.replace("/tests" as never);
    } catch (e) {
      setDelError(errorMessage(e, t("common.somethingWrong")));
      setDeleting(false);
    }
  }

  const batchOptions = (batches ?? []).map((b) => ({ value: b._id as string, label: b.name, hint: b.courseName }));
  const canDelete = stats.count === 0;

  return (
    <Screen
      narrow
      back="/tests"
      title={test.title}
      subtitle={[test.subject, test.batchName].filter(Boolean).join(" · ")}
      action={<Button size="sm" variant="secondary" icon="edit-2" label={t("tests.edit")} onPress={openEdit} />}
      footer={
        data.students.length > 0 ? (
          <View style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: space.md, alignItems: "center" }}>
            <View style={{ width: "100%", maxWidth: 640, gap: space.sm, paddingHorizontal: space.sm }}>
              {error ? (
                <Text variant="caption" color="danger">
                  {error}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <Text variant="caption" color={dirty ? "warning" : "textFaint"} weight="semibold" style={{ flex: 1 }}>
                  {dirty ? t("tests.unsaved") : ""}
                </Text>
                <Button label={t("tests.saveMarks")} icon="check" loading={saving} disabled={!dirty || anyInvalid} onPress={onSave} />
              </View>
            </View>
          </View>
        ) : undefined
      }
    >
      <Reveal index={0}>
        <Section>
          <Card style={{ gap: space.lg }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, alignItems: "center" }}>
              <Text variant="caption" color="textMuted">
                {dateLabel(test.date)}
              </Text>
              <Text variant="caption" color="textFaint">
                ·
              </Text>
              <Text variant="caption" color="textMuted">
                {t("tests.totalMarks")}:{" "}
                <Text latin variant="caption" weight="semibold" tabular>
                  {total}
                </Text>
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.lg }}>
              <Stat label={t("tests.average")} value={stats.averagePercent === null ? "—" : `${stats.averagePercent}%`} />
              <Stat label={t("tests.highest")} value={stats.highest === null ? "—" : `${stats.highest}/${total}`} />
              <Stat label={t("tests.entered")} value={`${stats.count}/${data.students.length}`} />
            </View>
          </Card>
        </Section>
      </Reveal>

      <Reveal index={1}>
        <Section title={t("tests.marksFor")}>
          {data.students.length === 0 ? (
            <Card>
              <EmptyState icon="users" title={t("tests.noStudents")} />
            </Card>
          ) : (
            <View style={{ gap: space.md }}>
              <Segmented
                value={sort}
                onChange={setSort}
                options={[
                  { value: "name", label: t("tests.sortName") },
                  { value: "rank", label: t("tests.sortRank") },
                ]}
              />
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
                {rows.map((s, i) => {
                  const parsed = parseMarks(display(s._id, s.marks), total);
                  const bad = parsed === undefined;
                  const pct = typeof parsed === "number" ? Math.round((parsed / total) * 1000) / 10 : null;
                  return (
                    <View
                      key={s._id}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: space.md,
                        padding: space.md,
                        borderTopWidth: i > 0 ? 1 : 0,
                        borderTopColor: colors.border,
                      }}
                    >
                      <View style={{ paddingTop: 7 }}>
                        <Avatar name={s.name} size={36} />
                      </View>
                      <View style={{ flex: 1, gap: 4, paddingTop: 4 }}>
                        <Text variant="label" weight="semibold" numberOfLines={1}>
                          {s.name}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" }}>
                          <Text latin variant="caption" color="textMuted" tabular>
                            {s.code}
                          </Text>
                          {s.rank !== null ? <Badge tone={s.rank <= 3 ? "accent" : "neutral"} label={t("tests.rank", { rank: s.rank })} /> : null}
                          {pct !== null ? (
                            <Text latin variant="caption" color="textMuted" tabular>
                              {pct}%
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={{ width: 104 }}>
                        <Input
                          latin
                          value={display(s._id, s.marks)}
                          onChangeText={(v) => setDraft(s._id, v)}
                          keyboardType="decimal-pad"
                          placeholder={`/ ${total}`}
                          error={bad ? t("tests.outOfRange", { total }) : undefined}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section>
          <Button
            variant="danger"
            icon="trash-2"
            label={t("tests.delete")}
            onPress={() => {
              setDelError(null);
              setDelOpen(true);
            }}
          />
        </Section>
      </Reveal>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("tests.editTitle")}
        footer={<Button full label={t("tests.saveChanges")} loading={eSaving} onPress={submitEdit} />}
      >
        <View style={{ gap: space.lg }}>
          <Select label={t("tests.batch")} value={eBatch} options={batchOptions} onChange={setEBatch} />
          <Input label={t("tests.name")} value={eTitle} onChangeText={setETitle} />
          <Input label={`${t("tests.subject")} (${t("common.optional")})`} value={eSubject} onChangeText={setESubject} />
          <DateField label={t("tests.date")} value={eDate} onChange={setEDate} />
          <Input label={t("tests.totalMarks")} value={eTotal} onChangeText={setETotal} keyboardType="number-pad" latin />
          {eError ? (
            <Text variant="caption" color="danger">
              {eError}
            </Text>
          ) : null}
        </View>
      </Sheet>

      <Sheet
        open={delOpen}
        onClose={() => setDelOpen(false)}
        title={t("tests.deleteTitle")}
        footer={
          canDelete ? (
            <View style={{ gap: space.sm }}>
              <Button full variant="danger" label={t("tests.delete")} loading={deleting} onPress={confirmDelete} />
              <Button full variant="secondary" label={t("common.cancel")} onPress={() => setDelOpen(false)} />
            </View>
          ) : (
            <Button full variant="secondary" label={t("common.done")} onPress={() => setDelOpen(false)} />
          )
        }
      >
        <View style={{ gap: space.md }}>
          <Text color="textMuted">{canDelete ? t("tests.deleteBody", { title: test.title }) : t("tests.deleteBlocked")}</Text>
          {delError ? (
            <Text variant="caption" color="danger">
              {delError}
            </Text>
          ) : null}
        </View>
      </Sheet>
    </Screen>
  );
}
