import { Pressable, ScrollView, View } from "react-native";
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
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: t.spacing.lg }}>
        <View style={{ gap: t.spacing.lg }}>
          {/* Choices Section */}
          {choices.length > 0 && (
            <View style={{ gap: t.spacing.md }}>
              {choices.map((choice) => (
                <View key={choice.key} style={{ gap: t.spacing.sm }}>
                  <AppText variant="callout" color={t.colors.text} style={{ marginHorizontal: t.spacing.lg, fontWeight: "600" }}>
                    {choice.label}
                  </AppText>
                  <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.lg, overflow: "hidden" }}>
                    <Segmented
                      value={values[choice.key] ?? choice.options[0]?.value ?? ""}
                      onChange={(value) => onChange(choice.key, value)}
                      options={choice.options}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Toggle Groups Section */}
          {toggleGroups.length > 0 && (
            <View style={{ gap: t.spacing.md }}>
              {toggleGroups.map((group) => (
                <View key={group.key} style={{ gap: t.spacing.sm }}>
                  <AppText variant="callout" color={t.colors.text} style={{ marginHorizontal: t.spacing.lg, fontWeight: "600" }}>
                    {group.label}
                  </AppText>
                  <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.lg, overflow: "hidden" }}>
                    {group.options.map((option, idx) => {
                      const on = (selected[group.key] ?? []).includes(option.value);
                      return (
                        <View key={option.value}>
                          <Pressable
                            onPress={() => onToggle?.(group.key, option.value)}
                            style={{
                              paddingHorizontal: t.spacing.lg,
                              paddingVertical: t.spacing.md,
                              backgroundColor: on ? t.colors.accentSoft : "transparent",
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <AppText variant="body" color={t.colors.text}>
                              {option.label}
                            </AppText>
                            {on && <AppText style={{ color: t.colors.accent, fontSize: 20 }}>✓</AppText>}
                          </Pressable>
                          {idx < group.options.length - 1 && (
                            <View style={{ height: 1, backgroundColor: t.colors.border, marginHorizontal: t.spacing.lg }} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Fields Section */}
          {fields.length > 0 && (
            <View style={{ gap: t.spacing.sm }}>
              <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.lg, overflow: "hidden" }}>
                {fields.map((field, idx) => (
                  <View key={field.key}>
                    <Field
                      label={field.label}
                      value={values[field.key] ?? ""}
                      onChangeText={(text) => onChange(field.key, text)}
                      placeholder={field.placeholder}
                      secure={field.secure}
                      keyboardType={field.keyboard}
                      autoCapitalize={field.autoCapitalize}
                    />
                    {idx < fields.length - 1 && (
                      <View style={{ height: 1, backgroundColor: t.colors.border, marginLeft: t.spacing.lg }} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Error Message */}
          {error ? (
            <View style={{ marginHorizontal: t.spacing.lg }}>
              <ErrorNote message={error} />
            </View>
          ) : null}

          {/* Note */}
          {note ? (
            <AppText variant="caption" color={t.colors.textMuted} style={{ marginHorizontal: t.spacing.lg }}>
              {note}
            </AppText>
          ) : null}

          {/* Submit Button */}
          <View style={{ marginHorizontal: t.spacing.lg, marginTop: t.spacing.md }}>
            <Button label={submitLabel} onPress={onSubmit} loading={busy} />
          </View>
        </View>
      </ScrollView>
    </Sheet>
  );
}
