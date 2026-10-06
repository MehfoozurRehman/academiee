import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";
import { Text } from "./ui";

// The mark: an open book whose pages rise like a bar chart — learning and
// numbers, which is what the app is about. Drawn in code so it stays crisp.
export function Logo({ size = 32, wordmark = false }: { size?: number; wordmark?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: size * 0.32 }}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect width="48" height="48" rx="14" fill={colors.accent} />
        <Path d="M12 33.5c4-1.6 8-1.6 12 0v-14c-4-1.6-8-1.6-12 0z" fill={colors.onAccent} opacity={0.55} />
        <Path d="M24 33.5c4-1.6 8-1.6 12 0v-19c-4-1.6-8-1.6-12 0z" fill={colors.onAccent} />
      </Svg>
      {wordmark ? (
        <Text latin variant="heading" weight="bold" style={{ fontSize: size * 0.62, lineHeight: size * 0.8, letterSpacing: -0.4 }}>
          Academiee
        </Text>
      ) : null}
    </View>
  );
}
