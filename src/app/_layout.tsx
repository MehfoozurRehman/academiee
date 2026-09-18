import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { SessionProvider } from "../context/session";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <ConvexProvider client={convex}>
      <SafeAreaProvider>
        <SessionProvider>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </SessionProvider>
      </SafeAreaProvider>
    </ConvexProvider>
  );
}
