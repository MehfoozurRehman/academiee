// Students and classes strings. `ur` must have exactly the same keys as `en` (TypeScript
// checks it). Urdu is written in Urdu script, never Roman Urdu.
import type { Widen } from "../types";

export const en = {
  students: {
    title: "Students",
    count: "{count} students",
    searchPlaceholder: "Search name, father's name or phone",
    all: "All",
    empty: "No students yet",
    emptyBody: "Add your first student to start tracking fees and attendance.",
  },
  classes: {},
};

export const ur: Widen<typeof en> = {
  students: {
    title: "طلبہ",
    count: "{count} طلبہ",
    searchPlaceholder: "نام، والد کا نام یا فون تلاش کریں",
    all: "سب",
    empty: "ابھی کوئی طالب علم نہیں",
    emptyBody: "فیس اور حاضری کا ریکارڈ شروع کرنے کے لیے اپنا پہلا طالب علم شامل کریں۔",
  },
  classes: {},
};
