/**
 * KPI 01 — Part 5: Equality, ==, ===, Object.is() & Comparison Semantics
 * Demonstrates:
 * 1. Prediction Challenge 1: Identity vs Structure
 * 2. Prediction Challenge 2: NaN and Signed Zero (+0 vs -0)
 * 3. Prediction Challenge 3: Abstract Equality Coercion Chain ([] == ![])
 * 4. React State Bailout Simulation with Object.is()
 * 5. Practical Architecture: Identity-Aware Structural Sharing Updater
 */

console.log("=== 1. PREDICTION 1: IDENTITY VS STRUCTURE ===");
const objA = { value: 10 };
const objB = { value: 10 };
const objC = objA;

console.log("objA === objB (Separate Heap allocations):", objA === objB); // false
console.log("objA === objC (Shared memory pointer):     ", objA === objC); // true
console.log("objB === objC:                             ", objB === objC); // false

console.log("\n=== 2. PREDICTION 2: NAN AND SIGNED ZERO ===");
console.log("NaN === NaN:        ", NaN === NaN); // false (IEEE 754 float rule)
console.log("Object.is(NaN, NaN):", Object.is(NaN, NaN)); // true ✅ (SameValue algorithm)
console.log("+0 === -0:          ", +0 === -0); // true
console.log("Object.is(+0, -0):  ", Object.is(+0, -0)); // false ⚠️

console.log("\n=== 3. PREDICTION 3: ABSTRACT EQUALITY COERCION CHAINS ===");
console.log("null == undefined: ", null == undefined); // true (ECMAScript spec rule)
console.log("null === undefined:", null === undefined); // false
console.log('"0" == false:      ', "0" == false); // true (false -> 0, "0" -> 0)
console.log('"0" === false:     ', "0" === false); // false
console.log("[] == ![]:         ", [] == ![]); // true (Step-by-step: ![] -> false -> 0, [] -> "" -> 0)

console.log("\n=== 4. REACT STATE UPDATE & BAILOUT SIMULATION ===");

/**
 * Simulates React's internal state setter dispatcher check:
 * If Object.is(prevState, nextState) is true, React bails out of re-rendering.
 */
class ReactStateHookSimulator {
  constructor(initialState) {
    this.state = initialState;
    this.renderCount = 0;
  }

  setState(nextState) {
    // ⚡ React's internal equality comparison:
    if (Object.is(this.state, nextState)) {
      console.log("⚡ React BAILOUT: Object.is() evaluated true -> Render skipped ($0 UI cost)!");
      return;
    }

    this.state = nextState;
    this.renderCount++;
    console.log(`🚀 React RENDER triggered! (Total renders: ${this.renderCount})`);
  }
}

const userStore = new ReactStateHookSimulator({ name: "Sunny" });

console.log("--- Test A: In-place Mutation Hazard ---");
const currentUser = userStore.state;
currentUser.name = "Alex"; // Mutates heap in-place!
userStore.setState(currentUser); // Passes the identical pointer address (0xA1F0)
console.log("Store State Name:", userStore.state.name); // "Alex"
console.log("Render Count:    ", userStore.renderCount); // 0 (Silent Bailout!)

console.log("\n--- Test B: Fresh Identity Creation (Immutable) ---");
userStore.setState({ ...userStore.state, name: "Alex" }); // New Heap pointer address!
console.log("Render Count:    ", userStore.renderCount); // 1 (Successfully rendered!)

console.log("\n=== 5. PRACTICAL ARCHITECTURE: IDENTITY-AWARE STATE UPDATER ===");

const initialAppState = {
  user: { id: "u1", name: "Sunny" },
  preferences: { theme: "dark", notifications: true }
};

function updateUserName(state, newName) {
  if (state.user.name === newName) return state; // Zero-allocation bailout

  return {
    ...state,
    user: { ...state.user, name: newName }
    // preferences branch is REUSED by reference
  };
}

const nextAppState = updateUserName(initialAppState, "Alex");

console.log("1. State container changed:      ", initialAppState !== nextAppState); // true
console.log("2. User object changed:           ", initialAppState.user !== nextAppState.user); // true
console.log("3. Preferences branch REUSED (⚡):", initialAppState.preferences === nextAppState.preferences); // true ✅
console.log("4. User name successfully updated:", nextAppState.user.name); // "Alex"
