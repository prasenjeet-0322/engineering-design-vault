/**
 * KPI 03 — Part 01: Scope Fundamentals, Lexical Scope & Scope Chain
 * Demonstrates:
 * 1. Gotcha & Prediction 4: Lexical Scope vs Call-Site Resolution
 * 2. Prediction 1: Scope Chain Resolution Halting at Nearest Match
 * 3. Prediction 2: Block Scope Isolation
 * 4. Prediction 3: Independent Factory Lexical Environments
 * 5. Practical Architecture: Multi-Tenant Config Resolver with Lexical Privacy
 */

console.log("=== 1. GOTCHA & PREDICTION 4: LEXICAL SCOPE VS CALL-SITE SCOPE ===");
const value = "global";

function createLogger() {
  const value = "factory";
  return function log() {
    return value; // Lexically resolves to 'factory', not call-site!
  };
}

const logger = createLogger();

function run(callback) {
  const value = "runner";
  return callback();
}

console.log("Result of run(logger):", run(logger)); // "factory"

console.log("\n=== 2. PREDICTION 1: SCOPE CHAIN NEAREST MATCH ===");
const globalVal = "global";

function outer() {
  const globalVal = "outer";
  function inner() {
    return globalVal; // Resolves nearest match 'outer'
  }
  return inner();
}

console.log("outer() nearest match:", outer()); // "outer"

console.log("\n=== 3. PREDICTION 2: BLOCK SCOPE ISOLATION ===");
const user = "Sunny";
let blockExecuted = false;

if (true) {
  const role = "Principal Architect";
  blockExecuted = true;
  console.log(`Inside block: user=${user}, role=${role}`);
}

try {
  // Accessing block-scoped variable outside will throw ReferenceError
  // @ts-ignore
  console.log(role);
} catch (err) {
  console.log("Outside block access caught:", err.name, `(${err.message})`);
}

console.log("\n=== 4. PREDICTION 3: INDEPENDENT FACTORY SCOPES ===");
function createCounter() {
  let count = 0; // Distinct Lexical Environment Record per call
  return () => ++count;
}

const a = createCounter();
const b = createCounter();

console.log("a():", a()); // 1
console.log("a():", a()); // 2
console.log("b():", b()); // 1

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-TENANT CONFIG RESOLVER ===");

const DEFAULT_CONFIG = {
  theme: "dark_slate",
  rateLimit: 1000
};

// Factory encapsulating tenant dictionary in private lexical scope
function createTenantResolver(tenantData) {
  return function resolveConfig(tenantId) {
    const config = tenantData[tenantId];
    if (!config) {
      console.log(`[Resolver] Tenant '${tenantId}' not found. Falling back to default.`);
      return DEFAULT_CONFIG;
    }
    return { ...DEFAULT_CONFIG, ...config };
  };
}

const tenants = {
  org_acme: { theme: "corporate_blue", rateLimit: 5000 },
  org_beta: { theme: "emerald_green", rateLimit: 2500 }
};

const resolveTenant = createTenantResolver(tenants);

console.log("Resolved Acme:", resolveTenant("org_acme"));
console.log("Resolved Unknown:", resolveTenant("org_unknown"));
