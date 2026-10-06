import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { radius, space } from "../../theme/tokens";
import { Icon } from "./Icon";
import { Text } from "./Text";

type Kind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: Kind };

const Ctx = createContext<(message: string, kind?: Kind) => void>(() => {});

/** Short confirmation at the top of the screen ("Payment recorded"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, kind: Kind = "success") => {
    const id = next.current++;
    setToasts((all) => [...all.slice(-2), { id, message, kind }]);
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: insets.top + space.md, left: 0, right: 0, alignItems: "center", gap: space.sm }}
      >
        {toasts.map((t) => (
          <Animated.View
            key={t.id}
            entering={FadeInUp.springify().damping(18)}
            exiting={FadeOutUp.duration(180)}
            accessibilityLiveRegion="polite"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
              maxWidth: 420,
              marginHorizontal: space.lg,
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
              borderRadius: radius.pill,
              backgroundColor: colors.text,
            }}
          >
            <Icon
              name={t.kind === "error" ? "alert-circle" : t.kind === "info" ? "info" : "check-circle"}
              size={18}
              color={t.kind === "error" ? "danger" : t.kind === "info" ? "accent" : "success"}
            />
            <Text variant="label" weight="semibold" color="bg">
              {t.message}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
