import { useState } from "react";
import { router } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthScaffold } from "../components/AuthScaffold";
import { RedirectIfSignedIn } from "../components/RedirectIfSignedIn";
import { Button, Input } from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import { errorCode, errorMessage } from "../lib/errors";

export default function StudentSignIn() {
  const { t } = useI18n();
  const { signIn } = useAuthActions();
  const [academyCode, setAcademyCode] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!academyCode.trim() || !studentCode.trim() || !/^\d{6}$/.test(code)) {
      setError(t("auth.invalidStudent"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Students type "12" or "s-0012"; normalise to S-0012.
      const raw = studentCode.trim().toUpperCase().replace(/^S-?/, "");
      const normalised = /^\d+$/.test(raw) ? `S-${raw.padStart(4, "0")}` : studentCode.trim().toUpperCase();
      await signIn("student-code", {
        academyCode: academyCode.trim().toUpperCase(),
        studentCode: normalised,
        code,
      });
    } catch (e) {
      setError(errorCode(e) === "INVALID_STUDENT" ? t("auth.invalidStudent") : errorMessage(e, t("auth.invalidStudent")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <RedirectIfSignedIn />
      <AuthScaffold title={t("auth.studentTitle")} body={t("auth.studentBody")}>
      <Input
        label={t("auth.academyCode")}
        value={academyCode}
        onChangeText={(v) => setAcademyCode(v.toUpperCase())}
        placeholder={t("auth.academyCodePlaceholder")}
        autoCapitalize="characters"
        icon="home"
        latin
        autoFocus
      />
      <Input
        label={t("auth.studentId")}
        value={studentCode}
        onChangeText={setStudentCode}
        placeholder={t("auth.studentIdPlaceholder")}
        autoCapitalize="characters"
        icon="user"
        latin
      />
      <Input
        label={t("auth.accessCode")}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
        placeholder="••••••"
        keyboardType="number-pad"
        icon="key"
        latin
        maxLength={6}
        error={error ?? undefined}
        onSubmitEditing={submit}
      />
      <Button full size="lg" label={t("auth.signIn")} loading={busy} onPress={submit} />
    </AuthScaffold>
      </>
  );
}
