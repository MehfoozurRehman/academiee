import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  action,
  onPress,
  chevron = !!onPress && !action,
}: {
  /** An interactive control (button) shown at the end, outside the row's own tap area. */
  action?: ReactNode;
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        minHeight: 64,
      }}
    >
      {leading}
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="label" weight="semibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevron-right" size={18} color="textFaint" /> : null}
    </View>
  );

  const row = onPress ? (
    <Pressable scaleTo={0.99} onPress={onPress} accessibilityRole="button" style={action ? { flex: 1 } : undefined}>
      {body}
    </Pressable>
  ) : (
    body
  );
  if (!action) return row;
  // Buttons can't live inside the row's button, so the action sits beside it.
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {onPress ? row : <View style={{ flex: 1 }}>{row}</View>}
      <View style={{ paddingEnd: space.lg }}>{action}</View>
    </View>
  );
}

// Rows grouped on one card with hairlines between them.
export function ListGroup({ children }: { children: ReactNode[] }) {
  const { colors } = useTheme();
  const items = children.filter(Boolean);
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginStart: space.lg }} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}
