import { useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Input,
  Pressable,
  Reveal,
  Screen,
  Section,
  Select,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from "../../components/ui";
import { useAcademyId } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { errorMessage } from "../../lib/errors";
import { useTheme } from "../../theme/ThemeProvider";
import { fonts, radius, space } from "../../theme/tokens";

function localDate(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// The kit's Input is single-line (fixed 50px), so the notice body uses a taller
// box built from the same tokens.
function MultilineInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const { lang, rtl } = useI18n();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.xs + 2 }}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <View
        style={{
          borderRadius: radius.md,
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? colors.accent : colors.borderStrong,
          backgroundColor: colors.surface,
          paddingHorizontal: space.md + 2,
          paddingVertical: space.sm,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            {
              minHeight: 120,
              color: colors.text,
              fontFamily: lang === "ur" ? fonts.urdu.regular : fonts.latin.medium,
              fontSize: 16,
              textAlign: Platform.OS === "web" && rtl ? "right" : "left",
              writingDirection: rtl ? "rtl" : "ltr",
            },
            Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null,
          ]}
        />
      </View>
    </View>
  );
}

export default function Notices() {
  const { t, dateLabel } = useI18n();
  const { colors } = useTheme();
  const toast = useToast();
  const academyId = useAcademyId();

  const notices = useQuery(api.notices.list, { academyId });
  const batches = useQuery(api.classes.listBatches, { academyId });
  const create = useMutation(api.notices.create);
  const remove = useMutation(api.notices.remove);

  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toDelete, setToDelete] = useState<{ id: Id<"notices">; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  const audienceOptions = [
    { value: "all", label: t("notices.everyone") },
    ...(batches ?? []).map((b) => ({ value: b._id as string, label: b.name, hint: b.courseName })),
  ];

  function openNew() {
    setAudience("all");
    setTitle("");
    setBody("");
    setError(null);
    setOpen(true);
  }

  async function submit() {
    if (title.trim().length < 2 || title.trim().length > 100) return setError(t("notices.titleRequired"));
    if (body.trim().length < 2 || body.trim().length > 2000) return setError(t("notices.bodyRequired"));
    setSaving(true);
    setError(null);
    try {
      await create({
        academyId,
        batchId: audience === "all" ? undefined : (audience as Id<"batches">),
        title,
        body,
      });
      toast(t("notices.published"), "success");
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDelError(null);
    try {
      await remove({ academyId, noticeId: toDelete.id });
      toast(t("notices.deleted"), "success");
      setToDelete(null);
    } catch (e) {
      setDelError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen
      narrow
      title={t("notices.title")}
      subtitle={t("notices.subtitle")}
      action={<Button size="sm" icon="plus" label={t("notices.new")} onPress={openNew} />}
    >
      {notices === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={110} />
          <Skeleton height={110} />
          <Skeleton height={110} />
        </View>
      ) : notices.length === 0 ? (
        <EmptyState
          icon="bell"
          title={t("notices.empty")}
          body={t("notices.emptyBody")}
          action={<Button icon="plus" label={t("notices.new")} onPress={openNew} />}
        />
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
                <Icon name="smartphone" size={16} color="textMuted" />
                <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                  {t("notices.studentsSee")}
                </Text>
              </View>
            </Section>
          </Reveal>
          <View style={{ gap: space.md }}>
            {notices.map((n, i) => (
              <Reveal key={n._id} index={Math.min(i + 1, 6)}>
                <Card style={{ gap: space.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
                    <View style={{ flex: 1, gap: space.xs }}>
                      <Text variant="label" weight="semibold">
                        {n.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" }}>
                        <Badge tone={n.batchId ? "accent" : "neutral"} label={n.batchName ?? t("notices.everyone")} />
                        <Text variant="caption" color="textFaint">
                          {dateLabel(localDate(n.createdAt))}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("notices.delete")}
                      onPress={() => {
                        setDelError(null);
                        setToDelete({ id: n._id, title: n.title });
                      }}
                      style={{ width: 44, height: 44, marginTop: -space.sm, marginEnd: -space.sm, alignItems: "center", justifyContent: "center", borderRadius: 22 }}
                    >
                      <Icon name="trash-2" size={18} color="textFaint" />
                    </Pressable>
                  </View>
                  <Text color="textMuted" numberOfLines={3}>
                    {n.body}
                  </Text>
                </Card>
              </Reveal>
            ))}
          </View>
        </>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("notices.new")}
        subtitle={t("notices.studentsSee")}
        footer={<Button full label={t("notices.publish")} loading={saving} onPress={submit} />}
      >
        <View style={{ gap: space.lg }}>
          <Select label={t("notices.audience")} value={audience} options={audienceOptions} onChange={setAudience} />
          <Input label={t("notices.titleLabel")} value={title} onChangeText={setTitle} placeholder={t("notices.titlePlaceholder")} />
          <MultilineInput label={t("notices.body")} value={body} onChangeText={setBody} placeholder={t("notices.bodyPlaceholder")} />
          {error ? (
            <Text variant="caption" color="danger">
              {error}
            </Text>
          ) : null}
        </View>
      </Sheet>

      <Sheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t("notices.deleteTitle")}
        footer={
          <View style={{ gap: space.sm }}>
            <Button full variant="danger" label={t("notices.delete")} loading={deleting} onPress={confirmDelete} />
            <Button full variant="secondary" label={t("common.cancel")} onPress={() => setToDelete(null)} />
          </View>
        }
      >
        <View style={{ gap: space.md }}>
          {toDelete ? <Text color="textMuted">{t("notices.deleteBody", { title: toDelete.title })}</Text> : null}
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
