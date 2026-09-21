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

      <View style={{ marginBottom: t.spacing.xl, marginTop: t.spacing.md }}>
        <AppText
          color={t.colors.text}
          style={{ fontSize: 48, fontWeight: "900", lineHeight: 56, letterSpacing: -1 }}
        >
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}
