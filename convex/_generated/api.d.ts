/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academies from "../academies.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as batches from "../batches.js";
import type * as courses from "../courses.js";
import type * as customFields from "../customFields.js";
import type * as enrollments from "../enrollments.js";
import type * as expenses from "../expenses.js";
import type * as fees from "../fees.js";
import type * as health from "../health.js";
import type * as passwords from "../passwords.js";
import type * as recycleBin from "../recycleBin.js";
import type * as salaries from "../salaries.js";
import type * as seed from "../seed.js";
import type * as students from "../students.js";
import type * as teachers from "../teachers.js";
import type * as tests from "../tests.js";
import type * as timetable from "../timetable.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academies: typeof academies;
  attendance: typeof attendance;
  auth: typeof auth;
  batches: typeof batches;
  courses: typeof courses;
  customFields: typeof customFields;
  enrollments: typeof enrollments;
  expenses: typeof expenses;
  fees: typeof fees;
  health: typeof health;
  passwords: typeof passwords;
  recycleBin: typeof recycleBin;
  salaries: typeof salaries;
  seed: typeof seed;
  students: typeof students;
  teachers: typeof teachers;
  tests: typeof tests;
  timetable: typeof timetable;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
