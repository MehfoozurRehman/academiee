import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../theme";
import { AppText } from "./ui";

export function SheetBody({
  title,
  children,
  showHandle = false,
}: {
  title: string;
  children: ReactNode;
  showHandle?: boolean;
}) {
  const t = useTheme();

  return (
    <View
      style={{
        backgroundColor: t.colors.bg,
        paddingHorizontal: t.spacing.lg,
        paddingTop: showHandle ? t.spacing.md : t.spacing.lg,
        paddingBottom: t.spacing.xl,
        gap: t.spacing.lg,
      }}
    >
      {showHandle ? (
        <View
          style={{
            alignSelf: "center",
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.colors.border,
          }}
        />
      ) : null}

      <View style={{ marginBottom: t.spacing.lg, marginTop: t.spacing.sm }}>
        <AppText
          variant="display"
          color={t.colors.text}
          style={{ fontSize: 42, fontWeight: "800", lineHeight: 50, letterSpacing: -0.5 }}
        >
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}
