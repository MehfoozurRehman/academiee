import { useState } from "react";
import { Alert, View } from "react-native";
import { Redirect } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
import { AppBar, Button, Loader } from "../components/ui";
import { cleanError } from "../lib/errors";

export default function SeedPage() {
  const t = useTheme();
  const { session } = useSession();
  const [busy, setBusy] = useState(false);

  const seedData = useMutation(api.seed.seedData);

  if (!session) return <Redirect href="/login" />;
  if (!session.academyId) return <Redirect href="/select-academy" />;

  async function handleSeed() {
    try {
      setBusy(true);
      const result = await seedData({ academyId: session.academyId });
      Alert.alert(
        "Sample data created!",
        `Created:\n• ${result.courses} courses\n• ${result.batches} batches\n• ${result.teachers} teachers\n• ${result.students} students\n• ${result.fees} fees`
      );
    } catch (e) {
      Alert.alert("Error", cleanError(e, "Failed to create sample data"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="Seed Sample Data" />

      <View style={{ flex: 1, padding: t.spacing.lg, justifyContent: "center", gap: t.spacing.lg }}>
        <View style={{ backgroundColor: t.colors.surface, padding: t.spacing.lg, borderRadius: t.radius.lg }}>
          <View style={{ gap: t.spacing.md }}>
            <View style={{ gap: t.spacing.sm }}>
              <View style={{ fontSize: 14, fontWeight: "600", marginBottom: t.spacing.sm }}>
                This will create sample data:
              </View>
              <View style={{ gap: t.spacing.xs }}>
                <View>• 4 courses (Math, English, Physics, Chemistry)</View>
                <View>• 12 batches (3 per course)</View>
                <View>• 5 teachers</View>
                <View>• 12 students distributed across batches</View>
                <View>• Fees with mixed payment statuses (paid, partial, due)</View>
              </View>
            </View>
          </View>
        </View>

        {busy ? (
          <Loader />
        ) : (
          <>
            <Button label="Create Sample Data" onPress={handleSeed} />
            <Button label="Close" variant="tonal" onPress={() => {}} />
          </>
        )}
      </View>
    </View>
  );
}
