import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAcademy, useMe } from "../context/AcademyContext";
import { useI18n, type TKey } from "../i18n/I18nProvider";
import { useTheme } from "../theme/ThemeProvider";
import { layout, radius, space } from "../theme/tokens";
import { Logo } from "./Logo";
import { Divider, Icon, Pressable, Sheet, Text, type IconName } from "./ui";

export type NavItem = { href: string; label: TKey; icon: IconName };

// Main destinations: the bottom bar on phones shows the first four + More.
export const PRIMARY: NavItem[] = [
  { href: "/home", label: "nav.home", icon: "grid" },
  { href: "/students", label: "nav.students", icon: "users" },
  { href: "/fees", label: "nav.fees", icon: "credit-card" },
  { href: "/attendance", label: "nav.attendance", icon: "check-square" },
];

export const SECONDARY: NavItem[] = [
  { href: "/classes", label: "nav.classes", icon: "layers" },
  { href: "/tests", label: "nav.tests", icon: "award" },
  { href: "/timetable", label: "nav.timetable", icon: "calendar" },
  { href: "/notices", label: "nav.notices", icon: "bell" },
  { href: "/expenses", label: "nav.expenses", icon: "trending-down" },
  { href: "/activity", label: "nav.activity", icon: "activity" },
  { href: "/settings", label: "nav.settings", icon: "settings" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active, onPress }: { item: NavItem; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Pressable
      onPress={onPress}
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

/** Lets the owner switch academy or add another. */
export function AcademySwitcher({ compact }: { compact?: boolean }) {
  const { academy, academies, select } = useAcademy();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!academy) return null;
  return (
    <>
      {compact ? (
        academies.length > 1 ? (
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t("nav.switchAcademy")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Icon name="repeat" size={18} color="textMuted" />
          </Pressable>
        ) : null
      ) : (
        <Pressable
          onPress={() => setOpen(true)}
          scaleTo={0.98}
          accessibilityRole="button"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            padding: space.sm,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="label" weight="bold" numberOfLines={1}>
              {academy.name}
            </Text>
            <Text latin variant="caption" color="textMuted">
              {academy.code}
            </Text>
          </View>
          <Icon name="chevron-down" size={16} color="textMuted" />
        </Pressable>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={t("nav.switchAcademy")}>
        <View style={{ gap: space.xs }}>
          {academies.map((a) => {
            const active = a._id === academy._id;
            return (
              <Pressable
                key={a._id}
                onPress={() => {
                  select(a._id);
                  setOpen(false);
                  router.replace("/home");
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.md,
                  padding: space.md,
                  borderRadius: radius.md,
                  backgroundColor: active ? colors.accentSoft : "transparent",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text weight="semibold" color={active ? "accent" : "text"}>
                    {a.name}
                  </Text>
                  <Text latin variant="caption" color="textMuted">
                    {a.code}
                    {a.city ? ` · ${a.city}` : ""}
                  </Text>
                </View>
                {active ? <Icon name="check" size={18} color="accent" /> : null}
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              setOpen(false);
              router.push("/setup");
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md }}
          >
            <Icon name="plus" size={18} color="accent" />
            <Text weight="semibold" color="accent">
              {t("nav.addAcademy")}
            </Text>
          </Pressable>
        </View>
      </Sheet>
    </>
  );
}

export function Sidebar() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const pathname = usePathname();
  const me = useMe();
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
      <View style={{ paddingHorizontal: space.sm }}>
        <Logo size={28} wordmark />
      </View>
      <AcademySwitcher />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 2 }}>
        {PRIMARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onPress={() => router.navigate(item.href as never)} />
        ))}
        <View style={{ height: space.md }} />
        {SECONDARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onPress={() => router.navigate(item.href as never)} />
        ))}
        {me?.isAdmin ? (
          <>
            <View style={{ height: space.md }} />
            <NavLink item={{ href: "/admin", label: "nav.admin", icon: "shield" }} active={false} onPress={() => router.navigate("/admin")} />
          </>
        ) : null}
      </ScrollView>
      <Divider />
      <Pressable
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

export function BottomBar() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const items: NavItem[] = [...PRIMARY, { href: "/more", label: "nav.more", icon: "menu" }];
  const moreActive = SECONDARY.some((s) => isActive(pathname, s.href)) || pathname === "/more";

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
        const active = item.href === "/more" ? moreActive : isActive(pathname, item.href);
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
