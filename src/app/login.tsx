import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
import { AppText, Button, ErrorNote, Field, Screen } from "../components/ui";
import { Mark } from "../components/Wordmark";
import { cleanError } from "../lib/errors";

export default function Login() {
  const t = useTheme();
  const { signIn } = useSession();
  const login = useMutation(api.auth.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await login({ email, password });

      await signIn({
        userId: result.userId,
        name: result.name,
        email: result.email,
        role: result.role,
        academyId: result.soleAcademyId ?? null,
      });

      if (result.role === "admin") router.replace("/admin");
      else if (result.soleAcademyId) router.replace("/dashboard");
      else if (result.academyCount === 0) router.replace("/create-academy");
      else router.replace("/select-academy");
    } catch (e) {
      setError(cleanError(e, "Sign in failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: t.colors.bg }}
    >
      <Screen scroll>
        <View style={{ height: t.spacing.xxl * 2 }} />

        <View style={{ gap: t.spacing.xs }}>
          <View style={{ marginBottom: t.spacing.lg }}>
            <Mark size={56} />
          </View>

          <AppText variant="display">Welcome back</AppText>
          <AppText variant="callout" color={t.colors.textMuted}>
            Sign in to manage your academy
          </AppText>
        </View>

        <View style={{ gap: t.spacing.md, marginTop: t.spacing.lg }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@academy.pk"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secure
            autoCapitalize="none"
          />

          <ErrorNote message={error} />

          <Button label="Sign in" onPress={submit} loading={busy} />
          <Button
            label="Create an academy account"
            onPress={() => router.push("/signup")}
            variant="ghost"
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
