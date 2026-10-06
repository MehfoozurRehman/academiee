import { Linking, Platform } from "react-native";

/** 0300-1234567 → 923001234567 (Pakistan numbers). */
export function toInternational(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("3")) return `92${digits}`;
  return digits;
}

/** Opens WhatsApp with the message ready. The person still presses send. */
export async function openWhatsApp(phone: string, text: string) {
  const number = toInternational(phone);
  const web = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  if (Platform.OS === "web") {
    window.open(web, "_blank", "noopener");
    return;
  }
  const app = `whatsapp://send?phone=${number}&text=${encodeURIComponent(text)}`;
  const canOpen = await Linking.canOpenURL(app).catch(() => false);
  await Linking.openURL(canOpen ? app : web);
}
