import { View, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";
import { Pressable } from "./Pressable";

// The one surface every grouped piece of content sits on: hairline border, no
// shadow, so the app stays calm in both themes.
export function Card({
  children,
  onPress,
  padded = true,
  tone = "surface",
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  tone?: "surface" | "accent" | "muted";
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg =
    tone === "accent" ? colors.accent : tone === "muted" ? colors.surfaceMuted : colors.surface;
  const base: ViewStyle = {
    backgroundColor: bg,
    borderRadius: radius.lg,
    borderWidth: tone === "surface" ? 1 : 0,
    borderColor: colors.border,
    padding: padded ? space.lg : 0,
    overflow: "hidden",
  };

  if (onPress) {
    return (
      <Pressable scaleTo={0.985} onPress={onPress} accessibilityRole="button" style={[base, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{ height: 1, backgroundColor: colors.border, marginStart: inset }}
    />
  );
}
