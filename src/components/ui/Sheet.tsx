import { useEffect, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable as RNPressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { layout, motion, radius, space } from "../../theme/tokens";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

// Forms and confirmations open here: a bottom sheet on phones, a centred
// dialog on wide screens. Content scrolls and stays above the keyboard.
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;
  const reduced = useReducedMotion();

  const [visible, setVisible] = useState(open);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setVisible(true);
      progress.value = reduced ? 1 : withTiming(1, { duration: motion.base, easing: Easing.out(Easing.cubic) });
    } else if (visible) {
      progress.value = reduced
        ? 0
        : withTiming(0, { duration: motion.fast }, (done) => {
            if (done) runOnJS(setVisible)(false);
          });
      if (reduced) setVisible(false);
    }
  }, [open, progress, reduced, visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panel = useAnimatedStyle(() =>
    wide
      ? { opacity: progress.value, transform: [{ scale: 0.97 + progress.value * 0.03 }] }
      : { transform: [{ translateY: (1 - progress.value) * 60 }], opacity: progress.value }
  );

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: wide ? "center" : "flex-end", alignItems: "center" }}
      >
        <Animated.View
          style={[{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.overlay }, backdrop]}
        >
          <RNPressable accessibilityLabel="Close" style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              width: "100%",
              maxWidth: wide ? 520 : undefined,
              maxHeight: height * (wide ? 0.86 : 0.92),
              backgroundColor: colors.bg,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderBottomLeftRadius: wide ? radius.xl : 0,
              borderBottomRightRadius: wide ? radius.xl : 0,
              paddingBottom: wide ? space.lg : insets.bottom + space.md,
            },
            panel,
          ]}
        >
          {!wide ? (
            <View style={{ alignItems: "center", paddingTop: space.sm }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong }} />
            </View>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: space.md,
              paddingHorizontal: space.xl,
              paddingTop: space.lg,
              paddingBottom: space.md,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading">{title}</Text>
              {subtitle ? (
                <Text variant="caption" color="textMuted">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surfaceMuted,
              }}
            >
              <Icon name="x" size={16} color="textMuted" />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.lg }}
          >
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: space.xl, paddingTop: space.sm, gap: space.sm }}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
