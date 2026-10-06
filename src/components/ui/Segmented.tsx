import { View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        padding: 3,
        gap: 3,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceMuted,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            scaleTo={0.98}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: space.sm - 1,
              paddingHorizontal: space.sm,
              borderRadius: radius.sm + 1,
              backgroundColor: active ? colors.surface : "transparent",
              borderWidth: active ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <Text variant="label" weight={active ? "semibold" : "medium"} color={active ? "text" : "textMuted"} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Horizontal filter chips (status filters, batch pickers).
export function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: space.md + 2,
              paddingVertical: 7,
              borderRadius: radius.pill,
              backgroundColor: active ? colors.text : colors.surface,
              borderWidth: 1,
              borderColor: active ? colors.text : colors.border,
            }}
          >
            <Text variant="label" weight="semibold" color={active ? "bg" : "textMuted"}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
