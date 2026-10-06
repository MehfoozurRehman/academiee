import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { I18nManager, Platform } from "react-native";
import { getLocales } from "expo-localization";
import { storage } from "../lib/storage";
import { en, type Dictionary } from "./en";
import { ur } from "./ur";

export type Lang = "en" | "ur";

// "auth.signIn" style keys, derived from the English dictionary.
type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Paths<Dictionary>;

type Vars = Record<string, string | number>;

type I18nContext = {
  lang: Lang;
  rtl: boolean;
  t: (key: TKey, vars?: Vars) => string;
  setLang: (next: Lang) => void;
  money: (amount: number) => string;
  monthName: (month: number) => string;
  dayName: (day: number) => string;
  /** "2026-10" → "October 2026" */
  monthLabel: (yyyyMm: string) => string;
  /** "2026-10-07" → "7 October 2026" */
  dateLabel: (yyyyMmDd: string) => string;
};

const KEY = "academiee.lang";
const dictionaries: Record<Lang, Dictionary> = { en, ur };
const Ctx = createContext<I18nContext | null>(null);

function lookup(dict: Dictionary, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

function fill(text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m
  );
}

function deviceLang(): Lang {
  try {
    return getLocales()[0]?.languageCode === "ur" ? "ur" : "en";
  } catch {
    return "en";
  }
}

// Web flips direction through the document; native needs I18nManager and a
// reload, which is handled where the language is changed on device.
function applyDirection(lang: Lang) {
  const rtl = lang === "ur";
  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  } else if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);

  useEffect(() => {
    storage.getItem(KEY).then((saved) => {
      if (saved === "en" || saved === "ur") setLangState(saved);
    });
  }, []);

  useEffect(() => applyDirection(lang), [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    void storage.setItem(KEY, next);
  }, []);

  const value = useMemo<I18nContext>(() => {
    const dict = dictionaries[lang];
    const t = (key: TKey, vars?: Vars) =>
      fill(lookup(dict, key) ?? lookup(en, key) ?? key, vars);
    const monthName = (m: number) => t(`month.m${m}` as TKey);
    return {
      lang,
      rtl: lang === "ur",
      t,
      setLang,
      money: (amount) =>
        t("money.format", {
          amount: `${amount < 0 ? "-" : ""}${Math.abs(Math.round(amount)).toLocaleString("en-US")}`,
        }),
      monthName,
      dayName: (d) => t(`day.d${d}` as TKey),
      monthLabel: (yyyyMm) => {
        const [y, m] = yyyyMm.split("-").map(Number);
        return `${monthName(m)} ${y}`;
      },
      dateLabel: (yyyyMmDd) => {
        const [y, m, d] = yyyyMmDd.split("-").map(Number);
        return `${d} ${monthName(m)} ${y}`;
      },
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
