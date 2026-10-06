import { Platform, Text as RNText, type TextProps, type TextStyle } from "react-native";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";
import {
  fonts,
  type,
  urduScale,
  type ColorName,
  type TypeVariant,
  type Weight,
} from "../../theme/tokens";

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  color?: ColorName;
  weight?: Weight;
  align?: "start" | "center" | "end";
  /** Force Latin font for codes, IDs and numbers inside Urdu screens. */
  latin?: boolean;
  tabular?: boolean;
};

// Picks the right typeface and line height for the active language. Urdu text
// gets Nastaliq with generous leading; codes and figures can opt into Latin.
export function Text({
  variant = "body",
  color = "text",
  weight,
  align = "start",
  latin,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const { lang, rtl } = useI18n();
  const spec = type[variant];
  const urdu = lang === "ur" && !latin;

  const size = urdu ? Math.round(spec.size * urduScale.size) : spec.size;
  const leading = urdu ? urduScale.leading : spec.leading;
  const family = (urdu ? fonts.urdu : fonts.latin)[weight ?? spec.weight];

  // Native already swaps left/right when the app is in RTL mode; on web we
  // resolve start/end ourselves.
  const flip = Platform.OS === "web" && rtl;
  const textAlign: TextStyle["textAlign"] =
    align === "center" ? "center" : (align === "start") !== flip ? "left" : "right";

  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: family,
          fontSize: size,
          lineHeight: Math.round(size * leading),
          letterSpacing: urdu ? 0 : spec.tracking,
          color: colors[color],
          textAlign,
          writingDirection: urdu ? "rtl" : rtl ? "rtl" : "ltr",
          fontVariant: tabular ? ["tabular-nums"] : undefined,
        },
        style,
      ]}
    />
  );
}
