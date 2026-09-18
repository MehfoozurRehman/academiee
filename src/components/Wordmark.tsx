import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useTheme } from "../theme";
import { AppText } from "./ui";

export function Mark({ size = 44 }: { size?: number }) {
  const t = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect width="48" height="48" rx={t.isIOS ? 11 : 14} fill={t.colors.accent} />
      <Path
        d="M24 12 L36 19 L24 26 L12 19 Z"
        fill={t.colors.onAccent}
      />
      <Path
        d="M17 23.2 L17 30 C17 30 20 33 24 33 C28 33 31 30 31 30 L31 23.2"
        stroke={t.colors.onAccent}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function Wordmark({ size = 44 }: { size?: number }) {
  const t = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.md }}>
      <Mark size={size} />
      <View>
        <AppText variant="heading">Academiee</AppText>
        <AppText variant="caption" color={t.colors.textMuted}>
          Run your academy from your pocket
        </AppText>
      </View>
    </View>
  );
}
