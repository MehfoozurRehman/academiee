import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { Logo } from "./Logo";

export function Splash() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24, backgroundColor: colors.bg }}>
      <Logo size={44} />
      <ActivityIndicator color={colors.textFaint} />
    </View>
  );
}
