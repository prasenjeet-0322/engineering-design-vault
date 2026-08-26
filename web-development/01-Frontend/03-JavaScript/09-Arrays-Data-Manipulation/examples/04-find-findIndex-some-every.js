/**
 * KPI 09 — Part 04: find(), findIndex(), some() & every()
 * Demonstrates:
 * 1. Gotcha: Vacuous Truth in [].every() & -1 Index Sentinel Value Access
 * 2. Prediction 1: find() Early Termination Tracing
 * 3. Prediction 2: some() Early-Exit Short-Circuiting
 * 4. Prediction 3: findIndex() Predicate vs indexOf() Reference Matching
 * 5. Practical Architecture: Multi-Step Form Validator & RBAC Access Controller
 */

"use strict";

console.log("=== 1. GOTCHA: VACUOUS TRUTH & -1 SENTINEL VALUE ===");

// A. Vacuous Truth Gotcha
const requiredAdminRoles = ["ADMIN_WRITE", "BILLING_MANAGE"];
const unauthenticatedUserRoles = []; // Empty array!

// ❌ Buggy: Empty array vacuously returns true!
const buggyAuthorized = unauthenticatedUserRoles.every(role =>
  requiredAdminRoles.includes(role)
);
console.log("Buggy Authorization (Empty array passes!):", buggyAuthorized); // true!

// ✅ Senior Standard: Guard against empty collection
const safeAuthorized =
  unauthenticatedUserRoles.length > 0 &&
  unauthenticatedUserRoles.every(role => requiredAdminRoles.includes(role));
console.log("Safe Authorization (Guarded against empty):", safeAuthorized); // false

// B. -1 Sentinel Access Gotcha
const users = [{ id: "U1", name: "Sunny" }];
const missingIndex = users.findIndex(u => u.id === "U999");
console.log("Missing Index:", missingIndex); // -1
console.log("Accessing users[-1] directly:", users[missingIndex]); // undefined

console.log("\n=== 2. PREDICTION 1: find() EARLY TERMINATION ===");
const findLogs = [];
const numberList = [10, 20, 30, 40];

const firstMatch = numberList.find(n => {
  findLogs.push(n);
  return n >= 20;
});

console.log("Found Item:", firstMatch); // 20
console.log("Logged Elements Visited (Stopped at 20):", findLogs); // [ 10, 20 ]

console.log("\n=== 3. PREDICTION 2: some() EARLY EXIT ===");
const someLogs = [];
const mixedNumbers = [1, 3, 5, 8, 10];

const hasEven = mixedNumbers.some(n => {
  someLogs.push(n);
  return n % 2 === 0;
});

console.log("Has Even Number?:", hasEven); // true
console.log("some() Visited Elements (Stopped at 8):", someLogs); // [ 1, 3, 5, 8 ]

console.log("\n=== 4. PREDICTION 3: findIndex() VS indexOf() ===");
const targetObj = { id: 42 };
const collection = [targetObj, { id: 100 }];

console.log("indexOf(exact pointer):", collection.indexOf(targetObj)); // 0
console.log("indexOf(fresh object literal):", collection.indexOf({ id: 42 })); // -1 (Different pointer!)
console.log("findIndex(predicate property match):", collection.findIndex(i => i.id === 42)); // 0 (Matched!)

console.log("\n=== 5. PRACTICAL ARCHITECTURE: FORM VALIDATOR & RBAC ===");

// 1. RBAC Evaluator
const userSession = {
  username: "sunny@corp.com",
  roles: ["SETTINGS_WRITE", "AUDIT_READ"]
};

const hasPermission = (session, perm) =>
  !!session && session.roles.includes(perm);

const hasAllPermissions = (session, required) =>
  !!session && required.length > 0 && required.every(r => session.roles.includes(r));

console.log("Has SETTINGS_WRITE?:", hasPermission(userSession, "SETTINGS_WRITE")); // true
console.log("Has SuperAdmin roles?:", hasAllPermissions(userSession, ["SETTINGS_WRITE", "BILLING_ADMIN"])); // false

// 2. Form Field Validator
const formFields = [
  { name: "email", value: "sunny@corp.com", valid: true },
  { name: "apiKey", value: "pk_live_123", valid: true },
  { name: "backupPhone", value: "", valid: true }
];

const isFormValid = formFields.length > 0 && formFields.every(f => f.valid);
const hasDirtyFields = formFields.some(f => f.value.length > 0);

console.log("Is Form Valid for Submit?:", isFormValid); // true
console.log("Has Dirty/Populated Fields?:", hasDirtyFields); // true
