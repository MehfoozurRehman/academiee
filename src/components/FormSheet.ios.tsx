import {
  BottomSheet,
  Button,
  Form,
  Host,
  Picker,
  SecureField,
  Section,
  Text,
  TextField,
} from "@expo/ui/swift-ui";
import {
  bold,
  foregroundColor,
  frame,
  keyboardType,
  textInputAutocapitalization,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import type { FormSheetProps } from "./FormSheet.types";

const ACCENT = "#5B4BE8";

const CAPITALIZATION = {
  none: "never",
  sentences: "sentences",
  words: "words",
} as const;

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
  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={open}
        onIsPresentedChange={(presented) => {
          if (!presented) onClose();
        }}
      >
        <Form modifiers={[frame({ minHeight: 460 })]}>
          <Section title={title}>
            {fields.map((field) =>
              field.secure ? (
                <SecureField
                  key={field.key}
                  placeholder={field.label}
                  onTextChange={(text) => onChange(field.key, text)}
                />
              ) : (
                <TextField
                  key={field.key}
                  placeholder={field.label}
                  onTextChange={(text) => onChange(field.key, text)}
                  modifiers={[
                    keyboardType(field.keyboard ?? "default"),
                    textInputAutocapitalization(
                      CAPITALIZATION[field.autoCapitalize ?? "sentences"]
                    ),
                  ]}
                />
              )
            )}
          </Section>

          {choices.map((choice) => (
            <Section key={choice.key} title={choice.label}>
              <Picker
                label={choice.label}
                selection={values[choice.key] ?? choice.options[0]?.value ?? ""}
                onSelectionChange={(value) => onChange(choice.key, String(value))}
              >
                {choice.options.map((option) => (
                  <Text key={option.value}>{option.label}</Text>
                ))}
              </Picker>
            </Section>
          ))}

          {error ? (
            <Section>
              <Text modifiers={[foregroundColor("#FF3B30")]}>{error}</Text>
            </Section>
          ) : null}

          {note ? (
            <Section>
              <Text modifiers={[foregroundColor("#8E8E93")]}>{note}</Text>
            </Section>
          ) : null}

          <Section>
            <Button
              label={busy ? "Saving\u2026" : submitLabel}
              modifiers={[tint(ACCENT), bold()]}
              onPress={() => {
                if (!busy) onSubmit();
              }}
            />
            <Button label="Cancel" role="cancel" onPress={onClose} />
          </Section>
        </Form>
      </BottomSheet>
    </Host>
  );
}
