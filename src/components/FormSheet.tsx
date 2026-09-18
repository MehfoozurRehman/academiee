import { View } from "react-native";
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
