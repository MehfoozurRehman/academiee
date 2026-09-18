import { View } from "react-native";
import { Redirect, router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
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
  Row,
  Screen,
} from "../components/ui";

export default function Admin() {
  const t = useTheme();
  const { session, signOut } = useSession();

  const academies = useQuery(
    api.academies.listAllForAdmin,
    session?.role === "admin" ? { adminId: session.userId } : "skip"
  );

  if (!session) return <Redirect href="/login" />;
  if (session.role !== "admin") return <Redirect href="/" />;
  if (academies === undefined) return <Loader />;

  const totalStudents = academies.reduce((s, a) => s + a.studentCount, 0);
  const totalTeachers = academies.reduce((s, a) => s + a.teacherCount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar
        title="Administration"
        subtitle={session.email}
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
        <View style={{ flexDirection: "row", gap: t.spacing.md }}>
          {[
            { label: "Academies", value: academies.length },
            { label: "Students", value: totalStudents },
            { label: "Teachers", value: totalTeachers },
          ].map((s) => (
            <Card key={s.label} style={{ flex: 1 }}>
              <View style={{ gap: 4 }}>
                <AppText variant="caption" color={t.colors.textMuted}>
                  {s.label}
                </AppText>
                <AppText variant="title">{String(s.value)}</AppText>
              </View>
            </Card>
          ))}
        </View>

        {academies.length === 0 ? (
          <EmptyState
            title="No academies registered"
            message="Academies appear here once owners sign up and create them."
          />
        ) : (
          <View style={{ gap: t.spacing.sm }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              ALL ACADEMIES
            </AppText>
            <Card padded={false}>
              {academies.map((a, i) => (
                <Row
                  key={a.academyId}
                  title={a.name}
                  subtitle={`${a.ownerName} · ${a.ownerEmail}`}
                  meta={`${a.studentCount} students`}
                  badge={a.city}
                  badgeTone="accent"
                  last={i === academies.length - 1}
                  leading={<Avatar name={a.name} />}
                />
              ))}
            </Card>
          </View>
        )}

        <AppText variant="caption" color={t.colors.textMuted}>
          Administrators have read-only oversight. Academies are created and managed by
          their owners.
        </AppText>
      </Screen>
    </View>
  );
}
