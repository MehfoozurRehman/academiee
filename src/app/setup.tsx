import { useState } from "react";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { AuthScaffold } from "../components/AuthScaffold";
import { Button, Input } from "../components/ui";
import { useAcademy, useMe } from "../context/AcademyContext";
import { useI18n } from "../i18n/I18nProvider";
import { errorMessage } from "../lib/errors";

// First run for a new owner (or "add another academy" later).
export default function Setup() {
  const { t } = useI18n();
  const me = useMe();
  const { select } = useAcademy();
  const { signOut } = useAuthActions();
  const create = useMutation(api.academies.create);
  const setMyName = useMutation(api.academies.setMyName);

  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needsName = me && !me.name;
  const first = (me?.academies.length ?? 0) === 0;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (needsName) await setMyName({ name: owner });
      const { academyId } = await create({ name, city, phone, whatsapp: phone });
      select(academyId);
      router.replace("/home");
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScaffold
      title={first ? t("setup.title") : t("setup.addTitle")}
      body={t("setup.body")}
      onBack={first ? () => void signOut().then(() => router.replace("/welcome")) : undefined}
    >
      {needsName ? (
        <Input label={t("setup.yourName")} value={owner} onChangeText={setOwner} placeholder={t("setup.yourNamePlaceholder")} icon="user" autoFocus />
      ) : null}
      <Input label={t("setup.academyName")} value={name} onChangeText={setName} placeholder={t("setup.academyNamePlaceholder")} icon="home" autoFocus={!needsName} />
      <Input label={t("setup.city")} value={city} onChangeText={setCity} placeholder={t("setup.cityPlaceholder")} icon="map-pin" />
      <Input
        label={t("setup.phone")}
        hint={t("setup.phoneHint")}
        value={phone}
        onChangeText={setPhone}
        placeholder="0300 1234567"
        keyboardType="phone-pad"
        icon="phone"
        latin
        error={error ?? undefined}
      />
      <Button full size="lg" label={t("setup.create")} loading={busy} onPress={submit} />
    </AuthScaffold>
  );
}
