import { useWindowDimensions, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useConvexAuth } from "convex/react";
import { AdminSidebar, AdminTopBar } from "../../components/AdminNav";
import { Splash } from "../../components/Splash";
import { useMe } from "../../context/AcademyContext";
import { useTheme } from "../../theme/ThemeProvider";
import { layout } from "../../theme/tokens";

// Platform admin panel. Desktop-first sidebar; phones get a header with tabs.
export default function AdminLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useMe();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;

  if (isLoading || (isAuthenticated && me === undefined)) return <Splash />;
  if (!isAuthenticated || !me) return <Redirect href="/welcome" />;
  if (!me.isAdmin) return <Redirect href="/" />;

  const canGoBack = me.academies.length > 0;
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
        <AdminSidebar canGoBack={canGoBack} />
        <View style={{ flex: 1 }}>{stack}</View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AdminTopBar canGoBack={canGoBack} />
      <View style={{ flex: 1 }}>{stack}</View>
    </View>
  );
}
