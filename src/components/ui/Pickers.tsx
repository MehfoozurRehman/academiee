import { useState } from "react";
import { Platform, View } from "react-native";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { fonts, radius, space } from "../../theme/tokens";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { Pressable } from "./Pressable";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

function FieldShell({ label, error, children, onPress }: { label?: string; error?: string; children: React.ReactNode; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: space.xs + 2 }}>
      {label ? (
        <Text variant="label" color="textMuted">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={onPress}
        scaleTo={0.99}
        accessibilityRole="button"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          minHeight: 50,
          paddingHorizontal: space.md + 2,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.borderStrong,
          backgroundColor: colors.surface,
        }}
      >
        {children}
      </Pressable>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** A field that opens a list of choices in a sheet. */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
}: {
  label?: string;
  value: T | null;
  options: { value: T; label: string; hint?: string }[];
  onChange: (next: T) => void;
  placeholder?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const current = options.find((o) => o.value === value);
  return (
    <>
      <FieldShell label={label} error={error} onPress={() => setOpen(true)}>
        <Text style={{ flex: 1 }} color={current ? "text" : "textFaint"} numberOfLines={1}>
          {current?.label ?? placeholder ?? "—"}
        </Text>
        <Icon name="chevron-down" size={18} color="textFaint" />
      </FieldShell>
      <Sheet open={open} onClose={() => setOpen(false)} title={label ?? placeholder ?? ""}>
        <View style={{ gap: space.xs }}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                scaleTo={0.99}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.md,
                  padding: space.md,
                  borderRadius: radius.md,
                  backgroundColor: active ? colors.accentSoft : "transparent",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text weight={active ? "semibold" : "medium"} color={active ? "accent" : "text"}>
                    {o.label}
                  </Text>
                  {o.hint ? (
                    <Text variant="caption" color="textMuted">
                      {o.hint}
                    </Text>
                  ) : null}
                </View>
                {active ? <Icon name="check" size={18} color="accent" /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

/** YYYY-MM-DD date. Uses the browser's date picker on web. */
export function DateField({
  label,
  value,
  onChange,
  max,
  error,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  max?: string;
  error?: string;
}) {
  const { colors } = useTheme();
  if (Platform.OS === "web") {
    return (
      <View style={{ gap: space.xs + 2 }}>
        {label ? (
          <Text variant="label" color="textMuted">
            {label}
          </Text>
        ) : null}
        <input
          type="date"
          value={value}
          max={max}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          style={{
            height: 50,
            padding: "0 14px",
            borderRadius: radius.md,
            border: `1px solid ${error ? colors.danger : colors.borderStrong}`,
            background: colors.surface,
            color: colors.text,
            fontFamily: fonts.latin.medium,
            fontSize: 16,
            colorScheme: "light dark",
            outline: "none",
            direction: "ltr",
          }}
        />
        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
  return (
    <Input
      label={label}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      keyboardType="numbers-and-punctuation"
      latin
      error={error}
    />
  );
}

/** "HH:mm" time. Browser time picker on web. */
export function TimeField({ label, value, onChange }: { label?: string; value: string; onChange: (next: string) => void }) {
  const { colors } = useTheme();
  if (Platform.OS === "web") {
    return (
      <View style={{ gap: space.xs + 2, flex: 1 }}>
        {label ? (
          <Text variant="label" color="textMuted">
            {label}
          </Text>
        ) : null}
        <input
          type="time"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          style={{
            height: 50,
            padding: "0 14px",
            borderRadius: radius.md,
            border: `1px solid ${colors.borderStrong}`,
            background: colors.surface,
            color: colors.text,
            fontFamily: fonts.latin.medium,
            fontSize: 16,
            colorScheme: "light dark",
            outline: "none",
            direction: "ltr",
          }}
        />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <Input label={label} value={value} onChangeText={onChange} placeholder="16:00" latin keyboardType="numbers-and-punctuation" />
    </View>
  );
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** ‹ October 2026 › */
export function MonthStepper({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const { monthLabel } = useI18n();
  const { colors } = useTheme();
  const btn = {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => onChange(shiftMonth(value, -1))} style={btn}>
        <Icon name="chevron-left" size={18} />
      </Pressable>
      <Text variant="label" weight="semibold" style={{ minWidth: 120 }} align="center">
        {monthLabel(value)}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => onChange(shiftMonth(value, 1))} style={btn}>
        <Icon name="chevron-right" size={18} />
      </Pressable>
    </View>
  );
}

export { shiftMonth };
