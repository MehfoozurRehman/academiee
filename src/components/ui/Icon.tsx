import Feather from "@expo/vector-icons/Feather";
import type { ComponentProps } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";
import type { ColorName } from "../../theme/tokens";

export type IconName = ComponentProps<typeof Feather>["name"];

// Icons that point "forward/back" must mirror in Urdu.
const DIRECTIONAL = new Set<IconName>([
  "chevron-right",
  "chevron-left",
  "arrow-right",
  "arrow-left",
]);

export function Icon({
  name,
  size = 20,
  color = "text",
}: {
  name: IconName;
  size?: number;
  color?: ColorName;
}) {
  const { colors } = useTheme();
  const { rtl } = useI18n();
  const mirror = rtl && DIRECTIONAL.has(name);
  return (
    <Feather
      name={name}
      size={size}
      color={colors[color]}
      style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}
    />
  );
}
