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

export const ADMIN_ITEMS: Item[] = [
  { href: "/admin", label: "admin.overview", icon: "grid" },
  { href: "/admin/users", label: "admin.users", icon: "users" },
];

// Academies live on the overview page and its detail pages.
function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/" || pathname.startsWith("/admin/academies");
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

export function AdminSidebar({ canGoBack }: { canGoBack: boolean }) {
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
        <Text variant="micro" color="textMuted">
          {t("admin.title")}
        </Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2 }}>
        {ADMIN_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        {canGoBack ? (
          <>
            <View style={{ height: space.md }} />
            <NavLink item={{ href: "/home", label: "admin.backToAcademy", icon: "arrow-left" }} active={false} />
          </>
        ) : (
          <>
            <View style={{ height: space.md }} />
            <NavLink item={{ href: "/setup", label: "nav.addAcademy", icon: "plus" }} active={false} />
          </>
        )}
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

/** Phones: a compact header with the title and horizontally scrolling tabs. */
export function AdminTopBar({ canGoBack }: { canGoBack: boolean }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthActions();

  const tabs: (Item & { active: boolean; go: () => void })[] = [
    { ...ADMIN_ITEMS[0], active: isActive(pathname, "/admin"), go: () => router.navigate("/admin") },
    { ...ADMIN_ITEMS[1], active: isActive(pathname, "/admin/users"), go: () => router.navigate("/admin/users" as never) },
  ];

  return (
    <View
      style={{
        paddingTop: insets.top + space.sm,
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Logo size={26} wordmark />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("admin.backToAcademy")}
              onPress={() => router.navigate("/home")}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted }}
            >
              <Icon name="home" size={17} color="textMuted" />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("nav.addAcademy")}
              onPress={() => router.navigate("/setup")}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted }}
            >
              <Icon name="plus" size={17} color="textMuted" />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("settings.signOut")}
            onPress={() => void signOut().then(() => router.replace("/welcome"))}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted }}
          >
            <Icon name="log-out" size={17} color="textMuted" />
          </Pressable>
        </View>
      </View>
      <View style={{ flexDirection: "row", paddingHorizontal: space.md, gap: space.xs }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab.active }}
            onPress={tab.go}
            style={{
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
              borderBottomWidth: 2,
              borderColor: tab.active ? colors.accent : "transparent",
            }}
          >
            <Text variant="label" weight="semibold" color={tab.active ? "accent" : "textMuted"}>
              {t(tab.label)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
