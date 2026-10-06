import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { AuthScaffold } from "../components/AuthScaffold";
import { RedirectIfSignedIn } from "../components/RedirectIfSignedIn";
import { Button, Card, Input, Text } from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import { errorCode, errorMessage } from "../lib/errors";
import { space } from "../theme/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEV_TOOLS = process.env.EXPO_PUBLIC_DEV_TOOLS === "true";
const TEST_EMAIL = "owner@test.academiee.app";

export default function SignIn() {
  const { t } = useI18n();
  const { signIn } = useAuthActions();
  const requestCode = useMutation(api.authCodes.requestEmailCode);

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(address = email) {
    const clean = address.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError(t("auth.invalidEmail"));
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await requestCode({ email: clean });
      setEmail(clean);
      setDevCode(res.devCode);
      if (res.devCode) setCode(res.devCode);
      setStep("code");
      return res.devCode;
    } catch (e) {
      setError(errorMessage(e, t("common.somethingWrong")));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function verify(withCode = code, withEmail = email) {
    if (!/^\d{6}$/.test(withCode.trim())) {
      setError(t("auth.invalidCode"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn("email-code", { email: withEmail, code: withCode.trim() });
    } catch (e) {
      const c = errorCode(e);
      setError(c === "INVALID_CODE" ? t("auth.invalidCode") : errorMessage(e, t("auth.invalidCode")));
    } finally {
      setBusy(false);
    }
  }

  async function testAccount() {
    const dev = await send(TEST_EMAIL);
    if (dev) await verify(dev, TEST_EMAIL);
  }

  if (step === "code") {
    return (
      <>
      <RedirectIfSignedIn />
      <AuthScaffold
        title={t("auth.codeTitle")}
        body={t("auth.codeBody", { email })}
        onBack={() => {
          setStep("email");
          setCode("");
          setError(null);
        }}
      >
        {devCode ? (
          <Card tone="muted">
            <Text variant="caption" color="textMuted">
              Test mode — email isn't connected yet, so your code is shown here:
            </Text>
            <Text latin variant="title" tabular style={{ letterSpacing: 6, marginTop: 4 }}>
              {devCode}
            </Text>
          </Card>
        ) : null}
        <Input
          label={t("auth.code")}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          placeholder="••••••"
          latin
          autoFocus
          maxLength={6}
          error={error ?? undefined}
          onSubmitEditing={() => verify()}
        />
        <Button full size="lg" label={t("auth.verify")} loading={busy} onPress={() => verify()} />
        <Button
          full
          variant="ghost"
          label={t("auth.changeEmail")}
          onPress={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
        />
      </AuthScaffold>
      </>
    );
  }

  return (
    <>
      <RedirectIfSignedIn />
      <AuthScaffold title={t("auth.ownerTitle")} body={t("auth.ownerBody")}>
      <Input
        label={t("auth.email")}
        value={email}
        onChangeText={setEmail}
        placeholder={t("auth.emailPlaceholder")}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        icon="mail"
        latin
        autoFocus
        error={error ?? undefined}
        onSubmitEditing={() => send()}
      />
      <Button full size="lg" label={t("auth.sendCode")} loading={busy} onPress={() => send()} />
      {DEV_TOOLS ? (
        <View style={{ gap: space.xs, alignItems: "center", marginTop: space.md }}>
          <Button variant="secondary" label={t("auth.testLogin")} icon="zap" onPress={testAccount} disabled={busy} />
          <Text variant="caption" color="textFaint" align="center">
            {t("auth.testLoginHint")}
          </Text>
        </View>
      ) : null}
    </AuthScaffold>
      </>
  );
}
