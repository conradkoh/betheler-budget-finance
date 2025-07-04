/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as appinfo from "../appinfo.js";
import type * as attendance from "../attendance.js";
import type * as auth_google from "../auth/google.js";
import type * as auth from "../auth.js";
import type * as budgets from "../budgets.js";
import type * as checklists from "../checklists.js";
import type * as cleanupTasks from "../cleanupTasks.js";
import type * as crypto from "../crypto.js";
import type * as discussions from "../discussions.js";
import type * as googleAuth from "../googleAuth.js";
import type * as migration from "../migration.js";
import type * as presentations from "../presentations.js";
import type * as serviceDesk from "../serviceDesk.js";
import type * as sharing from "../sharing.js";
import type * as system_thirdPartyAuthConfig from "../system/thirdPartyAuthConfig.js";
import type * as transactions from "../transactions.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  appinfo: typeof appinfo;
  attendance: typeof attendance;
  "auth/google": typeof auth_google;
  auth: typeof auth;
  budgets: typeof budgets;
  checklists: typeof checklists;
  cleanupTasks: typeof cleanupTasks;
  crypto: typeof crypto;
  discussions: typeof discussions;
  googleAuth: typeof googleAuth;
  migration: typeof migration;
  presentations: typeof presentations;
  serviceDesk: typeof serviceDesk;
  sharing: typeof sharing;
  "system/thirdPartyAuthConfig": typeof system_thirdPartyAuthConfig;
  transactions: typeof transactions;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
