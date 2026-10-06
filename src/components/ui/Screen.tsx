import type { ReactNode } from "react";
import { ScrollView, View, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../theme/ThemeProvider";
import { layout, motion, space } from "../../theme/tokens";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { router } from "expo-router";

// Page shell: safe areas, a centred readable column on wide screens, and an
// optional large title with a trailing action.
export function Screen({
  title,
  subtitle,
  action,
  children,
  scroll = true,
  footer,
  narrow,
  back,
  ...scrollProps
}: {
  /** Show a back button above the title (detail pages). Pass a path to go there when there's no history. */
  back?: boolean | string;
  /** Use the narrower reading width (detail pages, settings). */
  narrow?: boolean;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
} & Omit<ScrollViewProps, "children">) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const backButton = back ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace((typeof back === "string" ? back : "/") as never);
      }}
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: space.lg,
      }}
    >
      <Icon name="arrow-left" size={18} />
    </Pressable>
  ) : null;

  const header = title ? (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: space.md,
        marginBottom: space.xl,
      }}
    >
      <View style={{ flex: 1, gap: space.xxs }}>
        {subtitle ? (
          <Text variant="label" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
        <Text variant="title">{title}</Text>
      </View>
      {action}
    </View>
  ) : null;

  const column = (
    <View
      style={{
        width: "100%",
        maxWidth: narrow ? layout.narrowContent : layout.maxContent,
        alignSelf: "center",
        paddingHorizontal: space.lg,
        paddingTop: insets.top + space.xl,
        paddingBottom: insets.bottom + space.xxxl * 2,
      }}
    >
      {backButton}
      {header}
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {column}
        </ScrollView>
      ) : (
        column
      )}
      {footer}
    </View>
  );
}

// Content that eases up into place when a screen opens. Pass an index to
// stagger a list of sections.
export function Reveal({ index = 0, children }: { index?: number; children: ReactNode }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.slow).delay(index * 60).springify().damping(20)}
    >
      {children}
    </Animated.View>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: space.md, marginBottom: space.xl }}>
      {title || action ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {title ? <Text variant="heading">{title}</Text> : <View />}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}
