import { ConvexError } from "convex/values";

// Server functions throw ConvexError({ code, message }) with a plain-English
// message meant for the user. Anything else is unexpected.
export function errorMessage(e: unknown, fallback: string) {
  if (e instanceof ConvexError) {
    const data = e.data as { message?: string } | string;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return fallback;
}

export function errorCode(e: unknown): string | null {
  if (e instanceof ConvexError) {
    const data = e.data as { code?: string };
    return data?.code ?? null;
  }
  return null;
}
