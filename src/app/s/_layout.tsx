import { useWindowDimensions, View } from "react-native";
import { Redirect, Stack, router } from "expo-router";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Splash } from "../../components/Splash";
import { StudentBottomBar, StudentSidebar } from "../../components/StudentNav";
import { Button, EmptyState, Screen } from "../../components/ui";
import { useMe } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { layout } from "../../theme/tokens";

// Student portal: read-only, for signed-in students. Phones get a bottom bar,
// wide screens a sidebar.
export default function StudentLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useMe();
  const { signOut } = useAuthActions();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;

  if (isLoading || (isAuthenticated && me === undefined)) return <Splash />;
  if (!isAuthenticated || !me) return <Redirect href="/welcome" />;
  if (!me.student) return <Redirect href="/" />;

  if (!me.student.active || me.student.suspended) {
    const paused = !me.student.active;
    return (
      <Screen narrow>
        <EmptyState
          icon="lock"
          title={paused ? t("portal.inactiveTitle") : t("portal.suspendedTitle")}
          body={paused ? t("portal.inactiveBody") : t("portal.suspendedBody")}
          action={<Button variant="secondary" icon="log-out" label={t("settings.signOut")} onPress={() => void signOut().then(() => router.replace("/welcome"))} />}
        />
      </Screen>
    );
  }

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: wide ? "fade" : "default",
      }}
    />
  );

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.bg }}>
        <StudentSidebar academyName={me.student.academyName} />
        <View style={{ flex: 1 }}>{stack}</View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>{stack}</View>
      <StudentBottomBar />
    </View>
  );
}
