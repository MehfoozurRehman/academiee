import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Text } from "./ui";
import type { TypeVariant } from "../theme/tokens";

// Headline that rises in word by word. Reduced-motion users get it at once
// (Reanimated layout animations follow the system setting).
export function AnimatedWords({
  text,
  variant = "display",
  delay = 0,
  align = "start",
}: {
  text: string;
  variant?: TypeVariant;
  delay?: number;
  align?: "start" | "center";
}) {
  const words = text.split(" ");
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={text}
      style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: 10 }}
    >
      {words.map((w, i) => (
        <Animated.View key={`${w}-${i}`} entering={FadeInDown.delay(delay + i * 70).duration(420).springify().damping(16)}>
          <Text variant={variant}>{w}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
