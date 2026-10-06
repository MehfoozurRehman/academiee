import { ScrollView, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthActions } from "@convex-dev/auth/react";
import { useI18n, type TKey } from "../i18n/I18nProvider";
import { useTheme } from "../theme/ThemeProvider";
import { layout, radius, space } from "../theme/tokens";
import { Logo } from "./Logo";
import { Divider, Icon, Pressable, Text, type IconName } from "./ui";

type Item = { href: string; label: TKey; icon: IconName };

// Phone bottom bar: the four things students check most, then More.
export const STUDENT_PRIMARY: Item[] = [
  { href: "/s", label: "nav.home", icon: "home" },
  { href: "/s/fees", label: "nav.fees", icon: "credit-card" },
  { href: "/s/attendance", label: "nav.attendance", icon: "check-square" },
  { href: "/s/results", label: "nav.results", icon: "award" },
];
export const STUDENT_SECONDARY: Item[] = [
  { href: "/s/timetable", label: "nav.timetable", icon: "calendar" },
  { href: "/s/notices", label: "nav.notices", icon: "bell" },
];
const MORE: Item = { href: "/s/more", label: "nav.more", icon: "menu" };

function isActive(pathname: string, href: string) {
  if (href === "/s") return pathname === "/s" || pathname === "/s/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: Item; active: boolean }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Pressable
      onPress={() => router.navigate(item.href as never)}
      scaleTo={0.98}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        height: 40,
        paddingHorizontal: space.md,
        borderRadius: radius.sm + 2,
        backgroundColor: active ? colors.accentSoft : "transparent",
      }}
    >
      <Icon name={item.icon} size={18} color={active ? "accent" : "textMuted"} />
      <Text variant="label" weight={active ? "semibold" : "medium"} color={active ? "accent" : "text"}>
        {t(item.label)}
      </Text>
    </Pressable>
  );
}

export function StudentSidebar({ academyName }: { academyName?: string }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  return (
    <View
      style={{
        width: layout.sidebar,
        borderEndWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        paddingVertical: space.xl,
        paddingHorizontal: space.md,
        gap: space.lg,
      }}
    >
      <View style={{ paddingHorizontal: space.sm, gap: space.xs }}>
        <Logo size={28} wordmark />
        {academyName ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {academyName}
          </Text>
        ) : null}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2 }}>
        {STUDENT_PRIMARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <View style={{ height: space.md }} />
        {STUDENT_SECONDARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <View style={{ height: space.md }} />
        <NavLink item={{ ...MORE, icon: "settings" }} active={isActive(pathname, MORE.href)} />
      </ScrollView>
      <Divider />
      <Pressable
        accessibilityRole="button"
        onPress={() => void signOut().then(() => router.replace("/welcome"))}
        style={{ flexDirection: "row", alignItems: "center", gap: space.md, height: 40, paddingHorizontal: space.md }}
      >
        <Icon name="log-out" size={18} color="textMuted" />
        <Text variant="label" color="textMuted">
          {t("settings.signOut")}
        </Text>
      </Pressable>
    </View>
  );
}

export function StudentBottomBar() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const items = [...STUDENT_PRIMARY, MORE];
  const moreActive = isActive(pathname, MORE.href) || STUDENT_SECONDARY.some((s) => isActive(pathname, s.href));

  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingBottom: Math.max(insets.bottom, space.sm),
        paddingTop: space.sm,
      }}
    >
      {items.map((item) => {
        const active = item.href === MORE.href ? moreActive : isActive(pathname, item.href);
        return (
          <Pressable
            key={item.href}
            onPress={() => router.navigate(item.href as never)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            scaleTo={0.92}
            style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 2 }}
          >
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: radius.pill,
                backgroundColor: active ? colors.accentSoft : "transparent",
              }}
            >
              <Icon name={item.icon} size={20} color={active ? "accent" : "textMuted"} />
            </View>
            <Text variant="micro" color={active ? "accent" : "textMuted"} numberOfLines={1}>
              {t(item.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
