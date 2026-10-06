import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// SecureStore has no web implementation, so the browser uses localStorage.
// Every call is best effort: a failed read just means "nothing saved".
const web = Platform.OS === "web";

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (web) return globalThis.localStorage?.getItem(key) ?? null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (web) globalThis.localStorage?.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (web) globalThis.localStorage?.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};
