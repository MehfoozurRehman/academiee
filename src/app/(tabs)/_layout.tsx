import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useTheme } from "../../theme";
import { Icon, type IconName } from "../../components/Icon";

export default function TabsLayout() {
  const t = useTheme();

  const tabs: { name: string; title: string; icon: IconName }[] = [
    { name: "dashboard", title: "Home", icon: "dashboard" },
    { name: "students", title: "Students", icon: "students" },
    { name: "fees", title: "Fees", icon: "fees" },
    { name: "attendance", title: "Attendance", icon: "attendance" },
    { name: "more", title: "More", icon: "more" },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.accent,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          borderTopWidth: Platform.OS === "ios" ? 0.5 : 1,
          height: Platform.OS === "ios" ? 84 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  );
}
