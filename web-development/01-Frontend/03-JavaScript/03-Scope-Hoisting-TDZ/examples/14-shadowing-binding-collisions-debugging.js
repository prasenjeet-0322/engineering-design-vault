/**
 * KPI 03 — Part 14: Shadowing — Binding Collisions, Scope Isolation & Production Debugging
 * Demonstrates:
 * 1. Gotcha & Prediction 2: TDZ Shadowing Blocking Outer Fallback
 * 2. Prediction 1: Callback Parameter Shadowing (Self-Comparison Bug)
 * 3. Prediction 3: Shadowing vs Variable Reassignment
 * 4. Prediction 5: Deeply Nested Closure Binding Selection
 * 5. Prediction 6: var in Block (Mutation) vs let in Block (Shadowing)
 * 6. Practical Architecture: Enterprise Multi-Tenant Permission Resolver with Explicit Role Naming
 */

console.log("=== 1. GOTCHA & PREDICTION 2: TDZ SHADOWING BLOCKING FALLBACK ===");
const theme = "dark";
function testTDZShadowing() {
  try {
    // @ts-ignore
    const currentTheme = localTheme; // Throws ReferenceError (TDZ)
    const localTheme = "light";
    return currentTheme;
  } catch (err) {
    return `Caught TDZ Error: ${err.message}`;
  }
}
console.log("testTDZShadowing() result:", testTDZShadowing());

console.log("\n=== 2. PREDICTION 1: CALLBACK PARAMETER SHADOWING BUG ===");
const targetUser = { id: 100, name: "Admin" };
const userList = [{ id: 1, name: "Alpha" }, { id: 2, name: "Beta" }];

// ❌ Buggy self-comparison due to parameter shadowing:
const buggyMatches = userList.filter(targetUser => targetUser.id === targetUser.id);
console.log("Buggy matches (all elements matched):", buggyMatches.length); // 2

// ✅ Corrected with explicit role-based naming:
const correctMatches = userList.filter(listUser => listUser.id === targetUser.id);
console.log("Correct matches count:", correctMatches.length); // 0

console.log("\n=== 3. PREDICTION 3: SHADOWING VS REASSIGNMENT ===");
let outerCounter = 10;
{
  let outerCounter = 20;
  outerCounter += 5;
  console.log("Inner counter (shadowed):", outerCounter); // 25
}
console.log("Outer counter (unaffected):", outerCounter);  // 10

console.log("\n=== 4. PREDICTION 5: DEEPLY NESTED CLOSURE BINDING SELECTION ===");
const globalVal = "global_val";
function createDeepScope() {
  const globalVal = "outer_val";
  return function middleScope() {
    return function innerClosure() {
      return globalVal;
    };
  };
}
const deepClosure = createDeepScope()();
console.log("deepClosure() resolved:", deepClosure()); // "outer_val"

console.log("\n=== 5. PREDICTION 6: VAR IN BLOCK VS LET IN BLOCK ===");
var sharedVar = "global_var";
{
  var sharedVar = "mutated_in_block";
}
console.log("sharedVar after block (mutated):", sharedVar); // "mutated_in_block"

let isolatedLet = "global_let";
{
  let isolatedLet = "isolated_in_block";
}
console.log("isolatedLet after block (isolated):", isolatedLet); // "global_let"

console.log("\n=== 6. PRACTICAL ARCHITECTURE: PERMISSION RESOLVER ===");

class MultiTenantPermissionResolver {
  constructor(authenticatedUser) {
    this.authenticatedUser = authenticatedUser;
  }

  filterAccessibleUsers(managedUsers) {
    // Explicit domain naming eliminates shadowing bugs
    const currentUser = this.authenticatedUser;

    return managedUsers.filter(candidateUser => {
      if (currentUser.role === "ADMIN") return true;
      if (currentUser.role === "EDITOR" && candidateUser.role === "VIEWER") {
        return currentUser.tenantId === candidateUser.tenantId;
      }
      return false;
    });
  }
}

const authAdmin = { id: "usr_01", role: "ADMIN", tenantId: "tenant_alpha" };
const authEditor = { id: "usr_02", role: "EDITOR", tenantId: "tenant_alpha" };

const userPool = [
  { id: "usr_10", role: "VIEWER", tenantId: "tenant_alpha" },
  { id: "usr_20", role: "ADMIN", tenantId: "tenant_alpha" },
  { id: "usr_30", role: "VIEWER", tenantId: "tenant_beta" }
];

const adminResolver = new MultiTenantPermissionResolver(authAdmin);
const editorResolver = new MultiTenantPermissionResolver(authEditor);

console.log("Admin can access:", adminResolver.filterAccessibleUsers(userPool).map(u => u.id));   // ["usr_10", "usr_20", "usr_30"]
console.log("Editor can access:", editorResolver.filterAccessibleUsers(userPool).map(u => u.id)); // ["usr_10"]
