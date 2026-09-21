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

      <View style={{ marginBottom: t.spacing.sm }}>
        <AppText
          variant="display"
          style={{ fontSize: 34, fontWeight: "700", lineHeight: 41 }}
        >
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}
