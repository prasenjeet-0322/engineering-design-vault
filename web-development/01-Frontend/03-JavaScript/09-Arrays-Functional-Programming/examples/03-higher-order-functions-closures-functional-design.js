/**
 * KPI 09 — Part 03: First-Class Functions, Higher-Order Functions & Closures
 * Demonstrates:
 * 1. Gotcha: Function Reference vs Immediate Invocation Timing
 * 2. Prediction 1: Function Factory Lexical Environment Scope Isolation
 * 3. Prediction 2: Strategy Pattern Implemented with Pure First-Class Functions
 * 4. Prediction 3: Function Reference Identity in Set Storage
 * 5. Prediction 4: Composable Predicate Combinators (and/or)
 * 6. Practical Architecture: Enterprise Form Validation Rule Engine
 */

"use strict";

console.log("=== 1. GOTCHA: FUNCTION REFERENCE VS INVOCATION ===");
function deleteAction(id) {
  return `DELETED_USER_${id}`;
}

// Simulating React event handler registration:
function simulateButtonRender(eventProp) {
  console.log("Button registered handler type:", typeof eventProp);
}

// Invocations during render evaluate immediately
console.log("1. Passing invocation result:");
simulateButtonRender(deleteAction(42)); // Passes string "DELETED_USER_42" (Broken for event handling)

// Passing closure handler evaluates on click
console.log("2. Passing deferred closure reference:");
const clickHandler = () => deleteAction(42);
simulateButtonRender(clickHandler); // Passes function reference
console.log("Simulating click execution:", clickHandler());

console.log("\n=== 2. PREDICTION 1: FUNCTION FACTORY CLOSURE SCOPE ===");
function createFormatter(prefix) {
  return function(text) {
    return `[${prefix}] ${text.trim().toUpperCase()}`;
  };
}

const auditLogger = createFormatter("AUDIT");
const errorLogger = createFormatter("CRITICAL");

console.log(auditLogger("user logged in"));
console.log(errorLogger("database connection timeout"));

console.log("\n=== 3. PREDICTION 2: STRATEGY PATTERN WITH FUNCTIONS ===");
const calculateShipping = (weightKg, pricingStrategy) => pricingStrategy(weightKg);

const expressAirStrategy = (w) => 15 + w * 4.5;
const standardGroundStrategy = (w) => 5 + w * 1.2;

console.log("Express Air Shipping for 10kg: $" + calculateShipping(10, expressAirStrategy).toFixed(2));
console.log("Standard Ground Shipping for 10kg: $" + calculateShipping(10, standardGroundStrategy).toFixed(2));

console.log("\n=== 4. PREDICTION 3: FUNCTION IDENTITY IN SET STORAGE ===");
const createCallback = () => () => "EVENT_TRIGGERED";

const callbackSet = new Set();
const cb1 = createCallback();
const cb2 = createCallback();

callbackSet.add(cb1);
callbackSet.add(cb1); // Duplicate reference
callbackSet.add(cb2); // Distinct reference

console.log("Total unique callback instances in Set:", callbackSet.size); // 2
console.log("cb1 === cb2:", cb1 === cb2); // false

console.log("\n=== 5. PREDICTION 4: PREDICATE COMBINATORS ===");
const isEven = (n) => n % 2 === 0;
const isPositive = (n) => n > 0;

const and = (predA, predB) => (val) => predA(val) && predB(val);
const isPositiveEven = and(isEven, isPositive);

const numbers = [-4, -2, 0, 3, 6, 8, 11];
console.log("Filtered Positive Even Numbers:", numbers.filter(isPositiveEven)); // [6, 8]

console.log("\n=== 6. PRACTICAL ARCHITECTURE: COMPOSABLE VALIDATION ENGINE ===");

// Predicate Factories
const createMinLength = (min) => (val) => val.length >= min ? null : `Must be at least ${min} chars.`;
const createRequired = () => (val) => val.trim().length > 0 ? null : "Field is required.";
const createPattern = (regex, msg) => (val) => regex.test(val) ? null : msg;

// Higher-Order Function Combiner
function composeValidators(...validators) {
  return function(value) {
    for (const validate of validators) {
      const error = validate(value);
      if (error) return error; // Short-circuit on first failure
    }
    return null;
  };
}

const validateUsername = composeValidators(
  createRequired(),
  createMinLength(4),
  createPattern(/^[a-z0-9_]+$/i, "Can only contain alphanumeric characters.")
);

console.log("Validation '':", validateUsername("")); // Field is required.
console.log("Validation 'abc':", validateUsername("abc")); // Must be at least 4 chars.
console.log("Validation 'admin$':", validateUsername("admin$")); // Can only contain alphanumeric characters.
console.log("Validation 'prasenjeet_01':", validateUsername("prasenjeet_01")); // null (Valid!)
