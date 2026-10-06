import { useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import {
  Badge,
  Button,
  Card,
  Chips,
  EmptyState,
  Icon,
  Input,
  Pressable,
  Progress,
  Reveal,
  Screen,
  Section,
  Segmented,
  Select,
  Sheet,
  Skeleton,
  Text,
  TimeField,
  useToast,
} from "../../components/ui";
import { useAcademyId } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { errorMessage } from "../../lib/errors";
import { useTheme } from "../../theme/ThemeProvider";
import { layout, radius, space } from "../../theme/tokens";

type Tab = "batches" | "courses";
type View_ = "active" | "archived";
type BatchRow = Doc<"batches"> & { courseName: string; courseFee: number };
type Target = { kind: "batch" | "course"; id: string; name: string; archive: boolean };

const digits = (s: string) => s.replace(/\D/g, "");

export default function Classes() {
  const { t, money, dayName, lang } = useI18n();
  const { colors } = useTheme();
  const toast = useToast();
  const academyId = useAcademyId();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;

  const [tab, setTab] = useState<Tab>("batches");
  const [view, setView] = useState<View_>("active");
  const archived = view === "archived" ? true : undefined;

  const batches = useQuery(api.classes.listBatches, { academyId, archived });
  const courses = useQuery(api.classes.listCourses, { academyId, archived });
  const activeCourses = useQuery(api.classes.listCourses, { academyId });

  const saveBatch = useMutation(api.classes.saveBatch);
  const saveCourse = useMutation(api.classes.saveCourse);
  const setBatchArchived = useMutation(api.classes.setBatchArchived);
  const setCourseArchived = useMutation(api.classes.setCourseArchived);

  // Batch sheet
  const [batchOpen, setBatchOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRow | null>(null);
  const [bForm, setBForm] = useState({ courseId: null as string | null, name: "", teacher: "", days: [] as number[], start: "16:00", end: "17:00", capacity: "20" });
  const [bErrors, setBErrors] = useState<Record<string, string>>({});
  const [bError, setBError] = useState("");
  const [bSaving, setBSaving] = useState(false);

  // Course sheet
  const [courseOpen, setCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Doc<"courses"> | null>(null);
  const [cForm, setCForm] = useState({ name: "", fee: "" });
  const [cErrors, setCErrors] = useState<Record<string, string>>({});
  const [cError, setCError] = useState("");
  const [cSaving, setCSaving] = useState(false);

  // Archive / restore
  const [target, setTarget] = useState<Target | null>(null);
  const [tError, setTError] = useState("");
  const [tBusy, setTBusy] = useState(false);

  const dayShort = (d: number) => (lang === "en" ? dayName(d).slice(0, 3) : dayName(d));
  const courseOptions = useMemo(() => {
    const list = (activeCourses ?? []).map((c) => ({ value: c._id as string, label: c.name, hint: money(c.monthlyFee) }));
    if (editingBatch && !list.some((o) => o.value === editingBatch.courseId)) {
      list.push({ value: editingBatch.courseId as string, label: editingBatch.courseName, hint: money(editingBatch.courseFee) });
    }
    return list;
  }, [activeCourses, editingBatch, money]);

  function openBatch(b: BatchRow | null) {
    if (!b && (activeCourses ?? []).length === 0) {
      openCourse(null);
      return;
    }
    setEditingBatch(b);
    setBForm(
      b
        ? { courseId: b.courseId, name: b.name, teacher: b.teacherName, days: b.days, start: b.startTime, end: b.endTime, capacity: String(b.capacity) }
        : { courseId: activeCourses?.length === 1 ? activeCourses[0]._id : null, name: "", teacher: "", days: [1, 2, 3, 4, 5], start: "16:00", end: "17:00", capacity: "20" }
    );
    setBErrors({});
    setBError("");
    setBatchOpen(true);
  }

  function openCourse(c: Doc<"courses"> | null) {
    setEditingCourse(c);
    setCForm(c ? { name: c.name, fee: String(c.monthlyFee) } : { name: "", fee: "" });
    setCErrors({});
    setCError("");
    setCourseOpen(true);
  }

  function toggleDay(d: number) {
    setBForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort() }));
  }

  async function submitBatch() {
    const next: Record<string, string> = {};
    const cap = Number(bForm.capacity);
    if (!bForm.courseId) next.course = t("classes.errCourse");
    if (!bForm.name.trim()) next.name = t("classes.errBatchName");
    if (bForm.teacher.trim().length < 2) next.teacher = t("classes.errTeacher");
    if (bForm.days.length === 0) next.days = t("classes.errDays");
    if (bForm.end <= bForm.start) next.time = t("classes.errTime");
    if (!bForm.capacity || cap < 1 || cap > 1000) next.capacity = t("classes.errCapacity");
    setBErrors(next);
    setBError("");
    if (Object.keys(next).length > 0) return;
    setBSaving(true);
    try {
      await saveBatch({
        academyId,
        batchId: editingBatch?._id,
        courseId: bForm.courseId as Id<"courses">,
        name: bForm.name,
        teacherName: bForm.teacher,
        days: bForm.days,
        startTime: bForm.start,
        endTime: bForm.end,
        capacity: cap,
      });
      setBatchOpen(false);
      toast(t("classes.batchSaved"));
    } catch (e) {
      setBError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setBSaving(false);
    }
  }

  async function submitCourse() {
    const next: Record<string, string> = {};
    if (cForm.name.trim().length < 2) next.name = t("classes.errCourseName");
    if (cForm.fee === "") next.fee = t("classes.errFee");
    setCErrors(next);
    setCError("");
    if (Object.keys(next).length > 0) return;
    setCSaving(true);
    try {
      await saveCourse({ academyId, courseId: editingCourse?._id, name: cForm.name, monthlyFee: Number(cForm.fee) });
      setCourseOpen(false);
      toast(t("classes.courseSaved"));
    } catch (e) {
      setCError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setCSaving(false);
    }
  }

  async function runTarget() {
    if (!target) return;
    setTBusy(true);
    setTError("");
    try {
      if (target.kind === "batch") {
        await setBatchArchived({ academyId, batchId: target.id as Id<"batches">, archived: target.archive });
      } else {
        await setCourseArchived({ academyId, courseId: target.id as Id<"courses">, archived: target.archive });
      }
      toast(t(target.archive ? "classes.archivedToast" : "classes.restoredToast", { name: target.name }));
      setTarget(null);
    } catch (e) {
      setTError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setTBusy(false);
    }
  }

  function ask(next: Target) {
    setTError("");
    setTarget(next);
  }

  const targetTitle = target
    ? target.archive
      ? t(target.kind === "batch" ? "classes.archiveBatchTitle" : "classes.archiveCourseTitle", { name: target.name })
      : t(target.kind === "batch" ? "classes.restoreBatchTitle" : "classes.restoreCourseTitle", { name: target.name })
    : "";
  const targetBody = target
    ? target.archive
      ? t(target.kind === "batch" ? "classes.archiveBatchBody" : "classes.archiveCourseBody")
      : t("classes.restoreBody")
    : "";

  const noCourses = activeCourses !== undefined && activeCourses.length === 0;
  const grid = { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: space.md };
  const cardBasis = wide ? { flexBasis: "48%" as const, flexGrow: 1 } : { width: "100%" as const };

  const addAction =
    view === "archived" ? undefined : tab === "batches" ? (
      <Button size="sm" icon="plus" label={t("classes.addBatch")} onPress={() => openBatch(null)} />
    ) : (
      <Button size="sm" icon="plus" label={t("classes.addCourse")} onPress={() => openCourse(null)} />
    );

  const list = tab === "batches" ? batches : courses;

  return (
    <Screen title={t("classes.title")} subtitle={t("classes.subtitle")} action={addAction}>
      <Reveal index={0}>
        <View style={{ gap: space.md, marginBottom: space.lg }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "batches", label: t("classes.tabBatches") },
              { value: "courses", label: t("classes.tabCourses") },
            ]}
          />
          <Chips
            value={view}
            onChange={setView}
            options={[
              { value: "active", label: t("classes.active") },
              { value: "archived", label: t("classes.archived") },
            ]}
          />
        </View>
      </Reveal>

      {list === undefined || activeCourses === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={130} />
          <Skeleton height={130} />
        </View>
      ) : tab === "batches" ? (
        batches!.length === 0 ? (
          view === "archived" ? (
            <EmptyState icon="archive" title={t("classes.noArchivedBatches")} />
          ) : noCourses ? (
            <EmptyState
              icon="book-open"
              title={t("classes.createCourseFirst")}
              body={t("classes.createCourseFirstBody")}
              action={<Button icon="plus" label={t("classes.addCourse")} onPress={() => openCourse(null)} />}
            />
          ) : (
            <EmptyState
              icon="layers"
              title={t("classes.noBatches")}
              body={t("classes.noBatchesBody")}
              action={<Button icon="plus" label={t("classes.addBatch")} onPress={() => openBatch(null)} />}
            />
          )
        ) : (
          <View style={grid}>
            {batches!.map((b, i) => (
              <View key={b._id} style={cardBasis}>
                <Reveal index={Math.min(i + 1, 6)}>
                  <Card style={{ gap: space.md }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space.md }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="heading" numberOfLines={1}>
                          {b.name}
                        </Text>
                        <Text color="textMuted" numberOfLines={1}>
                          {b.courseName} · {b.teacherName}
                        </Text>
                      </View>
                      {view === "archived" ? <Badge label={t("status.archived")} /> : null}
                    </View>
                    <View style={{ gap: space.xs }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                        <Icon name="calendar" size={14} color="textMuted" />
                        <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                          {b.days.map(dayShort).join(", ")}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                        <Icon name="clock" size={14} color="textMuted" />
                        <Text latin variant="caption" color="textMuted" tabular>
                          {b.startTime} – {b.endTime}
                        </Text>
                      </View>
                    </View>
                    <View style={{ gap: space.xs + 2 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
                        <Text variant="caption" color="textMuted">
                          {t("classes.enrolledOf", { enrolled: b.enrolled, capacity: b.capacity })}
                        </Text>
                      </View>
                      <Progress value={b.capacity ? b.enrolled / b.capacity : 0} tone={b.enrolled >= b.capacity ? "warning" : "accent"} />
                    </View>
                    <View style={{ flexDirection: "row", gap: space.sm, justifyContent: "flex-end" }}>
                      {view === "active" ? (
                        <>
                          <Button size="sm" variant="ghost" label={t("classes.archive")} onPress={() => ask({ kind: "batch", id: b._id, name: b.name, archive: true })} />
                          <Button size="sm" variant="secondary" icon="edit-2" label={t("common.edit")} onPress={() => openBatch(b)} />
                        </>
                      ) : (
                        <Button size="sm" variant="secondary" icon="rotate-ccw" label={t("classes.restore")} onPress={() => ask({ kind: "batch", id: b._id, name: b.name, archive: false })} />
                      )}
                    </View>
                  </Card>
                </Reveal>
              </View>
            ))}
          </View>
        )
      ) : courses!.length === 0 ? (
        view === "archived" ? (
          <EmptyState icon="archive" title={t("classes.noArchivedCourses")} />
        ) : (
          <EmptyState
            icon="book-open"
            title={t("classes.noCourses")}
            body={t("classes.noCoursesBody")}
            action={<Button icon="plus" label={t("classes.addCourse")} onPress={() => openCourse(null)} />}
          />
        )
      ) : (
        <View style={grid}>
          {courses!.map((c, i) => (
            <View key={c._id} style={cardBasis}>
              <Reveal index={Math.min(i + 1, 6)}>
                <Card style={{ gap: space.md }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                    <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
                      <Icon name="book-open" size={18} color="accent" />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="heading" numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text latin color="textMuted" tabular>
                        {t("students.perMonth", { amount: money(c.monthlyFee) })}
                      </Text>
                    </View>
                    {view === "archived" ? <Badge label={t("status.archived")} /> : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: space.sm, justifyContent: "flex-end" }}>
                    {view === "active" ? (
                      <>
                        <Button size="sm" variant="ghost" label={t("classes.archive")} onPress={() => ask({ kind: "course", id: c._id, name: c.name, archive: true })} />
                        <Button size="sm" variant="secondary" icon="edit-2" label={t("common.edit")} onPress={() => openCourse(c)} />
                      </>
                    ) : (
                      <Button size="sm" variant="secondary" icon="rotate-ccw" label={t("classes.restore")} onPress={() => ask({ kind: "course", id: c._id, name: c.name, archive: false })} />
                    )}
                  </View>
                </Card>
              </Reveal>
            </View>
          ))}
        </View>
      )}

      {/* Batch form */}
      <Sheet
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        title={editingBatch ? t("classes.editBatch") : t("classes.addBatch")}
        footer={<Button full label={t("common.save")} loading={bSaving} onPress={submitBatch} />}
      >
        <View style={{ gap: space.lg }}>
          <Select
            label={t("classes.course")}
            placeholder={t("classes.selectCourse")}
            value={bForm.courseId}
            options={courseOptions}
            onChange={(v) => setBForm((f) => ({ ...f, courseId: v }))}
            error={bErrors.course}
          />
          <Input
            label={t("classes.batchName")}
            placeholder={t("classes.batchNamePlaceholder")}
            value={bForm.name}
            onChangeText={(v) => setBForm((f) => ({ ...f, name: v }))}
            error={bErrors.name}
            maxLength={60}
          />
          <Input
            label={t("classes.teacherName")}
            value={bForm.teacher}
            onChangeText={(v) => setBForm((f) => ({ ...f, teacher: v }))}
            error={bErrors.teacher}
            autoCapitalize="words"
            maxLength={60}
          />
          <View style={{ gap: space.xs + 2 }}>
            <Text variant="label" color="textMuted">
              {t("classes.days")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const on = bForm.days.includes(d);
                return (
                  <Pressable
                    key={d}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => toggleDay(d)}
                    style={{
                      minWidth: 52,
                      paddingHorizontal: space.md,
                      paddingVertical: space.sm,
                      borderRadius: radius.pill,
                      alignItems: "center",
                      backgroundColor: on ? colors.accent : colors.surfaceMuted,
                      borderWidth: 1,
                      borderColor: on ? colors.accent : colors.border,
                    }}
                  >
                    <Text variant="label" weight="semibold" color={on ? "onAccent" : "textMuted"}>
                      {dayShort(d)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {bErrors.days ? (
              <Text variant="caption" color="danger">
                {bErrors.days}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1 }}>
              <TimeField label={t("classes.startTime")} value={bForm.start} onChange={(v) => setBForm((f) => ({ ...f, start: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <TimeField label={t("classes.endTime")} value={bForm.end} onChange={(v) => setBForm((f) => ({ ...f, end: v }))} />
            </View>
          </View>
          {bErrors.time ? (
            <Text variant="caption" color="danger" style={{ marginTop: -space.sm }}>
              {bErrors.time}
            </Text>
          ) : null}
          <Input
            latin
            label={t("classes.capacity")}
            hint={t("classes.capacityHint")}
            value={bForm.capacity}
            onChangeText={(v) => setBForm((f) => ({ ...f, capacity: digits(v).slice(0, 4) }))}
            error={bErrors.capacity}
            keyboardType="number-pad"
          />
          {bError ? (
            <Text variant="caption" color="danger">
              {bError}
            </Text>
          ) : null}
        </View>
      </Sheet>

      {/* Course form */}
      <Sheet
        open={courseOpen}
        onClose={() => setCourseOpen(false)}
        title={editingCourse ? t("classes.editCourse") : t("classes.addCourse")}
        footer={<Button full label={t("common.save")} loading={cSaving} onPress={submitCourse} />}
      >
        <View style={{ gap: space.lg }}>
          <Input
            label={t("classes.courseName")}
            placeholder={t("classes.courseNamePlaceholder")}
            value={cForm.name}
            onChangeText={(v) => setCForm((f) => ({ ...f, name: v }))}
            error={cErrors.name}
            maxLength={80}
          />
          <Input
            latin
            label={t("classes.monthlyFee")}
            value={cForm.fee}
            onChangeText={(v) => setCForm((f) => ({ ...f, fee: digits(v).slice(0, 8) }))}
            error={cErrors.fee}
            keyboardType="number-pad"
          />
          {cError ? (
            <Text variant="caption" color="danger">
              {cError}
            </Text>
          ) : null}
        </View>
      </Sheet>

      {/* Archive / restore confirm */}
      <Sheet
        open={target !== null}
        onClose={() => setTarget(null)}
        title={targetTitle}
        footer={
          <Button
            full
            variant={target?.archive ? "danger" : "primary"}
            label={target?.archive ? t("classes.archive") : t("classes.restore")}
            loading={tBusy}
            onPress={runTarget}
          />
        }
      >
        <View style={{ gap: space.md }}>
          <Text color="textMuted">{targetBody}</Text>
          {tError ? (
            <Text variant="caption" color="danger">
              {tError}
            </Text>
          ) : null}
        </View>
      </Sheet>
    </Screen>
  );
}
