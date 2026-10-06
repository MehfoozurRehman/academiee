/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academics from "../academics.js";
import type * as academies from "../academies.js";
import type * as admin from "../admin.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as authCodes from "../authCodes.js";
import type * as classes from "../classes.js";
import type * as dashboard from "../dashboard.js";
import type * as expenses from "../expenses.js";
import type * as fees from "../fees.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_enrolment from "../lib/enrolment.js";
import type * as notices from "../notices.js";
import type * as portal from "../portal.js";
import type * as students from "../students.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academics: typeof academics;
  academies: typeof academies;
  admin: typeof admin;
  attendance: typeof attendance;
  auth: typeof auth;
  authCodes: typeof authCodes;
  classes: typeof classes;
  dashboard: typeof dashboard;
  expenses: typeof expenses;
  fees: typeof fees;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/crypto": typeof lib_crypto;
  "lib/dates": typeof lib_dates;
  "lib/enrolment": typeof lib_enrolment;
  notices: typeof notices;
  portal: typeof portal;
  students: typeof students;
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
