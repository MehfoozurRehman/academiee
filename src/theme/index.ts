import { Platform, useColorScheme } from "react-native";

const ios = Platform.OS === "ios";

const palette = {
  light: {
    bg: "#F8F8F8",
    surface: "#FFFFFF",
    surfaceAlt: "#F2F2F7",
    border: "#E5E5EA",
    text: "#000000",
    textMuted: "#8E8E93",
    textFaint: "#C7C7CC",
    accent: "#007AFF",
    accentSoft: "#EBF5FF",
    onAccent: "#FFFFFF",
    success: "#34C759",
    successSoft: "#E8F5E9",
    warning: "#FF9500",
    warningSoft: "#FFF3E0",
    danger: "#FF3B30",
    dangerSoft: "#FFEBEE",
    info: "#5856D6",
    infoSoft: "#EDE7F6",
    secondary: "#5AC8FA",
    secondarySoft: "#E0F7FF",
  },
  dark: {
    bg: "#000000",
    surface: "#1C1C1E",
    surfaceAlt: "#2C2C2E",
    border: "#3E3E40",
    text: "#FFFFFF",
    textMuted: "#A1A1A6",
    textFaint: "#636366",
    accent: "#0A84FF",
    accentSoft: "#1A3A52",
    onAccent: "#FFFFFF",
    success: "#32D74B",
    successSoft: "#0D3B1F",
    warning: "#FF9F0A",
    warningSoft: "#3A2E0B",
    danger: "#FF453A",
    dangerSoft: "#3A1612",
    info: "#5E5CE6",
    infoSoft: "#2B2660",
    secondary: "#00B4FF",
    secondarySoft: "#0A2F4F",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    letterSpacing: ios ? 0.34 : -0.2,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700" as const,
    letterSpacing: ios ? 0.3 : -0.1,
  },
  heading: { fontSize: 16, lineHeight: 21, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 20, fontWeight: "400" as const },
  callout: { fontSize: 14, lineHeight: 19, fontWeight: "500" as const },
  caption: { fontSize: 12.5, lineHeight: 17, fontWeight: "400" as const },
  micro: { fontSize: 10.5, lineHeight: 14, fontWeight: "600" as const, letterSpacing: 0.6 },
};

export const elevation = ios
  ? {
      card: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      raised: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
    }
  : {
      card: { elevation: 1 },
      raised: { elevation: 4 },
    };

export type Theme = {
  colors: typeof palette.light;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  elevation: typeof elevation;
  isIOS: boolean;
  dark: boolean;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  return {
    colors: dark ? palette.dark : palette.light,
    spacing,
    radius,
    typography,
    elevation,
    isIOS: ios,
    dark,
  };
}

export function formatMoney(amount: number, currency = "PKR") {
  const sign = amount < 0 ? "-" : "";
  const value = Math.abs(Math.round(amount));
  return `${sign}${currency} ${value.toLocaleString("en-US")}`;
}

export function formatCompact(amount: number) {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return String(Math.round(amount));
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
