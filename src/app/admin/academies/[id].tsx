import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Badge, Button, Card, Divider, EmptyState, Input, ListGroup, ListRow, Reveal, Screen, Section, Sheet, Skeleton, Text, useToast } from "../../../components/ui";
import { useI18n } from "../../../i18n/I18nProvider";
import { errorMessage } from "../../../lib/errors";
import { space } from "../../../theme/tokens";

function dayOf(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Field({ label, value, latin }: { label: string; value: string | null; latin?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.lg, paddingVertical: space.sm }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text latin={latin} variant="label" style={{ flexShrink: 1 }} align="end">
        {value || "—"}
      </Text>
    </View>
  );
}

export default function AdminAcademy() {
  const { t, dateLabel } = useI18n();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useQuery(api.admin.academyDetail, { academyId: id as Id<"academies"> });
  const setSuspended = useMutation(api.admin.setSuspended);

  const [sheet, setSheet] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suspended = data?.academy.suspendedAt != null;

  async function confirm() {
    if (reason.trim().length < 3) {
      setError(t("admin.reasonTooShort"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setSuspended({ academyId: id as Id<"academies">, suspended: !suspended, reason: reason.trim() });
      toast(suspended ? t("admin.restoredToast") : t("admin.suspendedToast"));
      setSheet(false);
      setReason("");
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  }

  function openSheet() {
    setReason("");
    setError(null);
    setSheet(true);
  }

  function actionLabel(code: string) {
    const label = t(`activity.${code.replace(".", "_")}` as never);
    return label === `activity.${code.replace(".", "_")}` ? code : label;
  }

  return (
    <Screen back="/admin" narrow title={data?.academy.name ?? ""} subtitle={t("admin.detailTitle")}>
      {data === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={60} />
          <Skeleton height={220} />
          <Skeleton height={120} />
        </View>
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md, flexWrap: "wrap" }}>
                <Badge label={suspended ? t("admin.suspended") : t("admin.active")} tone={suspended ? "danger" : "success"} />
                <Button
                  size="sm"
                  variant={suspended ? "secondary" : "danger"}
                  icon={suspended ? "unlock" : "slash"}
                  label={suspended ? t("admin.unsuspend") : t("admin.suspend")}
                  onPress={openSheet}
                />
              </View>
            </Section>
          </Reveal>

          <Reveal index={1}>
            <Section title={t("admin.info")}>
              <Card style={{ paddingVertical: space.sm }}>
                <Field label={t("admin.code")} value={data.academy.code} latin />
                <Divider />
                <Field label={t("admin.city")} value={data.academy.city} />
                <Divider />
                <Field label={t("admin.phone")} value={data.academy.phone} latin />
                <Divider />
                <Field label={t("admin.whatsapp")} value={data.academy.whatsapp} latin />
                <Divider />
                <Field label={t("admin.address")} value={data.academy.address} />
                <Divider />
                <Field label={t("admin.created")} value={dateLabel(dayOf(data.academy.created))} />
              </Card>
            </Section>
          </Reveal>

          <Reveal index={2}>
            <Section title={t("admin.owner")}>
              <Card style={{ paddingVertical: space.sm }}>
                {data.owner ? (
                  <>
                    <Field label={t("admin.ownerName")} value={data.owner.name} />
                    <Divider />
                    <Field label={t("admin.ownerEmail")} value={data.owner.email} latin />
                  </>
                ) : (
                  <Text color="textMuted" style={{ paddingVertical: space.sm }}>
                    {t("admin.unknownOwner")}
                  </Text>
                )}
              </Card>
            </Section>
          </Reveal>

          <Reveal index={3}>
            <Section title={t("admin.counts")}>
              <View style={{ flexDirection: "row", gap: space.md, flexWrap: "wrap" }}>
                {[
                  { label: t("admin.countStudents"), value: data.counts.students },
                  { label: t("admin.countBatches"), value: data.counts.batches },
                  { label: t("admin.countCourses"), value: data.counts.courses },
                ].map((c) => (
                  <Card key={c.label} style={{ flex: 1, minWidth: 100, gap: space.xs }}>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {c.label}
                    </Text>
                    <Text latin variant="heading" weight="bold" tabular>
                      {c.value}
                    </Text>
                  </Card>
                ))}
              </View>
            </Section>
          </Reveal>

          <Reveal index={4}>
            <Section title={t("admin.audit")}>
              {data.audit.length === 0 ? (
                <Card>
                  <Text color="textMuted">{t("admin.noAudit")}</Text>
                </Card>
              ) : (
                <ListGroup>
                  {data.audit.map((l) => (
                    <ListRow
                      key={l._id}
                      title={actionLabel(l.action)}
                      subtitle={l.detail ? `${l.detail} · ${dateLabel(dayOf(l.at))}` : dateLabel(dayOf(l.at))}
                    />
                  ))}
                </ListGroup>
              )}
            </Section>
          </Reveal>
        </>
      )}
      {data === null ? <EmptyState icon="alert-circle" title={t("admin.notFound")} /> : null}

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title={suspended ? t("admin.unsuspendTitle") : t("admin.suspendTitle")}
        subtitle={suspended ? t("admin.unsuspendBody") : t("admin.suspendBody")}
        footer={
          <Button
            full
            loading={busy}
            variant={suspended ? "primary" : "danger"}
            label={suspended ? t("admin.unsuspend") : t("admin.suspend")}
            onPress={() => void confirm()}
          />
        }
      >
        <Input
          label={t("admin.reason")}
          placeholder={t("admin.reasonPlaceholder")}
          hint={t("admin.reasonHint")}
          value={reason}
          onChangeText={(v) => {
            setReason(v);
            setError(null);
          }}
          error={error ?? undefined}
          maxLength={200}
        />
      </Sheet>
    </Screen>
  );
}
