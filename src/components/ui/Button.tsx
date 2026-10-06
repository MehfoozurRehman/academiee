import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space, type ColorName } from "../../theme/tokens";
import { Icon, type IconName } from "./Icon";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const SIZES: Record<Size, { height: number; padX: number; icon: number }> = {
  sm: { height: 36, padX: space.md, icon: 16 },
  md: { height: 46, padX: space.lg, icon: 18 },
  lg: { height: 54, padX: space.xl, icon: 20 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  full,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
}) {
  const { colors } = useTheme();
  const s = SIZES[size];
  const inactive = disabled || loading;

  const look: Record<Variant, { bg: string; fg: ColorName; border?: string }> = {
    primary: { bg: colors.accent, fg: "onAccent" },
    secondary: { bg: colors.surface, fg: "text", border: colors.borderStrong },
    ghost: { bg: "transparent", fg: "accent" },
    danger: { bg: colors.dangerSoft, fg: "danger" },
  };
  const v = look[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={{
        height: s.height,
        paddingHorizontal: s.padX,
        borderRadius: radius.md,
        backgroundColor: v.bg,
        borderWidth: v.border ? 1 : 0,
        borderColor: v.border,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: full ? "stretch" : "flex-start",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors[v.fg]} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          {icon ? <Icon name={icon} size={s.icon} color={v.fg} /> : null}
          <Text variant="label" weight="semibold" color={v.fg}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
