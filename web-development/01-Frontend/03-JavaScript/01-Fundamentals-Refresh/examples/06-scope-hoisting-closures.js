/**
 * KPI 01 — Part 6: Variable Declarations, Scope, Hoisting & TDZ
 * Demonstrates:
 * 1. Prediction Challenge 1: Hoisting & TDZ (Temporal Dead Zone)
 * 2. Prediction Challenge 2: Loop Closures (var vs let)
 * 3. Prediction Challenge 3: Function Declarations vs Expressions
 * 4. Prediction Challenge 4: React Stale Closure Simulation & Functional Fix
 */

console.log("=== 1. PREDICTION 1: HOISTING & TDZ ===");
console.log("var hoisted before declaration:", typeof hoistedVar, hoistedVar); // undefined

try {
  // Attempting to access let in TDZ
  // @ts-ignore
  console.log(tdzLet);
} catch (err) {
  console.log("Caught expected TDZ error:", err.message); // ReferenceError: Cannot access 'tdzLet' before initialization
}

var hoistedVar = "I am hoisted with undefined";
let tdzLet = "I am initialized now";
console.log("let accessed after declaration: ", tdzLet);

console.log("\n=== 2. PREDICTION 2: LOOP CLOSURES (VAR VS LET) ===");
// Simulating var loop behavior
const varCallbacks = [];
for (var i = 0; i < 3; i++) {
  varCallbacks.push(() => i);
}
console.log("var callbacks output (shared single binding):", varCallbacks.map(fn => fn())); // [3, 3, 3]

// Simulating let loop behavior
const letCallbacks = [];
for (let j = 0; j < 3; j++) {
  letCallbacks.push(() => j);
}
console.log("let callbacks output (per-iteration lexical scope):", letCallbacks.map(fn => fn())); // [0, 1, 2]

console.log("\n=== 3. PREDICTION 3: FUNCTION DECLARATIONS VS EXPRESSIONS ===");
console.log("Function Declaration invoked before definition:", hoistedFunction()); // "I am hoisted!"

function hoistedFunction() {
  return "I am hoisted!";
}

try {
  // @ts-ignore
  console.log(arrowFuncExpression());
} catch (err) {
  console.log("Arrow function expression in TDZ:", err.message);
}

const arrowFuncExpression = () => "Arrow function expression";

console.log("\n=== 4. REACT STALE CLOSURE SIMULATION & FIX ===");

class ReactClosureSimulator {
  constructor(initialValue) {
    this.state = initialValue;
  }

  // Simulates an unrefreshed closure (e.g. useEffect with missing deps)
  createStaleGetter() {
    const capturedState = this.state; // Captures snapshot at creation time!
    return () => `Stale Snapshot Value: ${capturedState}`;
  }

  // Simulates a functional state getter (Reading latest state)
  createFreshGetter() {
    return () => `Fresh State Value: ${this.state}`;
  }

  updateState(newValue) {
    this.state = newValue;
  }
}

const component = new ReactClosureSimulator(0);
const staleReader = component.createStaleGetter();
const freshReader = component.createFreshGetter();

component.updateState(10); // User clicks button -> state updates to 10!

console.log(staleReader()); // "Stale Snapshot Value: 0" (STALE CLOSURE BUG ⚠️)
console.log(freshReader()); // "Fresh State Value: 10" (FIXED ✅)
