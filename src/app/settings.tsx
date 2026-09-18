import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
import {
  AppBar,
  AppText,
  Button,
  Card,
  ErrorNote,
  Field,
  Loader,
  Row,
  Screen,
} from "../components/ui";
import { Sheet } from "../components/Sheet";
import { Wordmark } from "../components/Wordmark";
import { cleanError } from "../lib/errors";

export default function Settings() {
  const t = useTheme();
  const { session } = useSession();

  const academy = useQuery(
    api.academies.getAcademy,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );
  const fields = useQuery(
    api.customFields.listFields,
    session?.academyId ? { academyId: session.academyId } : "skip"
  );

  const update = useMutation(api.academies.updateAcademy);
  const addField = useMutation(api.customFields.addField);
  const removeField = useMutation(api.customFields.removeField);
  const changePassword = useMutation(api.auth.changePassword);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [fieldSheet, setFieldSheet] = useState(false);
  const [fieldLabel, setFieldLabel] = useState("");

  const [pwSheet, setPwSheet] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  useEffect(() => {
    if (!academy) return;
    setName(academy.name);
    setPhone(academy.phone);
    setEmail(academy.email);
    setAddress(academy.address);
    setWhatsapp(academy.whatsappNumber);
  }, [academy]);

  if (academy === undefined || fields === undefined) return <Loader />;

  async function save() {
    if (!session?.academyId) return;
    setBusy(true);
    setError("");
    try {
      await update({
        academyId: session.academyId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        whatsappNumber: whatsapp.trim(),
      });
      Alert.alert("Saved", "Academy details updated.");
    } catch (e) {
      setError(cleanError(e, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Settings" onBack={() => router.back()} />

      <Screen scroll>
        <Card>
          <Wordmark />
        </Card>

        <View style={{ gap: t.spacing.sm }}>
          <AppText variant="micro" color={t.colors.textMuted}>
            ACADEMY
          </AppText>
          <View style={{ gap: t.spacing.md }}>
            <Field label="Name" value={name} onChangeText={setName} />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Address" value={address} onChangeText={setAddress} />
            <Field label="WhatsApp number" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
            <ErrorNote message={error} />
            <Button label="Save changes" onPress={save} loading={busy} />
          </View>
        </View>

        <View style={{ gap: t.spacing.sm }}>
          <AppText variant="micro" color={t.colors.textMuted}>
            CUSTOM STUDENT FIELDS
          </AppText>
          <Card padded={false}>
            {fields.length === 0 ? (
              <Row title="No custom fields" subtitle="Add fields like CNIC or Blood Group" last />
            ) : (
              fields.map((f, i) => (
                <Row
                  key={f.fieldId}
                  title={f.label}
                  subtitle={f.key}
                  last={i === fields.length - 1}
                  onPress={() =>
                    Alert.alert("Remove field?", f.label, [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => removeField({ fieldId: f.fieldId }),
                      },
                    ])
                  }
                />
              ))
            )}
          </Card>
          <Button label="Add field" variant="tonal" onPress={() => setFieldSheet(true)} />
        </View>

        <View style={{ gap: t.spacing.sm }}>
          <AppText variant="micro" color={t.colors.textMuted}>
            ACCOUNT
          </AppText>
          <Card padded={false}>
            <Row title="Signed in as" meta={session?.email} />
            <Row title="Change password" onPress={() => setPwSheet(true)} last />
          </Card>
        </View>
      </Screen>

      <Sheet open={fieldSheet} onClose={() => setFieldSheet(false)} title="Add custom field">
        <View style={{ gap: t.spacing.md }}>
          <Field label="Label" value={fieldLabel} onChangeText={setFieldLabel} placeholder="Blood Group" autoCapitalize="words" />
          <Button
            label="Add field"
            onPress={async () => {
              if (!session?.academyId || !fieldLabel.trim()) return;
              try {
                await addField({
                  academyId: session.academyId,
                  label: fieldLabel.trim(),
                  key: fieldLabel.trim(),
                });
                setFieldLabel("");
                setFieldSheet(false);
              } catch (e) {
                Alert.alert("Failed", cleanError(e, "Unknown error"));
              }
            }}
          />
        </View>
      </Sheet>

      <Sheet open={pwSheet} onClose={() => setPwSheet(false)} title="Change password">
        <View style={{ gap: t.spacing.md }}>
          <Field label="Current password" value={current} onChangeText={setCurrent} secure autoCapitalize="none" />
          <Field label="New password" value={next} onChangeText={setNext} secure autoCapitalize="none" />
          <Button
            label="Update password"
            onPress={async () => {
              if (!session) return;
              try {
                await changePassword({
                  userId: session.userId,
                  currentPassword: current,
                  newPassword: next,
                });
                setCurrent("");
                setNext("");
                setPwSheet(false);
                Alert.alert("Password updated");
              } catch (e) {
                Alert.alert(
                  "Failed",
                  cleanError(e, "Unknown error")
                );
              }
            }}
          />
        </View>
      </Sheet>
    </View>
  );
}
