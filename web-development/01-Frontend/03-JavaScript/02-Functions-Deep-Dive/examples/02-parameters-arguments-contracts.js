/**
 * KPI 02 — Part 2: Parameters, Arguments, Rest & Return Semantics
 * Demonstrates:
 * 1. Prediction 1: Left-to-Right Argument Evaluation
 * 2. Prediction 2: Dynamic Default Parameter Evaluation
 * 3. Prediction 3: Pass-by-Value vs Parameter Reassignment
 * 4. Prediction 4: Default Parameter Trigger Matrix
 * 5. Prediction 6: Rest Parameter Gathering
 * 6. Practical Architecture: Pure Structural Sharing Updater
 */

console.log("=== 1. PREDICTION 1: LEFT-TO-RIGHT ARGUMENT EVALUATION ===");
let count = 1;
function printArgs(a, b) {
  console.log("a:", a, "b:", b, "count:", count);
}
printArgs(count++, ++count); // a: 1, b: 3, count: 3

console.log("\n=== 2. PREDICTION 2: DYNAMIC DEFAULT PARAMETER EVALUATION ===");
let generatorCalls = 0;
function generateDefault() {
  generatorCalls++;
  return `generated-${generatorCalls}`;
}

function testDefault(id = generateDefault()) {
  return id;
}

console.log("testDefault():   ", testDefault());      // "generated-1"
console.log("testDefault(999):", testDefault(999));    // 999 (generateDefault skipped!)
console.log("Total generator calls:", generatorCalls); // 1

console.log("\n=== 3. PREDICTION 3: PASS-BY-VALUE VS REASSIGNMENT ===");
function mutateAndReassign(user) {
  user.name = "Alice";         // Mutates shared Heap object!
  user = { name: "Bob" };      // Rebinds local callee binding ONLY
}

const originalUser = { name: "Sunny" };
mutateAndReassign(originalUser);
console.log("originalUser.name after function call:", originalUser.name); // "Alice"

console.log("\n=== 4. PREDICTION 4: DEFAULT PARAMETER TRIGGER MATRIX ===");
function checkFallback(val = "FALLBACK_ACTIVATED") {
  return val;
}

console.log("Omitted:  ", checkFallback());          // "FALLBACK_ACTIVATED"
console.log("undefined:", checkFallback(undefined)); // "FALLBACK_ACTIVATED"
console.log("null:     ", checkFallback(null));      // null (Preserved!)
console.log("0:        ", checkFallback(0));         // 0 (Preserved!)
console.log("false:    ", checkFallback(false));     // false (Preserved!)

console.log("\n=== 5. PREDICTION 6: REST PARAMETER GATHERING ===");
function gatherStats(label, ...scores) {
  console.log("Label: ", label);
  console.log("Scores:", scores);
  const total = scores.reduce((sum, s) => sum + s, 0);
  console.log("Total: ", total);
}
gatherStats("Quarter 1", 90, 85, 95);

console.log("\n=== 6. PRACTICAL ARCHITECTURE: PURE PROFILE UPDATER ===");

const initialProfile = {
  id: "u-101",
  name: "Sunny",
  preferences: { theme: "dark", notifications: true }
};

function updateProfileSafely(current, updates = {}) {
  return {
    ...current,
    name: updates.name ?? current.name,
    preferences: {
      ...current.preferences,
      ...(updates.preferences ?? {})
    }
  };
}

const updatedProfile = updateProfileSafely(initialProfile, {
  preferences: { theme: "light" }
});

console.log("Initial profile untouched: ", initialProfile.preferences);
console.log("Updated profile (new theme):", updatedProfile.preferences);
console.log("Structural sharing (notifications preserved):", updatedProfile.preferences.notifications === true);
console.log("New object identity (React state safe):     ", initialProfile !== updatedProfile);
