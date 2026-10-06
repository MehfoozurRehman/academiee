import { useI18n } from "../i18n/I18nProvider";
import { useTheme } from "../theme/ThemeProvider";
import { radius, space } from "../theme/tokens";
import { Icon, Pressable, Text } from "./ui";

/** Small pill that switches between English and Urdu. */
export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lang === "en" ? "اردو میں دیکھیں" : "Switch to English"}
      onPress={() => setLang(lang === "en" ? "ur" : "en")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs + 2,
        paddingHorizontal: space.md,
        height: 36,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <Icon name="globe" size={15} color="textMuted" />
      <Text variant="label" weight="semibold" latin={lang === "ur"}>
        {lang === "en" ? "اردو" : "English"}
      </Text>
    </Pressable>
  );
}
