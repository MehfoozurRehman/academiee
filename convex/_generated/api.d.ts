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
import type * as expenses from "../expenses.js";
import type * as fees from "../fees.js";
import type * as health from "../health.js";
import type * as students from "../students.js";
import type * as teachers from "../teachers.js";

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
  expenses: typeof expenses;
  fees: typeof fees;
  health: typeof health;
  students: typeof students;
  teachers: typeof teachers;
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
