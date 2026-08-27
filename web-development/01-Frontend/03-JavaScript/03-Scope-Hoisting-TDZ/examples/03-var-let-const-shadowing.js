/**
 * KPI 03 — Part 03: Shadowing, Scope Collisions & Nested Lexical Environments
 * Demonstrates:
 * 1. Gotcha: Shadowing inside the TDZ (ReferenceError Halting)
 * 2. Prediction 1: Basic Variable Shadowing Inside Functions
 * 3. Prediction 3: Lexical Scope vs Caller Execution Context
 * 4. Prediction 4: Legal Block Shadowing vs Function var Shadowing
 * 5. Prediction 5: Independent Factory Scopes
 * 6. Practical Architecture: Multi-Layer State Synchronizer with Explicit Domain Naming
 */

console.log("=== 1. GOTCHA: SHADOWING INSIDE TDZ ===");
const globalValue = "outer";

function testTDZShadowing() {
  try {
    // Local 'const globalValue' shadows the outer variable across the entire function scope
    // @ts-ignore
    console.log(globalValue);
    const globalValue = "inner";
  } catch (err) {
    console.log("TDZ Shadowing Error Caught:", err.name, `(${err.message})`);
  }
}
testTDZShadowing();

console.log("\n=== 2. PREDICTION 1: BASIC VARIABLE SHADOWING ===");
const theme = "light";

function renderTheme() {
  const theme = "dark"; // Shadows outer 'theme'
  console.log("Inside renderTheme():", theme); // "dark"
}
renderTheme();
console.log("Outside renderTheme():", theme); // "light"

console.log("\n=== 3. PREDICTION 3: LEXICAL SCOPE VS CALLER CONTEXT ===");
const environmentName = "production";

function printEnv() {
  console.log("printEnv() resolved:", environmentName); // Lexically resolved from definition location
}

function testRunner() {
  const environmentName = "staging";
  printEnv(); // Call site does NOT change lexical resolution
}
testRunner(); // Logs: "production"

console.log("\n=== 4. PREDICTION 4: LEGAL BLOCK SHADOWING ===");
let outerCounter = 1;
{
  let outerCounter = 2; // ✅ VALID: Separate block-level declarative environment
  console.log("Block-scoped shadow:", outerCounter); // 2
}
console.log("Outer counter remains:", outerCounter); // 1

console.log("\n=== 5. PREDICTION 5: INDEPENDENT FACTORY CLOSURES ===");
function createCounterFactory() {
  let count = 0;
  return () => ++count;
}
const counterA = createCounterFactory();
const counterB = createCounterFactory();
console.log("counterA:", counterA(), counterA()); // 1, 2
console.log("counterB:", counterB());             // 1

console.log("\n=== 6. PRACTICAL ARCHITECTURE: MULTI-LAYER STATE SYNCHRONIZER ===");

class UserStateSynchronizer {
  constructor(serverUser) {
    this.serverUser = Object.freeze({ ...serverUser });
    this.draftUser = { ...serverUser };
  }

  // Clear, non-shadowed domain qualifiers
  updateDraftDisplayName(newDisplayName) {
    this.draftUser.displayName = newDisplayName;
    console.log(`[Draft] Updated display name: ${this.draftUser.displayName}`);
  }

  getResolvedActiveUser() {
    // Merge server baseline with draft mutations
    return {
      ...this.serverUser,
      ...this.draftUser
    };
  }

  commitChanges() {
    this.serverUser = Object.freeze({ ...this.draftUser });
    console.log(`[Sync] Committed draft to server baseline for user: ${this.serverUser.id}`);
    return this.serverUser;
  }
}

const synchronizer = new UserStateSynchronizer({
  id: "usr_101",
  email: "sunny@enterprise.io",
  displayName: "Sunny"
});

synchronizer.updateDraftDisplayName("Prasenjeet Kumar");
const active = synchronizer.getResolvedActiveUser();
console.log("Active User View:", active);
synchronizer.commitChanges();
