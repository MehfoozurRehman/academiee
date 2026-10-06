import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../theme/ThemeProvider";
import { motion, radius, space, type ColorName } from "../../theme/tokens";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONES: Record<Tone, { bg: ColorName; fg: ColorName }> = {
  neutral: { bg: "neutralSoft", fg: "textMuted" },
  accent: { bg: "accentSoft", fg: "accent" },
  success: { bg: "successSoft", fg: "success" },
  warning: { bg: "warningSoft", fg: "warning" },
  danger: { bg: "dangerSoft", fg: "danger" },
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const { colors } = useTheme();
  const t = TONES[tone];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: radius.pill,
        backgroundColor: colors[t.bg],
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors[t.fg] }} />
      <Text variant="micro" color={t.fg}>
        {label}
      </Text>
    </View>
  );
}

// Initials on a soft tint picked from the name, so lists are easy to scan.
const AVATAR_TONES: Tone[] = ["accent", "success", "warning", "neutral"];
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  const tone = TONES[AVATAR_TONES[hash % AVATAR_TONES.length]];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors[tone.bg],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text latin variant="label" weight="bold" color={tone.fg} style={{ fontSize: size * 0.36, lineHeight: size * 0.5 }}>
        {initials}
      </Text>
    </View>
  );
}

export function Progress({ value, tone = "accent" }: { value: number; tone?: Tone }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const width = useSharedValue(0);
  const clamped = Math.max(0, Math.min(1, value));

  useEffect(() => {
    width.value = reduced
      ? clamped
      : withTiming(clamped, { duration: motion.slow * 2, easing: Easing.out(Easing.cubic) });
  }, [clamped, reduced, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      style={{
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceMuted,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[{ height: "100%", borderRadius: radius.pill, backgroundColor: colors[TONES[tone].fg] }, fill]}
      />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: space.xxxl, paddingHorizontal: space.xl, gap: space.md }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.lg,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={24} color="accent" />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      {body ? (
        <Text color="textMuted" align="center" style={{ maxWidth: 320 }}>
          {body}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

export function Skeleton({ height = 16, width = "100%" }: { height?: number; width?: number | `${number}%` }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (!reduced) opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity, reduced]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ height, width, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted }, style]}
    />
  );
}
