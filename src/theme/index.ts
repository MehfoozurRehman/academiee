import { Platform, useColorScheme } from "react-native";

const ios = Platform.OS === "ios";

const palette = {
  light: {
    bg: ios ? "#F2F2F7" : "#F7F5FA",
    surface: "#FFFFFF",
    surfaceAlt: ios ? "#FFFFFF" : "#FDFBFF",
    border: ios ? "#E3E3E8" : "#E6E0EC",
    text: ios ? "#000000" : "#1C1B1F",
    textMuted: ios ? "#8E8E93" : "#49454F",
    textFaint: ios ? "#C7C7CC" : "#79747E",
    accent: "#5B4BE8",
    accentSoft: "#ECEAFE",
    onAccent: "#FFFFFF",
    success: ios ? "#34C759" : "#146C2E",
    successSoft: ios ? "#E4F8EA" : "#D8F3DF",
    warning: ios ? "#FF9500" : "#8A5100",
    warningSoft: ios ? "#FFF2E0" : "#FFDDB0",
    danger: ios ? "#FF3B30" : "#B3261E",
    dangerSoft: ios ? "#FFE5E3" : "#F9DEDC",
    info: ios ? "#5856D6" : "#4F5B92",
    infoSoft: ios ? "#EAEAFB" : "#DEE1F9",
  },
  dark: {
    bg: ios ? "#000000" : "#141218",
    surface: ios ? "#1C1C1E" : "#211F26",
    surfaceAlt: ios ? "#2C2C2E" : "#2B2930",
    border: ios ? "#38383A" : "#49454F",
    text: "#FFFFFF",
    textMuted: ios ? "#98989F" : "#CAC4D0",
    textFaint: ios ? "#5A5A5F" : "#938F99",
    accent: "#A99BFF",
    accentSoft: "#2C2760",
    onAccent: "#1A1440",
    success: ios ? "#30D158" : "#7EDD93",
    successSoft: ios ? "#0C2C16" : "#1F4428",
    warning: ios ? "#FF9F0A" : "#FFB95C",
    warningSoft: ios ? "#3A2606" : "#5B3E00",
    danger: ios ? "#FF453A" : "#F2B8B5",
    dangerSoft: ios ? "#3A1512" : "#601410",
    info: ios ? "#5E5CE6" : "#BDC2FF",
    infoSoft: ios ? "#1A1A3A" : "#38407A",
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
  sm: ios ? 8 : 12,
  md: ios ? 12 : 16,
  lg: ios ? 16 : 24,
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
