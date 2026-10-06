import { useState } from "react";
import { Platform, TextInput, View, type TextInputProps } from "react-native";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { fonts, radius, space, urduFamily } from "../../theme/tokens";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export function Input({
  label,
  hint,
  error,
  icon,
  latin,
  ...rest
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  /** Codes, emails and numbers are always typed left-to-right in Latin. */
  latin?: boolean;
}) {
  const { colors } = useTheme();
  const { lang, rtl } = useI18n();
  const [focused, setFocused] = useState(false);
  const urdu = lang === "ur" && !latin;

  const border = error ? colors.danger : focused ? colors.accent : colors.borderStrong;

  return (
    <View style={{ gap: space.xs + 2 }}>
      {label ? (
        <Text variant="label" color="textMuted">
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          height: 50,
          paddingHorizontal: space.md + 2,
          borderRadius: radius.md,
          borderWidth: focused ? 1.5 : 1,
          borderColor: border,
          backgroundColor: colors.surface,
        }}
      >
        {icon ? <Icon name={icon} size={18} color="textFaint" /> : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.textFaint}
          style={[
            {
              flex: 1,
              height: "100%",
              color: colors.text,
              fontFamily: urdu ? urduFamily("regular", Platform.OS === "web") : fonts.latin.medium,
              fontSize: 16,
              textAlign: latin ? "left" : Platform.OS === "web" && rtl ? "right" : "left",
              writingDirection: latin ? "ltr" : rtl ? "rtl" : "ltr",
            },
            Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null,
          ]}
        />
      </View>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textFaint">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
