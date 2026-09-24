import { Pressable, View } from "react-native";
import { useTheme } from "../theme";
import { AppText, Button, ErrorNote, Field, Segmented } from "./ui";
import { Sheet } from "./Sheet";
import type { FormSheetProps } from "./FormSheet.types";

export function FormSheet({
  open,
  onClose,
  title,
  fields,
  choices = [],
  toggleGroups = [],
  selected = {},
  onToggle,
  values,
  onChange,
  submitLabel,
  onSubmit,
  busy = false,
  error,
  note,
}: FormSheetProps) {
  const t = useTheme();

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <View style={{ gap: t.spacing.md }}>
        {choices.map((choice) => (
          <View key={choice.key} style={{ gap: 6 }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              {choice.label.toUpperCase()}
            </AppText>
            <Segmented
              value={values[choice.key] ?? choice.options[0]?.value ?? ""}
              onChange={(value) => onChange(choice.key, value)}
              options={choice.options}
            />
          </View>
        ))}

        {toggleGroups.map((group) => (
          <View key={group.key} style={{ gap: 6 }}>
            <AppText variant="micro" color={t.colors.textMuted}>
              {group.label.toUpperCase()}
            </AppText>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {group.options.map((option) => {
                const on = (selected[group.key] ?? []).includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => onToggle?.(group.key, option.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: t.radius.sm,
                      alignItems: "center",
                      backgroundColor: on ? t.colors.accent : t.colors.surface,
                      borderWidth: 1,
                      borderColor: on ? t.colors.accent : t.colors.border,
                    }}
                  >
                    <AppText variant="micro" color={on ? t.colors.onAccent : t.colors.textMuted}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {fields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            value={values[field.key] ?? ""}
            onChangeText={(text) => onChange(field.key, text)}
            placeholder={field.placeholder}
            secure={field.secure}
            keyboardType={field.keyboard}
            autoCapitalize={field.autoCapitalize}
          />
        ))}

        {note ? (
          <AppText variant="caption" color={t.colors.textMuted}>
            {note}
          </AppText>
        ) : null}

        <ErrorNote message={error ?? ""} />

        <Button label={submitLabel} onPress={onSubmit} loading={busy} />
      </View>
    </Sheet>
  );
}
