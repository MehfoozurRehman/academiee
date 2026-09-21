import { View } from "react-native";
import { Redirect, router } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSession } from "../../context/session";
import { useTheme } from "../../theme";
import { AppBar, AppText, Card, Row, Screen } from "../../components/ui";
import { Icon, type IconName } from "../../components/Icon";

const SECTIONS: { heading: string; items: { label: string; href: string; icon: IconName }[] }[] = [
  {
    heading: "Academy",
    items: [
      { label: "Teachers", href: "/teachers", icon: "teachers" },
      { label: "Courses", href: "/courses", icon: "courses" },
      { label: "Batches", href: "/batches", icon: "batches" },
      { label: "Timetable", href: "/timetable", icon: "timetable" },
    ],
  },
  {
    heading: "Academics",
    items: [{ label: "Tests & Results", href: "/tests", icon: "tests" }],
  },
  {
    heading: "Money",
    items: [
      { label: "Expenses", href: "/expenses", icon: "expenses" },
      { label: "Salaries", href: "/salary", icon: "salary" },
    ],
  },
  {
    heading: "Tools",
    items: [
      { label: "WhatsApp", href: "/whatsapp", icon: "whatsapp" },
      { label: "Recycle Bin", href: "/recycle-bin", icon: "recycle" },
      { label: "Seed Sample Data", href: "/seed", icon: "settings" },
      { label: "Settings", href: "/settings", icon: "settings" },
    ],
  },
];

export default function More() {
  const t = useTheme();
  const { session, signOut, clearAcademy } = useSession();

  const academies = useQuery(
    api.academies.getMyAcademies,
    session ? { ownerId: session.userId } : "skip"
  );

  if (!session) return <Redirect href="/login" />;
  if (!session.academyId) return <Redirect href="/select-academy" />;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AppBar title="More" subtitle={session.name} large />

      <Screen scroll>
        {SECTIONS.map((section) => (
          <View key={section.heading} style={{ gap: t.spacing.sm }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              {section.heading.toUpperCase()}
            </AppText>
            <Card padded={false}>
              {section.items.map((item, i) => (
                <Row
                  key={item.href}
                  title={item.label}
                  last={i === section.items.length - 1}
                  onPress={() => router.push(item.href as never)}
                  leading={
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: t.radius.sm,
                        backgroundColor: t.colors.accentSoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name={item.icon} size={17} color={t.colors.accent} />
                    </View>
                  }
                />
              ))}
            </Card>
          </View>
        ))}

        <View style={{ gap: t.spacing.sm }}>
          <AppText variant="micro" color={t.colors.textMuted}>
            ACCOUNT
          </AppText>
          <Card padded={false}>
            {academies && academies.length > 1 ? (
              <Row
                title="Switch academy"
                subtitle={`${academies.length} academies`}
                onPress={async () => {
                  await clearAcademy();
                  router.replace("/select-academy");
                }}
                leading={
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: t.radius.sm,
                      backgroundColor: t.colors.infoSoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="academy" size={17} color={t.colors.info} />
                  </View>
                }
              />
            ) : null}

            <Row
              title="Sign out"
              last
              onPress={async () => {
                await signOut();
                router.replace("/login");
              }}
              leading={
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: t.radius.sm,
                    backgroundColor: t.colors.dangerSoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="logout" size={17} color={t.colors.danger} />
                </View>
              }
            />
          </Card>
        </View>
      </Screen>
    </View>
  );
}
