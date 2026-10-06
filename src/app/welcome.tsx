import { View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedWords } from "../components/AnimatedWords";
import { RedirectIfSignedIn } from "../components/RedirectIfSignedIn";
import { LanguageToggle } from "../components/LanguageToggle";
import { Logo } from "../components/Logo";
import { Icon, Pressable, Text, type IconName } from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import { useTheme } from "../theme/ThemeProvider";
import { radius, space } from "../theme/tokens";

function Choice({
  icon,
  title,
  body,
  onPress,
  primary,
  index,
}: {
  icon: IconName;
  title: string;
  body: string;
  onPress: () => void;
  primary?: boolean;
  index: number;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(500 + index * 90).springify().damping(18)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        scaleTo={0.985}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.lg,
          padding: space.lg,
          borderRadius: radius.lg,
          backgroundColor: primary ? colors.accent : colors.surface,
          borderWidth: primary ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: primary ? "rgba(255,255,255,0.16)" : colors.accentSoft,
          }}
        >
          <Icon name={icon} size={20} color={primary ? "onAccent" : "accent"} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" weight="bold" color={primary ? "onAccent" : "text"}>
            {title}
          </Text>
          <Text variant="caption" color={primary ? "onAccent" : "textMuted"} style={primary ? { opacity: 0.85 } : undefined}>
            {body}
          </Text>
        </View>
        <Icon name="arrow-right" size={18} color={primary ? "onAccent" : "textFaint"} />
      </Pressable>
    </Animated.View>
  );
}

export default function Welcome() {
  const { t, lang } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <RedirectIfSignedIn />
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 460,
          alignSelf: "center",
          paddingHorizontal: space.xl,
          paddingTop: insets.top + space.lg,
          paddingBottom: insets.bottom + space.xl,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size={30} wordmark />
          <LanguageToggle />
        </View>

        <View style={{ flex: 1, justifyContent: "center", gap: space.lg, paddingVertical: space.xxxl }}>
          <AnimatedWords key={lang} text={t("auth.welcomeTitle")} />
          <Animated.View entering={FadeIn.delay(350).duration(500)}>
            <Text color="textMuted" style={{ maxWidth: 360 }}>
              {t("auth.welcomeBody")}
            </Text>
          </Animated.View>
        </View>

        <View style={{ gap: space.md }}>
          <Choice
            index={0}
            primary
            icon="briefcase"
            title={t("auth.iAmOwner")}
            body={t("auth.ownerBody")}
            onPress={() => router.push("/sign-in")}
          />
          <Choice
            index={1}
            icon="book-open"
            title={t("auth.iAmStudent")}
            body={t("auth.studentBody")}
            onPress={() => router.push("/student-sign-in")}
          />
        </View>
      </View>
    </View>
  );
}
