import { View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
import {
  AppBar,
  AppText,
  Avatar,
  Button,
  Card,
  EmptyState,
  Loader,
  Screen,
} from "../components/ui";

export default function SelectAcademy() {
  const t = useTheme();
  const { session, selectAcademy, signOut } = useSession();

  const academies = useQuery(
    api.academies.getMyAcademies,
    session ? { ownerId: session.userId } : "skip"
  );

  if (academies === undefined) return <Loader />;

  async function choose(academyId: Id<"academies">) {
    await selectAcademy(academyId);
    router.replace("/dashboard");
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar
        title="Your academies"
        subtitle={session?.name}
        large
        action={
          <Button
            label="Sign out"
            variant="ghost"
            compact
            full={false}
            onPress={async () => {
              await signOut();
              router.replace("/login");
            }}
          />
        }
      />

      <Screen scroll>
        {academies.length === 0 ? (
          <EmptyState
            title="No academies yet"
            message="Create your first academy to start managing students, fees and attendance."
            actionLabel="Create academy"
            onAction={() => router.push("/create-academy")}
          />
        ) : (
          <View style={{ gap: t.spacing.md }}>
            {academies.map((a) => (
              <Card key={a.academyId} onPress={() => choose(a.academyId)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}>
                  <Avatar name={a.name} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="heading">{a.name}</AppText>
                    <AppText variant="caption" color={t.colors.textMuted}>
                      {a.city} · {a.studentCount} student{a.studentCount === 1 ? "" : "s"}
                    </AppText>
                  </View>
                  <AppText variant="title" color={t.colors.textFaint}>
                    {t.isIOS ? "›" : "→"}
                  </AppText>
                </View>
              </Card>
            ))}

            <Button
              label="Add another academy"
              variant="tonal"
              onPress={() => router.push("/create-academy")}
            />
          </View>
        )}
      </Screen>
    </View>
  );
}
