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
  onPress,
  chevron = !!onPress,
}: {
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

  if (!onPress) return body;
  return (
    <Pressable scaleTo={0.99} onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
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
