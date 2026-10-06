import "react-native-reanimated";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { loadAsync } from "expo-font";
import { Asset } from "expo-asset";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import { I18nProvider, useI18n } from "../i18n/I18nProvider";
import { ToastProvider } from "../components/ui";
import { AcademyProvider } from "../context/AcademyContext";
import { storage } from "../lib/storage";

SplashScreen.preventAutoHideAsync().catch(() => {});

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Sessions live in secure storage on phones and localStorage on the web.
const authStorage = Platform.OS === "web" ? undefined : storage;

const URDU_400 = require("@expo-google-fonts/noto-nastaliq-urdu/400Regular/NotoNastaliqUrdu_400Regular.ttf");
const URDU_700 = require("@expo-google-fonts/noto-nastaliq-urdu/700Bold/NotoNastaliqUrdu_700Bold.ttf");

// On the web the Urdu face is limited to Arabic-script characters, so Latin
// names, codes and numbers inside Urdu text use the app's normal Latin font
// instead of Nastaliq's own (serif-looking) Latin letters.
function injectUrduWebFonts() {
  if (typeof document === "undefined" || document.getElementById("urdu-fonts")) return;
  const range = "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F";
  const face = (family: string, src: string) =>
    `@font-face{font-family:${family};src:url(${src}) format("truetype");font-display:swap;unicode-range:${range};}`;
  const style = document.createElement("style");
  style.id = "urdu-fonts";
  style.textContent =
    face("UrduWeb400", Asset.fromModule(URDU_400).uri) + face("UrduWeb700", Asset.fromModule(URDU_700).uri);
  document.head.appendChild(style);
}

function Shell() {
  const { scheme, colors } = useTheme();
  const { lang } = useI18n();

  // The Urdu typeface is large, so it's fetched only once Urdu is chosen.
  useEffect(() => {
    if (lang !== "ur") return;
    if (Platform.OS === "web") {
      injectUrduWebFonts();
      return;
    }
    loadAsync({
      NotoNastaliqUrdu_400Regular: URDU_400,
      NotoNastaliqUrdu_700Bold: URDU_700,
    }).catch(() => {});
  }, [lang]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.body.style.backgroundColor = colors.bg;
      document.documentElement.style.colorScheme = scheme;
    }
  }, [colors.bg, scheme]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "fade",
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ConvexAuthProvider client={convex} storage={authStorage}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <AcademyProvider>
                <Shell />
              </AcademyProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ConvexAuthProvider>
  );
}
