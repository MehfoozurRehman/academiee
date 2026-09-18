import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme } from "../../theme";

const TABS = [
  { name: "dashboard", label: "Home", sf: "square.grid.2x2", md: "dashboard" },
  { name: "students", label: "Students", sf: "person.2", md: "group" },
  { name: "fees", label: "Fees", sf: "creditcard", md: "payments" },
  { name: "attendance", label: "Attendance", sf: "checkmark.circle", md: "fact_check" },
  { name: "more", label: "More", sf: "ellipsis.circle", md: "more_horiz" },
] as const;

export default function TabsLayout() {
  const t = useTheme();

  return (
    <NativeTabs
      tintColor={t.colors.accent}
      iconColor={{ default: t.colors.textMuted, selected: t.colors.accent }}
      labelStyle={{ fontSize: 11, fontWeight: "600" }}
      minimizeBehavior="onScrollDown"
    >
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
