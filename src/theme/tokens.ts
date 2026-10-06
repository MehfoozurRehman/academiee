// Design tokens. Screens never hard-code colours, sizes or fonts — they read
// them from here through useTheme().

const palette = {
  light: {
    bg: "#F7F6F3",
    surface: "#FFFFFF",
    surfaceMuted: "#F0EFEB",
    border: "#E5E3DD",
    borderStrong: "#D3D0C8",
    text: "#17181C",
    textMuted: "#5F6169",
    textFaint: "#9A9CA3",
    accent: "#3846C8",
    accentPressed: "#2C38A6",
    accentSoft: "#ECEEFC",
    onAccent: "#FFFFFF",
    success: "#23784A",
    successSoft: "#E3F2E8",
    warning: "#A15C07",
    warningSoft: "#FBEFD9",
    danger: "#B8322A",
    dangerSoft: "#FBE7E5",
    neutralSoft: "#EEEDE9",
    overlay: "rgba(23, 24, 28, 0.38)",
  },
  dark: {
    bg: "#121316",
    surface: "#1B1C20",
    surfaceMuted: "#24252A",
    border: "#2C2D33",
    borderStrong: "#3A3B42",
    text: "#F2F2F0",
    textMuted: "#A7A8AE",
    textFaint: "#6E7078",
    accent: "#8C97FF",
    accentPressed: "#A6AEFF",
    accentSoft: "#262A4D",
    onAccent: "#10122B",
    success: "#6CCB94",
    successSoft: "#1C3326",
    warning: "#F0B35A",
    warningSoft: "#3A2C16",
    danger: "#F08A80",
    dangerSoft: "#3D2120",
    neutralSoft: "#26272C",
    overlay: "rgba(0, 0, 0, 0.55)",
  },
} as const;

export type ColorName = keyof typeof palette.light;
export type Colors = Record<ColorName, string>;
export type Scheme = "light" | "dark";

export const colors: Record<Scheme, Colors> = palette;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

// Latin and Urdu need different typefaces and very different line heights:
// Nastaliq script stacks diagonally and needs roughly twice the leading.
export const fonts = {
  latin: {
    regular: "PlusJakartaSans_400Regular",
    medium: "PlusJakartaSans_500Medium",
    semibold: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
  },
  urdu: {
    regular: "NotoNastaliqUrdu_400Regular",
    // Two weights only: each Nastaliq file is ~0.5 MB.
    medium: "NotoNastaliqUrdu_400Regular",
    semibold: "NotoNastaliqUrdu_700Bold",
    bold: "NotoNastaliqUrdu_700Bold",
  },
} as const;

export type Weight = keyof typeof fonts.latin;

/** Font stack for Urdu text. On the web the Urdu face only covers Urdu letters. */
export function urduFamily(weight: Weight, web: boolean) {
  if (!web) return fonts.urdu[weight];
  const urdu = weight === "bold" || weight === "semibold" ? "UrduWeb700" : "UrduWeb400";
  return `${urdu}, ${fonts.latin[weight]}`;
}

export const type = {
  display: { size: 34, weight: "bold", leading: 1.15, tracking: -0.8 },
  title: { size: 24, weight: "bold", leading: 1.2, tracking: -0.4 },
  heading: { size: 18, weight: "semibold", leading: 1.3, tracking: -0.2 },
  body: { size: 15, weight: "regular", leading: 1.5, tracking: 0 },
  label: { size: 14, weight: "medium", leading: 1.4, tracking: 0 },
  caption: { size: 13, weight: "regular", leading: 1.4, tracking: 0 },
  micro: { size: 11.5, weight: "semibold", leading: 1.3, tracking: 0.3 },
  figure: { size: 28, weight: "bold", leading: 1.1, tracking: -0.6 },
} as const satisfies Record<
  string,
  { size: number; weight: Weight; leading: number; tracking: number }
>;

export type TypeVariant = keyof typeof type;

// Urdu sets a touch larger and much taller so diacritics never clip.
export const urduScale = { size: 1.04, leading: 1.9 } as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 360,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
} as const;

export const layout = {
  maxContent: 1040,
  /** Readable width for forms and detail pages. */
  narrowContent: 720,
  sidebar: 248,
  wideBreakpoint: 900,
} as const;
