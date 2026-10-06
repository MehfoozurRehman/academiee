import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { Button, Card, Icon, Input, Pressable, Reveal, Screen, Section, Segmented, Skeleton, Text, useToast } from "../../components/ui";
import { useAcademyId, useMe } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { errorMessage } from "../../lib/errors";
import { useTheme, type ThemePreference } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { colors, preference, setPreference } = useTheme();
  const toast = useToast();
  const me = useMe();
  const academyId = useAcademyId();
  const academy = useQuery(api.academies.get, { academyId });
  const update = useMutation(api.academies.update);
  const setMyName = useMutation(api.academies.setMyName);
  const { signOut } = useAuthActions();

  const [form, setForm] = useState({ name: "", city: "", phone: "", whatsapp: "", address: "", feeDueDay: "10" });
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [myName, setName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (academy && academy._id !== loadedId) {
      setLoadedId(academy._id);
      setForm({
        name: academy.name,
        city: academy.city ?? "",
        phone: academy.phone ?? "",
        whatsapp: academy.whatsapp ?? "",
        address: academy.address ?? "",
        feeDueDay: String(academy.feeDueDay),
      });
    }
  }, [academy, loadedId]);

  useEffect(() => {
    if (me && !nameLoaded) {
      setNameLoaded(true);
      setName(me.name ?? "");
    }
  }, [me, nameLoaded]);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFormError(null);
  };

  async function saveAcademy() {
    const day = Number(form.feeDueDay);
    if (form.name.trim().length < 2) return setFormError(t("settingsUi.nameTooShort"));
    if (!Number.isInteger(day) || day < 1 || day > 28) return setFormError(t("settingsUi.dueDayRange"));
    setSaving(true);
    setFormError(null);
    try {
      await update({
        academyId,
        name: form.name,
        city: form.city,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: form.address,
        feeDueDay: day,
      });
      toast(t("settingsUi.saved"));
    } catch (e) {
      setFormError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  async function saveName() {
    if (myName.trim().length < 2) return setNameError(t("settingsUi.yourNameTooShort"));
    setSavingName(true);
    setNameError(null);
    try {
      await setMyName({ name: myName });
      toast(t("settingsUi.saved"));
    } catch (e) {
      setNameError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSavingName(false);
    }
  }

  return (
    <Screen title={t("settingsUi.title")} narrow>
      {academy === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={110} />
          <Skeleton height={380} />
        </View>
      ) : (
        <>
          <Reveal index={0}>
            <Section>
              <Card tone="accent" style={{ gap: space.sm, padding: space.xl }}>
                <Text variant="label" color="onAccent" style={{ opacity: 0.8 }}>
                  {t("settingsUi.codeTitle")}
                </Text>
                <Text latin variant="display" color="onAccent" selectable style={{ letterSpacing: 2 }}>
                  {academy.code}
                </Text>
                <Text variant="caption" color="onAccent" style={{ opacity: 0.85 }}>
                  {t("settingsUi.codeBody")}
                </Text>
              </Card>
            </Section>
          </Reveal>

          <Reveal index={1}>
            <Section title={t("settingsUi.academyDetails")}>
              <Card style={{ gap: space.lg }}>
                <Input label={t("settingsUi.academyName")} value={form.name} onChangeText={set("name")} maxLength={80} />
                <Input label={t("settingsUi.city")} value={form.city} onChangeText={set("city")} />
                <Input latin label={t("settingsUi.phone")} value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
                <Input latin label={t("settingsUi.whatsapp")} value={form.whatsapp} onChangeText={set("whatsapp")} keyboardType="phone-pad" />
                <Input label={t("settingsUi.address")} value={form.address} onChangeText={set("address")} />
                <Input
                  latin
                  label={t("settingsUi.feeDueDay")}
                  hint={t("settingsUi.feeDueDayHint")}
                  value={form.feeDueDay}
                  onChangeText={(v) => set("feeDueDay")(v.replace(/\D/g, "").slice(0, 2))}
                  keyboardType="number-pad"
                  error={formError ?? undefined}
                />
                <Button full loading={saving} label={t("settingsUi.saveChanges")} onPress={() => void saveAcademy()} />
              </Card>
            </Section>
          </Reveal>

          <Reveal index={2}>
            <Section title={t("settingsUi.yourDetails")}>
              <Card style={{ gap: space.lg }}>
                <Input label={t("settingsUi.yourName")} value={myName} onChangeText={(v) => { setName(v); setNameError(null); }} error={nameError ?? undefined} maxLength={60} />
                {me?.email ? (
                  <View style={{ gap: space.xs }}>
                    <Text variant="label" color="textMuted">
                      {t("settingsUi.email")}
                    </Text>
                    <Text latin>{me.email}</Text>
                  </View>
                ) : null}
                <Button full variant="secondary" loading={savingName} label={t("common.save")} onPress={() => void saveName()} />
              </Card>
            </Section>
          </Reveal>

          <Reveal index={3}>
            <Section title={t("settingsUi.language")}>
              <Segmented
                value={lang}
                onChange={setLang}
                options={[
                  { value: "en", label: t("settings.english") },
                  { value: "ur", label: t("settings.urdu") },
                ]}
              />
            </Section>
            <Section title={t("settingsUi.appearance")}>
              <Segmented<ThemePreference>
                value={preference}
                onChange={setPreference}
                options={[
                  { value: "system", label: t("settings.system") },
                  { value: "light", label: t("settings.light") },
                  { value: "dark", label: t("settings.dark") },
                ]}
              />
            </Section>
          </Reveal>

          <Reveal index={4}>
            <Section title={t("settingsUi.accountTitle")}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/setup")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.md,
                  padding: space.md,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="plus" size={18} color="accent" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="label" weight="semibold">
                    {t("settingsUi.addAcademy")}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    {t("settingsUi.addAcademyBody")}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color="textFaint" />
              </Pressable>
              <Button variant="secondary" full icon="log-out" label={t("settings.signOut")} onPress={() => void signOut().then(() => router.replace("/welcome"))} />
            </Section>
          </Reveal>

          <Reveal index={5}>
            <Section title={t("settingsUi.deleteTitle")}>
              <Card tone="muted">
                <Text variant="caption" color="textMuted">
                  {t("settingsUi.deleteBody")}
                </Text>
              </Card>
            </Section>
          </Reveal>
        </>
      )}
    </Screen>
  );
}
