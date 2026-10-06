import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { radius, space } from "../theme/tokens";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageToggle } from "./LanguageToggle";
import { Icon, Pressable, Text } from "./ui";

export function AuthScaffold({
  title,
  body,
  children,
  onBack,
}: {
  title: string;
  body: string;
  children: ReactNode;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 440,
            alignSelf: "center",
            paddingHorizontal: space.xl,
            paddingTop: insets.top + space.lg,
            paddingBottom: insets.bottom + space.xl,
            gap: space.xxl,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
              onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/welcome")))}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Icon name="arrow-left" size={18} />
            </Pressable>
            <LanguageToggle />
          </View>
          <Animated.View entering={FadeInDown.duration(380).springify().damping(18)} style={{ gap: space.sm }}>
            <Text variant="title">{title}</Text>
            <Text color="textMuted">{body}</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(90).duration(380).springify().damping(18)} style={{ gap: space.lg }}>
            {children}
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
