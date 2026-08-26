/**
 * KPI 03 — Part 10: Scope Chain, Shadowing & Name Resolution
 * Demonstrates:
 * 1. Gotcha: Static Lexical Scope Chain vs Dynamic Call Stack
 * 2. Prediction 1: Basic Nested Scope Shadowing
 * 3. Prediction 2: Caller vs Lexical Scope Independence
 * 4. Prediction 3: Shadowing vs Mutating Outer Bindings
 * 5. Prediction 5: Scope Chain Traversal with Escaped Functions
 * 6. Practical Architecture: Hierarchical Scope Resolver Engine (Multi-Tenant Simulation)
 */

console.log("=== 1. GOTCHA & PREDICTION 2: STATIC LEXICAL SCOPE VS DYNAMIC CALL STACK ===");
const globalMsg = "global_scope_message";

function printMessage() {
  // Statically linked to Global Lexical Environment
  return globalMsg;
}

function callerFunction() {
  const globalMsg = "caller_local_override";
  return printMessage();
}

console.log("printMessage() called via callerFunction():", callerFunction()); // "global_scope_message"

console.log("\n=== 2. PREDICTION 1: BASIC NESTED SCOPE SHADOWING ===");
const envLevel = "level_0_global";

function outerScope() {
  const envLevel = "level_1_outer";

  function innerScope() {
    return envLevel;
  }

  return {
    innerVal: innerScope(),
    outerVal: envLevel
  };
}

const res = outerScope();
console.log("innerScope output:", res.innerVal); // "level_1_outer"
console.log("global envLevel:", envLevel);      // "level_0_global"

console.log("\n=== 3. PREDICTION 3: SHADOWING VS MUTATING OUTER BINDINGS ===");
let outerUserObj = { name: "Original_Global_User" };

function shadowTest() {
  const outerUserObj = { name: "Local_Shadowed_User" };
  outerUserObj.name = "Mutated_Local_User";
}
shadowTest();
console.log("outerUserObj.name after shadowTest():", outerUserObj.name); // "Original_Global_User"

console.log("\n=== 4. PREDICTION 5: RETURNED FUNCTION SCOPE CHAIN TRAVERSAL ===");
const value = "global_value";

function createResolver() {
  const value = "outer_closure_value";

  return function resolver() {
    return value;
  };
}

function executeResolver(cb) {
  const value = "execute_scope_value";
  return cb();
}

const resolverFn = createResolver();
console.log("executeResolver(resolverFn):", executeResolver(resolverFn)); // "outer_closure_value"

console.log("\n=== 5. PRACTICAL ARCHITECTURE: HIERARCHICAL SCOPE RESOLVER ===");

class HierarchicalScopeResolver {
  constructor(globalDefaults = {}) {
    this.globalDefaults = globalDefaults;
  }

  createTenantScope(tenantDefaults = {}) {
    // Outer Lexical Scope
    const tenantScope = { ...this.globalDefaults, ...tenantDefaults };

    return {
      createWorkspaceScope: (workspaceOverrides = {}) => {
        // Nearest-Match Resolution Chain: Workspace -> Tenant -> Global
        return {
          resolve: (key) => {
            if (key in workspaceOverrides) return { value: workspaceOverrides[key], source: "WORKSPACE" };
            if (key in tenantScope) return { value: tenantScope[key], source: "TENANT" };
            if (key in this.globalDefaults) return { value: this.globalDefaults[key], source: "GLOBAL" };
            return { value: undefined, source: "UNRESOLVED" };
          }
        };
      }
    };
  }
}

const configEngine = new HierarchicalScopeResolver({ theme: "light", concurrency: 10, region: "us-east-1" });
const tenantA = configEngine.createTenantScope({ concurrency: 25, region: "eu-west-1" });
const workspace1 = tenantA.createWorkspaceScope({ theme: "dark" });

console.log("Resolved 'theme':", workspace1.resolve("theme"));             // dark (WORKSPACE)
console.log("Resolved 'concurrency':", workspace1.resolve("concurrency")); // 25 (TENANT)
console.log("Resolved 'region':", workspace1.resolve("region"));           // eu-west-1 (TENANT)
