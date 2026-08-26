/**
 * KPI 03 — Part 12: `var`, `let`, and `const` — Binding Semantics, Hoisting, Redeclaration & Production Decisions
 * Demonstrates:
 * 1. Gotcha: Binding Immutability vs Object Value Immutability
 * 2. Prediction 1: var Hoisting (undefined) vs Assignment
 * 3. Prediction 2: Block-Level TDZ ReferenceError Simulation
 * 4. Prediction 3: const Object Property Mutation
 * 5. Prediction 4: Loop Closures (var shared vs let per-iteration)
 * 6. Practical Architecture: Enterprise Immutable State Manager with Deep Freeze
 */

console.log("=== 1. GOTCHA & PREDICTION 3: BINDING IMMUTABILITY VS OBJECT MUTATION ===");
const user = { name: "Sunny" };
user.name = "Alex"; // Property mutation is completely valid
console.log("Mutated user.name:", user.name); // "Alex"

let reassignmentFailed = false;
try {
  // @ts-ignore
  user = { name: "Bob" }; // Reassigning binding throws TypeError
} catch (err) {
  reassignmentFailed = true;
  console.log("Caught reassignment error:", err.message);
}

console.log("\n=== 2. PREDICTION 1: VAR HOISTING VS ASSIGNMENT ===");
console.log("Hoisted varStatus before assignment:", typeof varStatus !== "undefined" ? varStatus : undefined);
var varStatus = "ready";
console.log("varStatus after assignment line:", varStatus);

console.log("\n=== 3. PREDICTION 2: BLOCK-LEVEL TDZ SIMULATION ===");
function simulateTDZ() {
  let inTDZ = true;
  try {
    // Evaluating uninitialized binding throws ReferenceError
    // @ts-ignore
    const tdzVal = uninitVar;
    let uninitVar = 10;
  } catch (err) {
    inTDZ = true;
    console.log("Caught TDZ error:", err.message);
  }
}
simulateTDZ();

console.log("\n=== 4. PREDICTION 4: LOOP CLOSURES (VAR VS LET) ===");
const varCallbacks = [];
for (var i = 0; i < 3; i++) {
  varCallbacks.push(() => i);
}
console.log("var callbacks evaluation:", varCallbacks.map(fn => fn())); // [3, 3, 3]

const letCallbacks = [];
for (let j = 0; j < 3; j++) {
  letCallbacks.push(() => j);
}
console.log("let callbacks evaluation:", letCallbacks.map(fn => fn())); // [0, 1, 2]

console.log("\n=== 5. PRACTICAL ARCHITECTURE: IMMUTABLE STATE MANAGER ===");

function deepFreeze(obj) {
  Object.keys(obj).forEach(prop => {
    if (typeof obj[prop] === 'object' && obj[prop] !== null && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
}

class ImmutableStateManager {
  constructor(initialState) {
    this.currentState = deepFreeze(structuredClone(initialState));
  }

  getState() {
    return this.currentState;
  }

  update(updaterFn) {
    const draft = structuredClone(this.currentState);
    const updated = updaterFn(draft);
    this.currentState = deepFreeze(updated || draft);
    return this.currentState;
  }
}

const stateStore = new ImmutableStateManager({
  user: { id: "usr_101", roles: ["MEMBER"] },
  config: { theme: "dark" }
});

console.log("Initial state theme:", stateStore.getState().config.theme);

// Immutable update
stateStore.update(draft => {
  draft.config.theme = "light";
  draft.user.roles.push("ADMIN");
});

console.log("Updated state theme:", stateStore.getState().config.theme);
console.log("Updated state roles:", stateStore.getState().user.roles);
