import { useWindowDimensions, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useConvexAuth } from "convex/react";
import { BottomBar, Sidebar } from "../../components/OwnerNav";
import { Splash } from "../../components/Splash";
import { EmptyState, Screen } from "../../components/ui";
import { useAcademy, useMe } from "../../context/AcademyContext";
import { useTheme } from "../../theme/ThemeProvider";
import { layout } from "../../theme/tokens";

// Owner area: only for signed-in owners with at least one academy. Wide
// screens get a sidebar; phones get a bottom bar.
export default function OwnerLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useMe();
  const { academy } = useAcademy();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const wide = width >= layout.wideBreakpoint;

  if (isLoading || (isAuthenticated && me === undefined)) return <Splash />;
  if (!isAuthenticated || !me) return <Redirect href="/welcome" />;
  if (me.student) return <Redirect href="/s" />;
  if (me.academies.length === 0) return <Redirect href={me.isAdmin ? "/admin" : "/setup"} />;
  if (!academy) return <Splash />;

  if (academy.suspended) {
    return (
      <Screen>
        <EmptyState
          icon="lock"
          title="This academy is suspended"
          body="Please contact Academiee support to restore access."
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
        <Sidebar />
        <View style={{ flex: 1 }}>{stack}</View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>{stack}</View>
      <BottomBar />
    </View>
  );
}
