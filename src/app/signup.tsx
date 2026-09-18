import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
import { AppBar, AppText, Button, ErrorNote, Field, Screen } from "../components/ui";

export default function Signup() {
  const t = useTheme();
  const { signIn } = useSession();
  const signup = useMutation(api.auth.signup);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim() || !email.trim() || !password) {
      setError("Fill in your name, email and password");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await signup({
        email,
        password,
        name,
        phone: phone.trim() || undefined,
      });

      await signIn({
        userId: result.userId,
        name: result.name,
        email: result.email,
        role: result.role,
        academyId: null,
      });

      router.replace("/create-academy");
    } catch (e) {
      setError(
        e instanceof Error ? e.message.replace(/^.*Uncaught Error:\s*/, "") : "Sign up failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: t.colors.bg }}
    >
      <AppBar title="Create account" onBack={() => router.back()} />
      <Screen scroll>
        <AppText variant="callout" color={t.colors.textMuted}>
          Your account can hold more than one academy.
        </AppText>

        <View style={{ gap: t.spacing.md }}>
          <Field label="Full name" value={name} onChangeText={setName} placeholder="Mohib Ali" autoCapitalize="words" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@academy.pk"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="03001234567"
            keyboardType="phone-pad"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secure
            autoCapitalize="none"
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat your password"
            secure
            autoCapitalize="none"
          />

          <ErrorNote message={error} />

          <Button label="Create account" onPress={submit} loading={busy} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
