import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { storage } from "../lib/storage";
import { colors, type Colors, type Scheme } from "./tokens";

export type ThemePreference = "system" | Scheme;

type ThemeContext = {
  scheme: Scheme;
  colors: Colors;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
};

const KEY = "academiee.theme";
const Ctx = createContext<ThemeContext | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    storage.getItem(KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") setPref(saved);
    });
  }, []);

  const value = useMemo<ThemeContext>(() => {
    const scheme: Scheme =
      preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
    return {
      scheme,
      colors: colors[scheme],
      preference,
      setPreference: (next) => {
        setPref(next);
        void storage.setItem(KEY, next);
      },
    };
  }, [preference, system]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
