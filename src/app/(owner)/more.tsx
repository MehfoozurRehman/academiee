import { View } from "react-native";
import { router } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { AcademySwitcher, SECONDARY } from "../../components/OwnerNav";
import { Button, Card, Icon, Pressable, Reveal, Screen, Section, Text, type IconName } from "../../components/ui";
import { useMe } from "../../context/AcademyContext";
import { useI18n, type TKey } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";

function Tile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        width: "48%",
        flexGrow: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        padding: space.md,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={18} color="accent" />
      </View>
      <Text variant="label" weight="semibold" style={{ flex: 1 }} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function More() {
  const { t } = useI18n();
  const me = useMe();
  const { signOut } = useAuthActions();

  const items: { href: string; label: TKey; icon: IconName }[] = [
    ...SECONDARY,
    ...(me?.isAdmin ? [{ href: "/admin", label: "nav.admin" as TKey, icon: "shield" as IconName }] : []),
  ];

  return (
    <Screen title={t("more.title")} subtitle={t("more.subtitle")} narrow>
      <Reveal index={0}>
        <Section title={t("more.yourAcademy")}>
          <AcademySwitcher />
          <Text variant="caption" color="textFaint">
            {t("more.switchHint")}
          </Text>
        </Section>
      </Reveal>
      <Reveal index={1}>
        <Section title={t("more.sections")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {items.map((item) => (
              <Tile key={item.href} icon={item.icon} label={t(item.label)} onPress={() => router.push(item.href as never)} />
            ))}
          </View>
        </Section>
      </Reveal>
      <Reveal index={2}>
        <Section title={t("more.account")}>
          <Card style={{ gap: space.md }}>
            {me ? (
              <Text variant="caption" color="textMuted">
                {t("more.signedInAs", { name: me.name ?? me.email ?? "" })}
              </Text>
            ) : null}
            <Button variant="secondary" icon="log-out" label={t("settings.signOut")} onPress={() => void signOut().then(() => router.replace("/welcome"))} />
          </Card>
        </Section>
      </Reveal>
    </Screen>
  );
}
