/**
 * KPI 09 — Part 06: Currying, Partial Application & Function Specialization
 * Demonstrates:
 * 1. Gotcha: Data-First vs Data-Last Argument Ordering in Pipelines
 * 2. Prediction 1: Progressive Multi-Stage Currying Evaluation
 * 3. Prediction 2: Generic curry() Utility Arity Accumulation
 * 4. Prediction 3: fn.length Reflection with Default and Rest Parameters
 * 5. Practical Architecture: Enterprise RBAC Authorization Engine
 */

"use strict";

console.log("=== 1. GOTCHA: DATA-FIRST VS DATA-LAST IN PIPELINES ===");
const pipe = (...fns) => (val) => fns.reduce((res, fn) => fn(res), val);

// A. Data-First (Hard to compose without inline lambdas):
const dataFirstFilter = (arr, pred) => arr.filter(pred);

// B. Data-Last (Config first, data last — Zero glue needed!):
const filter = (pred) => (arr) => arr.filter(pred);
const map = (fn) => (arr) => arr.map(fn);

const numbers = [1, 2, 3, 4, 5, 6];

// Composed cleanly with Data-Last curried functions
const getEvenDoubles = pipe(
  filter((n) => n % 2 === 0),
  map((n) => n * 2)
);

console.log("Data-Last Pipeline Output:", getEvenDoubles(numbers)); // [4, 8, 12]

console.log("\n=== 2. PREDICTION 1: MULTI-STAGE VOLUME CALCULATION ===");
const volume = (l) => (w) => (h) => l * w * h;

const baseArea50 = volume(10)(5); // Configured: l=10, w=5 (Base Area = 50)
console.log("Box A (Height 2):", baseArea50(2)); // 100
console.log("Box B (Height 4):", baseArea50(4)); // 200

console.log("\n=== 3. PREDICTION 2: GENERIC AUTO-CURRY UTILITY ===");
function curry(fn) {
  return function curried(...args) {
    return args.length >= fn.length
      ? fn.apply(this, args)
      : (...nextArgs) => curried.apply(this, args.concat(nextArgs));
  };
}

const sum4 = (a, b, c, d) => a + b + c + d;
const curriedSum = curry(sum4);

console.log("curriedSum(1)(2)(3)(4):", curriedSum(1)(2)(3)(4)); // 10
console.log("curriedSum(1, 2)(3, 4):", curriedSum(1, 2)(3, 4)); // 10
console.log("curriedSum(1, 2, 3)(4):", curriedSum(1, 2, 3)(4)); // 10

console.log("\n=== 4. PREDICTION 3: FN.LENGTH PARAMETER REFLECTION ===");
const standardFn = (a, b, c) => a + b + c;
const defaultParamFn = (a, b = 10, c) => a + b + c;
const restParamFn = (a, ...rest) => a + rest.length;

console.log("Standard (a, b, c) length:", standardFn.length); // 3
console.log("Default Param (a, b = 10, c) length:", defaultParamFn.length); // 1 (Stops at default!)
console.log("Rest Param (a, ...rest) length:", restParamFn.length); // 1 (Ignores rest!)

console.log("\n=== 5. PRACTICAL ARCHITECTURE: ENTERPRISE RBAC ENGINE ===");

// Curried Permission Predicate Factories
const hasPermission = (requiredPerm) => (user) =>
  !!user && Array.isArray(user.permissions) && user.permissions.includes(requiredPerm);

const hasRole = (requiredRole) => (user) =>
  !!user && Array.isArray(user.roles) && user.roles.includes(requiredRole);

const or = (guardA, guardB) => (user) => guardA(user) || guardB(user);

// Specialized Domain Verbs
const canViewDashboard = hasPermission("DASHBOARD_READ");
const canManageUsers = or(hasPermission("USER_WRITE"), hasRole("SUPER_ADMIN"));
const canAccessBilling = hasPermission("BILLING_ADMIN");

const devUser = {
  id: "U_101",
  name: "Prasenjeet",
  roles: ["DEVELOPER"],
  permissions: ["DASHBOARD_READ"]
};

const adminUser = {
  id: "U_102",
  name: "Sarah",
  roles: ["SUPER_ADMIN"],
  permissions: ["DASHBOARD_READ", "BILLING_ADMIN"]
};

console.log(`[RBAC] ${devUser.name} - View Dashboard:`, canViewDashboard(devUser)); // true
console.log(`[RBAC] ${devUser.name} - Manage Users:`, canManageUsers(devUser)); // false
console.log(`[RBAC] ${adminUser.name} - Manage Users:`, canManageUsers(adminUser)); // true
console.log(`[RBAC] ${adminUser.name} - Access Billing:`, canAccessBilling(adminUser)); // true
