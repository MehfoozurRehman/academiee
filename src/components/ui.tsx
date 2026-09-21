import { ReactNode, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Theme } from "../theme";

export function Screen({
  children,
  scroll = false,
  padded = true,
  refreshing,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
}) {
  const t = useTheme();
  const body = (
    <View
      style={{
        paddingHorizontal: padded ? t.spacing.lg : 0,
        paddingTop: padded ? t.spacing.md : 0,
        gap: t.spacing.md + 2,
        paddingBottom: 120,
      }}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
      {refreshing ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", paddingTop: 8 }}>
          <ActivityIndicator color={t.colors.accent} />
        </View>
      ) : null}
    </View>
  );
}

export function AppBar({
  title,
  subtitle,
  onBack,
  action,
  large = false,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
  large?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const showControls = Boolean(onBack || action);

  return (
    <View
      style={{
        paddingTop: insets.top + (large ? 4 : t.spacing.md),
        paddingHorizontal: t.spacing.lg,
        paddingBottom: large ? t.spacing.lg : t.spacing.md,
        backgroundColor: t.colors.bg,
        borderBottomWidth: large ? 0 : 0.5,
        borderBottomColor: t.colors.border,
      }}
    >
      {showControls || !large ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.sm, minHeight: 34 }}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={({ pressed }) => ({
                paddingRight: t.spacing.xs,
                opacity: pressed && t.isIOS ? 0.6 : 1,
              })}
            >
              <Text style={{ color: t.colors.accent, fontSize: 28, lineHeight: 30, fontWeight: "600" }}>
                {t.isIOS ? "‹" : "←"}
              </Text>
            </Pressable>
          ) : null}

          <View style={{ flex: 1 }}>
            {!large ? (
              <>
                <Text numberOfLines={1} style={{ ...t.typography.heading, color: t.colors.text, fontWeight: "700" }}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text numberOfLines={1} style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 2 }}>
                    {subtitle}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>

          {action}
        </View>
      ) : null}

      {large ? (
        <View style={{ marginTop: showControls ? t.spacing.md : 0 }}>
          <Text style={{ ...t.typography.display, color: t.colors.text, fontWeight: "700" }}>{title}</Text>
          {subtitle ? (
            <Text style={{ ...t.typography.callout, color: t.colors.textMuted, marginTop: 4, fontWeight: "500" }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
}) {
  const t = useTheme();

  const inner = (
    <View
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          padding: padded ? t.spacing.lg : 0,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
          shadowColor: t.dark ? "#000000" : "transparent",
          shadowOpacity: t.dark ? 0.3 : 0,
          shadowRadius: t.dark ? 8 : 0,
          shadowOffset: { width: 0, height: t.dark ? 2 : 0 },
          elevation: t.dark ? 2 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: t.colors.accentSoft, radius: 999 }}
      style={({ pressed }) => ({
        opacity: pressed && t.isIOS ? 0.85 : 1,
        borderRadius: t.radius.lg,
      })}
    >
      {inner}
    </Pressable>
  );
}

export function AppText({
  children,
  variant = "body",
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: keyof Theme["typography"];
  color?: string;
  style?: StyleProp<ViewStyle>;
  numberOfLines?: number;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ ...t.typography[variant], color: color ?? t.colors.text }, style as never]}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = "filled",
  loading = false,
  disabled = false,
  full = true,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "filled" | "tonal" | "ghost" | "danger" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  compact?: boolean;
}) {
  const t = useTheme();
  const off = disabled || loading;

  const colors = {
    filled: { bg: t.colors.accent, fg: t.colors.onAccent },
    tonal: { bg: t.colors.accentSoft, fg: t.colors.accent },
    secondary: { bg: t.colors.secondarySoft, fg: t.colors.secondary },
    ghost: { bg: "transparent", fg: t.colors.accent },
    danger: { bg: t.colors.danger, fg: t.colors.onAccent },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      android_ripple={{ color: t.colors.accentSoft, radius: 999 }}
      style={({ pressed }) => ({
        backgroundColor: off ? (variant === "ghost" ? "transparent" : colors.bg) : colors.bg,
        opacity: off ? 0.5 : pressed && t.isIOS ? 0.8 : 1,
        paddingVertical: compact ? 8 : 11,
        paddingHorizontal: compact ? t.spacing.md : t.spacing.lg,
        borderRadius: t.radius.md,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: full ? "stretch" : "flex-start",
        flexDirection: "row",
        gap: t.spacing.sm,
        borderWidth: variant === "ghost" ? 1 : 0,
        borderColor: variant === "ghost" ? colors.fg : "transparent",
      })}
    >
      {loading ? <ActivityIndicator size="small" color={colors.fg} /> : null}
      <Text style={{ ...t.typography.callout, fontSize: compact ? 13 : 15, fontWeight: "600", color: colors.fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  suffix,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
  suffix?: string;
}) {
  const t = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        paddingHorizontal: t.spacing.md,
        paddingVertical: t.spacing.md,
        gap: t.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: t.colors.border,
      }}
    >
      {label ? (
        <Text style={{ ...t.typography.body, color: t.colors.text, minWidth: 100, fontWeight: "500" }}>
          {label}
        </Text>
      ) : null}
      <View style={{ flex: 1 }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.colors.textFaint}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          style={{
            color: t.colors.text,
            fontSize: 16,
            paddingVertical: multiline ? 8 : 0,
            minHeight: multiline ? 76 : undefined,
            textAlign: "right",
            textAlignVertical: multiline ? "top" : "center",
          }}
        />
      </View>
      {suffix ? (
        <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>{suffix}</Text>
      ) : null}
    </View>
  );
}

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const t = useTheme();

  const map: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: t.colors.surfaceAlt, fg: t.colors.textMuted },
    success: { bg: t.colors.successSoft, fg: t.colors.success },
    warning: { bg: t.colors.warningSoft, fg: t.colors.warning },
    danger: { bg: t.colors.dangerSoft, fg: t.colors.danger },
    info: { bg: t.colors.infoSoft, fg: t.colors.info },
    accent: { bg: t.colors.accentSoft, fg: t.colors.accent },
  };

  const c = map[tone];

  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingHorizontal: t.spacing.sm + 4,
        paddingVertical: 5,
        borderRadius: t.radius.pill,
        alignSelf: "flex-start",
        borderWidth: 0.5,
        borderColor: c.fg,
      }}
    >
      <Text style={{ ...t.typography.micro, color: c.fg, fontWeight: "700", fontSize: 11 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function Row({
  title,
  subtitle,
  meta,
  metaTone,
  badge,
  badgeTone,
  onPress,
  onDelete,
  leading,
  last = false,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  metaTone?: string;
  badge?: string;
  badgeTone?: Tone;
  onPress?: () => void;
  onDelete?: () => void;
  leading?: ReactNode;
  last?: boolean;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      android_ripple={onPress ? { color: t.colors.accentSoft, radius: 999 } : undefined}
      style={({ pressed }) => ({
        opacity: pressed && t.isIOS && onPress ? 0.7 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: t.spacing.md,
        paddingVertical: t.spacing.lg,
        paddingHorizontal: t.spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.colors.border,
      })}
    >
      {leading}
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={{ ...t.typography.body, fontWeight: "600", color: t.colors.text, fontSize: 16 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ ...t.typography.caption, color: t.colors.textMuted, fontSize: 13 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: "flex-end", gap: 6 }}>
        {meta ? (
          <Text style={{ ...t.typography.callout, fontWeight: "600", color: metaTone ?? t.colors.text, fontSize: 15 }}>
            {meta}
          </Text>
        ) : null}
        {badge ? <Badge label={badge} tone={badgeTone} /> : null}
      </View>

      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10} style={({ pressed }) => ({ opacity: pressed && t.isIOS ? 0.6 : 1 })}>
          <Text style={{ ...t.typography.caption, color: t.colors.danger, fontWeight: "600" }}>Delete</Text>
        </Pressable>
      ) : null}

      {onPress && t.isIOS ? (
        <Text style={{ color: t.colors.textFaint, fontSize: 18, marginLeft: 4 }}>›</Text>
      ) : null}
    </Pressable>
  );
}

export function Avatar({ name, tone }: { name: string; tone?: string }) {
  const t = useTheme();
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const colors = [
    { bg: "#FF4444", fg: "#FFFFFF" },
    { bg: "#4DBE94", fg: "#FFFFFF" },
    { bg: "#1E90FF", fg: "#FFFFFF" },
    { bg: "#34C759", fg: "#FFFFFF" },
    { bg: "#FFB800", fg: "#FFFFFF" },
    { bg: "#FF9500", fg: "#FFFFFF" },
    { bg: "#A855F7", fg: "#FFFFFF" },
    { bg: "#06B6D4", fg: "#FFFFFF" },
  ];

  const colorIdx = name.charCodeAt(0) % colors.length;
  const color = colors[colorIdx];

  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: tone ?? color.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ ...t.typography.callout, fontWeight: "600", color: color.fg, fontSize: 14 }}>
        {initials}
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = useTheme();

  return (
    <View style={{ alignItems: "center", paddingVertical: t.spacing.xxl + 8, gap: t.spacing.md, paddingHorizontal: t.spacing.lg }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: t.colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: t.spacing.md,
        }}
      >
        <Text style={{ fontSize: 40 }}>📭</Text>
      </View>
      <Text style={{ ...t.typography.heading, color: t.colors.text, fontSize: 18, fontWeight: "700" }}>{title}</Text>
      <Text
        style={{
          ...t.typography.caption,
          color: t.colors.textMuted,
          textAlign: "center",
          maxWidth: 300,
          fontSize: 14,
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: t.spacing.lg }}>
          <Button label={actionLabel} onPress={onAction} full={false} compact />
        </View>
      ) : null}
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: t.spacing.sm, paddingRight: t.spacing.lg }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            android_ripple={{ color: t.colors.accentSoft }}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 6,
              borderRadius: t.radius.pill,
              backgroundColor: active ? t.colors.accent : t.colors.surface,
              borderWidth: 1,
              borderColor: active ? t.colors.accent : t.colors.border,
            }}
          >
            <Text
              style={{
                ...t.typography.caption,
                fontWeight: "600",
                color: active ? t.colors.onAccent : t.colors.textMuted,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Fab({ onPress, label = "+" }: { onPress: () => void; label?: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#FFFFFF40", borderless: true, radius: 32 }}
      style={({ pressed }) => ({
        position: "absolute",
        right: t.spacing.lg,
        bottom: insets.bottom + t.spacing.lg,
        backgroundColor: t.colors.accent,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed && t.isIOS ? 0.8 : 1,
        shadowColor: t.colors.accent,
        shadowOpacity: t.dark ? 0.4 : 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      })}
    >
      <Text style={{ color: t.colors.onAccent, fontSize: 28, lineHeight: 32, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Loader() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.bg }}>
      <ActivityIndicator size="large" color={t.colors.accent} />
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  const t = useTheme();
  if (!message) return null;

  return (
    <View
      style={{
        backgroundColor: t.colors.dangerSoft,
        borderRadius: t.radius.md,
        padding: t.spacing.md,
      }}
    >
      <Text style={{ ...t.typography.caption, color: t.colors.danger }}>{message}</Text>
    </View>
  );
}

export function SafeTop({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: t.colors.bg }}>
      {children}
    </SafeAreaView>
  );
}
