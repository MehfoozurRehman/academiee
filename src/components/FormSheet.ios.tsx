import { useEffect, useRef } from "react";
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
  Toggle,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  bold,
  foregroundColor,
  frame,
  keyboardType,
  pickerStyle,
  tag,
  textInputAutocapitalization,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import type { FormField, FormSheetProps } from "./FormSheet.types";

const ACCENT = "#5B4BE8";

const CAPITALIZATION = {
  none: "never",
  sentences: "sentences",
  words: "words",
} as const;

function NativeField({
  field,
  initial,
  onChange,
}: {
  field: FormField;
  initial: string;
  onChange: (text: string) => void;
}) {
  const state = useNativeState(initial);
  const edited = useRef(false);

  useEffect(() => {
    if (!edited.current && state.get() !== initial) state.set(initial);
  }, [initial]);

  const handleChange = (text: string) => {
    edited.current = true;
    onChange(text);
  };

  if (field.secure) {
    return (
      <SecureField text={state} placeholder={field.label} onTextChange={handleChange} />
    );
  }

  return (
    <TextField
      text={state}
      placeholder={field.label}
      onTextChange={handleChange}
      modifiers={[
        keyboardType(field.keyboard ?? "default"),
        textInputAutocapitalization(CAPITALIZATION[field.autoCapitalize ?? "sentences"]),
      ]}
    />
  );
}

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
  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={open}
        onIsPresentedChange={(presented) => {
          if (!presented) onClose();
        }}
      >
        <Form modifiers={[frame({ minHeight: 460 })]}>
          <Section title={title} footer={note ? <Text>{note}</Text> : undefined}>
            {fields.map((field) => (
              <NativeField
                key={`${field.key}-${open}`}
                field={field}
                initial={values[field.key] ?? ""}
                onChange={(text) => onChange(field.key, text)}
              />
            ))}
          </Section>

          {choices.map((choice) => (
            <Section key={choice.key} title={choice.label}>
              <Picker
                label={choice.label}
                modifiers={[pickerStyle("menu"), tint(ACCENT)]}
                selection={values[choice.key] ?? choice.options[0]?.value ?? ""}
                onSelectionChange={(value) => onChange(choice.key, String(value))}
              >
                {choice.options.map((option) => (
                  <Text key={option.value} modifiers={[tag(option.value)]}>
                    {option.label}
                  </Text>
                ))}
              </Picker>
            </Section>
          ))}

          {toggleGroups.map((group) => (
            <Section key={group.key} title={group.label}>
              {group.options.map((option) => (
                <Toggle
                  key={option.value}
                  label={option.label}
                  isOn={(selected[group.key] ?? []).includes(option.value)}
                  onIsOnChange={() => onToggle?.(group.key, option.value)}
                  modifiers={[tint(ACCENT)]}
                />
              ))}
            </Section>
          ))}

          {error ? (
            <Section>
              <Text modifiers={[foregroundColor("#FF3B30")]}>{error}</Text>
            </Section>
          ) : null}

          <Section>
            <Button
              label={busy ? "Saving…" : submitLabel}
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
