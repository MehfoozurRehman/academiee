import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Platform } from "react-native";

export type IconName =
  | "dashboard"
  | "students"
  | "fees"
  | "attendance"
  | "more"
  | "teachers"
  | "batches"
  | "courses"
  | "tests"
  | "timetable"
  | "salary"
  | "expenses"
  | "whatsapp"
  | "recycle"
  | "settings"
  | "logout"
  | "add"
  | "search"
  | "check"
  | "close"
  | "chevron"
  | "academy";

const ios: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  dashboard: "grid-outline",
  students: "people-outline",
  fees: "card-outline",
  attendance: "checkbox-outline",
  more: "ellipsis-horizontal-circle-outline",
  teachers: "person-outline",
  batches: "albums-outline",
  courses: "book-outline",
  tests: "document-text-outline",
  timetable: "calendar-outline",
  salary: "wallet-outline",
  expenses: "trending-down-outline",
  whatsapp: "logo-whatsapp",
  recycle: "trash-outline",
  settings: "settings-outline",
  logout: "log-out-outline",
  add: "add",
  search: "search-outline",
  check: "checkmark",
  close: "close",
  chevron: "chevron-forward",
  academy: "school-outline",
};

const android: Record<IconName, keyof typeof MaterialCommunityIcons.glyphMap> = {
  dashboard: "view-dashboard-outline",
  students: "account-group-outline",
  fees: "cash-multiple",
  attendance: "calendar-check-outline",
  more: "dots-horizontal-circle-outline",
  teachers: "account-tie-outline",
  batches: "google-classroom",
  courses: "book-open-outline",
  tests: "clipboard-text-outline",
  timetable: "calendar-clock",
  salary: "wallet-outline",
  expenses: "chart-line-variant",
  whatsapp: "whatsapp",
  recycle: "trash-can-outline",
  settings: "cog-outline",
  logout: "logout",
  add: "plus",
  search: "magnify",
  check: "check",
  close: "close",
  chevron: "chevron-right",
  academy: "school-outline",
};

export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color: string;
}) {
  if (Platform.OS === "ios") {
    return <Ionicons name={ios[name]} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={android[name]} size={size} color={color} />;
}
