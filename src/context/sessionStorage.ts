import * as SecureStore from "expo-secure-store";

const isWeb = process.env.EXPO_OS === "web";

export async function getSessionItem(key: string) {
  if (isWeb) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setSessionItem(key: string, value: string) {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeSessionItem(key: string) {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
