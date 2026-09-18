import { ReactNode } from "react";
import {
  ActivityIndicator,
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
        paddingTop: insets.top + (large ? 2 : t.spacing.xs),
        paddingHorizontal: t.spacing.lg,
        paddingBottom: large ? t.spacing.sm : t.spacing.sm + 2,
        backgroundColor: t.colors.bg,
        borderBottomWidth: large ? 0 : Platform.OS === "ios" ? 0.5 : 0,
        borderBottomColor: t.colors.border,
      }}
    >
      {showControls || !large ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: t.spacing.sm, minHeight: 34 }}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} style={{ paddingRight: t.spacing.xs }}>
              <Text style={{ color: t.colors.accent, fontSize: 28, lineHeight: 30 }}>
                {t.isIOS ? "‹" : "←"}
              </Text>
            </Pressable>
          ) : null}

          <View style={{ flex: 1 }}>
            {!large ? (
              <>
                <Text numberOfLines={1} style={{ ...t.typography.heading, color: t.colors.text }}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text numberOfLines={1} style={{ ...t.typography.caption, color: t.colors.textMuted }}>
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
        <View style={{ marginTop: showControls ? t.spacing.xs : 0 }}>
          <Text style={{ ...t.typography.display, color: t.colors.text }}>{title}</Text>
          {subtitle ? (
            <Text style={{ ...t.typography.callout, color: t.colors.textMuted, marginTop: 1 }}>
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
          borderWidth: t.isIOS ? 0 : 1,
          borderColor: t.colors.border,
          overflow: "hidden",
          ...t.elevation.card,
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
      android_ripple={{ color: t.colors.accentSoft }}
      style={({ pressed }) => ({
        opacity: pressed && t.isIOS ? 0.7 : 1,
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
  variant?: "filled" | "tonal" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  compact?: boolean;
}) {
  const t = useTheme();
  const off = disabled || loading;

  const bg = {
    filled: t.colors.accent,
    tonal: t.colors.accentSoft,
    ghost: "transparent",
    danger: t.colors.danger,
  }[variant];

  const fg = {
    filled: t.colors.onAccent,
    tonal: t.colors.accent,
    ghost: t.colors.accent,
    danger: "#FFFFFF",
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      android_ripple={variant === "ghost" ? { color: t.colors.accentSoft } : { color: "#FFFFFF30" }}
      style={({ pressed }) => ({
        backgroundColor: bg,
        opacity: off ? 0.45 : pressed && t.isIOS ? 0.75 : 1,
        paddingVertical: compact ? 7 : 11,
        paddingHorizontal: compact ? t.spacing.md : t.spacing.lg,
        borderRadius: t.isIOS ? t.radius.md : t.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: full ? "stretch" : "flex-start",
        flexDirection: "row",
        gap: t.spacing.sm,
      })}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : null}
      <Text style={{ ...t.typography.callout, fontSize: compact ? 13 : 15, fontWeight: "600", color: fg }}>
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
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ ...t.typography.micro, color: t.colors.textMuted, textTransform: "uppercase" }}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor: t.colors.border,
          paddingHorizontal: t.spacing.md,
        }}
      >
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
            flex: 1,
            color: t.colors.text,
            fontSize: 15,
            paddingVertical: multiline ? 10 : 11,
            minHeight: multiline ? 76 : undefined,
            textAlignVertical: multiline ? "top" : "center",
          }}
        />
        {suffix ? (
          <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>{suffix}</Text>
        ) : null}
      </View>
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
        paddingHorizontal: t.spacing.sm + 2,
        paddingVertical: 4,
        borderRadius: t.radius.pill,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ ...t.typography.micro, color: c.fg }}>{label.toUpperCase()}</Text>
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
      android_ripple={onPress ? { color: t.colors.accentSoft } : undefined}
      style={({ pressed }) => ({
        opacity: pressed && t.isIOS && onPress ? 0.6 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: t.spacing.md,
        paddingVertical: t.spacing.md,
        paddingHorizontal: t.spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.colors.border,
      })}
    >
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ ...t.typography.body, fontWeight: "600", color: t.colors.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ ...t.typography.caption, color: t.colors.textMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: "flex-end", gap: 4 }}>
        {meta ? (
          <Text style={{ ...t.typography.callout, fontWeight: "600", color: metaTone ?? t.colors.text }}>
            {meta}
          </Text>
        ) : null}
        {badge ? <Badge label={badge} tone={badgeTone} /> : null}
      </View>

      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10}>
          <Text style={{ ...t.typography.caption, color: t.colors.danger }}>Delete</Text>
        </Pressable>
      ) : null}

      {onPress && t.isIOS ? (
        <Text style={{ color: t.colors.textFaint, fontSize: 20 }}>›</Text>
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

  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: t.isIOS ? 20 : 12,
        backgroundColor: tone ?? t.colors.accentSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ ...t.typography.callout, fontWeight: "700", color: t.colors.accent }}>
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
    <View style={{ alignItems: "center", paddingVertical: t.spacing.xxl, gap: t.spacing.sm }}>
      <Text style={{ ...t.typography.heading, color: t.colors.text }}>{title}</Text>
      <Text
        style={{
          ...t.typography.caption,
          color: t.colors.textMuted,
          textAlign: "center",
          maxWidth: 280,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: t.spacing.sm }}>
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
      android_ripple={{ color: "#FFFFFF40", borderless: false }}
      style={({ pressed }) => ({
        position: "absolute",
        right: t.spacing.lg,
        bottom: insets.bottom + t.spacing.lg,
        backgroundColor: t.colors.accent,
        width: t.isIOS ? 56 : 64,
        height: 56,
        borderRadius: t.isIOS ? 28 : 18,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed && t.isIOS ? 0.8 : 1,
        ...t.elevation.raised,
      })}
    >
      <Text style={{ color: t.colors.onAccent, fontSize: 28, lineHeight: 32, fontWeight: "400" }}>
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
