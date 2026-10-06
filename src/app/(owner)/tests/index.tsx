import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Button,
  DateField,
  EmptyState,
  Input,
  ListGroup,
  ListRow,
  Reveal,
  Screen,
  Section,
  Select,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from "../../../components/ui";
import { useAcademyId } from "../../../context/AcademyContext";
import { useI18n } from "../../../i18n/I18nProvider";
import { errorMessage } from "../../../lib/errors";
import { useToday } from "../../../lib/useToday";
import { space } from "../../../theme/tokens";

export default function Tests() {
  const { t, dateLabel } = useI18n();
  const toast = useToast();
  const academyId = useAcademyId();
  const { today } = useToday();

  const [filter, setFilter] = useState("all");
  const batches = useQuery(api.classes.listBatches, { academyId });
  const tests = useQuery(api.academics.listTests, {
    academyId,
    batchId: filter === "all" ? undefined : (filter as Id<"batches">),
  });
  const saveTest = useMutation(api.academics.saveTest);

  const [open, setOpen] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(today);
  const [total, setTotal] = useState("100");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrolled = useMemo(() => new Map((batches ?? []).map((b) => [b._id as string, b.enrolled])), [batches]);
  const batchOptions = (batches ?? []).map((b) => ({ value: b._id as string, label: b.name, hint: b.courseName }));
  const filterOptions = [{ value: "all", label: t("tests.allBatches") }, ...batchOptions];

  function openNew() {
    setBatchId(filter !== "all" ? filter : batches?.length === 1 ? (batches[0]._id as string) : null);
    setTitle("");
    setSubject("");
    setDate(today);
    setTotal("100");
    setError(null);
    setOpen(true);
  }

  async function submit() {
    const marks = Number(total);
    if (!batchId) return setError(t("tests.batchRequired"));
    if (title.trim().length < 2) return setError(t("tests.titleRequired"));
    if (!Number.isInteger(marks) || marks < 1 || marks > 1000) return setError(t("tests.totalInvalid"));
    setSaving(true);
    setError(null);
    try {
      const id = await saveTest({
        academyId,
        batchId: batchId as Id<"batches">,
        title,
        subject: subject.trim() || undefined,
        date,
        totalMarks: marks,
      });
      toast(t("tests.testSaved"), "success");
      setOpen(false);
      router.push(`/tests/${id}` as never);
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  const noBatches = batches !== undefined && batches.length === 0;

  return (
    <Screen
      title={t("tests.title")}
      subtitle={t("tests.subtitle")}
      action={noBatches ? undefined : <Button size="sm" icon="plus" label={t("tests.newTest")} onPress={openNew} />}
    >
      {batches === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={50} />
          <Skeleton height={200} />
        </View>
      ) : noBatches ? (
        <EmptyState
          icon="layers"
          title={t("tests.noBatches")}
          body={t("tests.noBatchesBody")}
          action={<Button label={t("tests.goToClasses")} onPress={() => router.push("/classes" as never)} />}
        />
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <Select label={t("tests.filterBatch")} value={filter} options={filterOptions} onChange={setFilter} />
            </Section>
          </Reveal>
          <Reveal index={1}>
            <Section>
              {tests === undefined ? (
                <Skeleton height={220} />
              ) : tests.length === 0 ? (
                <EmptyState
                  icon="edit-3"
                  title={t("tests.empty")}
                  body={t("tests.emptyBody")}
                  action={<Button icon="plus" label={t("tests.newTest")} onPress={openNew} />}
                />
              ) : (
                <ListGroup>
                  {tests.map((x) => (
                    <ListRow
                      key={x._id}
                      title={x.title}
                      subtitle={[x.subject, x.batchName, dateLabel(x.date)].filter(Boolean).join(" · ")}
                      trailing={
                        <View style={{ alignItems: "flex-end" }}>
                          <Text latin variant="label" weight="semibold" tabular color={x.resultCount > 0 ? "text" : "textFaint"}>
                            {x.resultCount}/{enrolled.get(x.batchId) ?? "—"}
                          </Text>
                          <Text latin variant="caption" color="textFaint" tabular>
                            {t("tests.outOf", { total: x.totalMarks })}
                          </Text>
                        </View>
                      }
                      onPress={() => router.push(`/tests/${x._id}` as never)}
                    />
                  ))}
                </ListGroup>
              )}
            </Section>
          </Reveal>
        </>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("tests.createTitle")}
        footer={<Button full label={t("tests.create")} loading={saving} onPress={submit} />}
      >
        <View style={{ gap: space.lg }}>
          <Select label={t("tests.batch")} value={batchId} options={batchOptions} onChange={setBatchId} />
          <Input label={t("tests.name")} value={title} onChangeText={setTitle} placeholder={t("tests.namePlaceholder")} />
          <Input label={`${t("tests.subject")} (${t("common.optional")})`} value={subject} onChangeText={setSubject} placeholder={t("tests.subjectPlaceholder")} />
          <DateField label={t("tests.date")} value={date} onChange={setDate} />
          <Input label={t("tests.totalMarks")} value={total} onChangeText={setTotal} keyboardType="number-pad" latin />
          {error ? (
            <Text variant="caption" color="danger">
              {error}
            </Text>
          ) : null}
        </View>
      </Sheet>
    </Screen>
  );
}
