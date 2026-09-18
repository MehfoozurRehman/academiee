import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
import { AppBar, AppText, Button, ErrorNote, Field, Screen } from "../components/ui";

export default function CreateAcademy() {
  const t = useTheme();
  const { session, selectAcademy } = useSession();
  const createAcademy = useMutation(api.academies.createAcademy);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canGoBack = (session?.academyId ?? null) !== null;

  async function submit() {
    if (!session) return;

    if (!name.trim() || !phone.trim() || !city.trim()) {
      setError("Academy name, phone and city are required");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await createAcademy({
        ownerId: session.userId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, "")}@academy.pk`,
        address: address.trim() || city.trim(),
        city: city.trim(),
        country: "Pakistan",
        currency: "PKR",
        whatsappNumber: whatsapp.trim() || phone.trim(),
      });

      await selectAcademy(result.academyId);
      router.replace("/dashboard");
    } catch (e) {
      setError(
        e instanceof Error ? e.message.replace(/^.*Uncaught Error:\s*/, "") : "Could not create academy"
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
      <AppBar
        title="New academy"
        onBack={canGoBack ? () => router.back() : undefined}
      />
      <Screen scroll>
        <AppText variant="callout" color={t.colors.textMuted}>
          You can change any of this later in Settings.
        </AppText>

        <View style={{ gap: t.spacing.md }}>
          <Field label="Academy name" value={name} onChangeText={setName} placeholder="Bright Future Academy" autoCapitalize="words" />
          <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="042-35789123" keyboardType="phone-pad" />
          <Field label="City" value={city} onChangeText={setCity} placeholder="Lahore" autoCapitalize="words" />
          <Field label="Address" value={address} onChangeText={setAddress} placeholder="Main Boulevard, Gulberg III" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="info@academy.pk"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="WhatsApp number"
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="923001234567"
            keyboardType="phone-pad"
          />

          <ErrorNote message={error} />

          <Button label="Create academy" onPress={submit} loading={busy} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
