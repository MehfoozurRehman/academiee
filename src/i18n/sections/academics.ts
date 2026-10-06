// Attendance, tests, timetable and notices strings. `ur` must have exactly the same keys as `en` (TypeScript
// checks it). Urdu is written in Urdu script, never Roman Urdu.
import type { Widen } from "../types";

export const en = {
  attendanceUi: {},
  tests: {},
  timetable: {},
  notices: {},
};

export const ur: Widen<typeof en> = {
  attendanceUi: {},
  tests: {},
  timetable: {},
  notices: {},
};
