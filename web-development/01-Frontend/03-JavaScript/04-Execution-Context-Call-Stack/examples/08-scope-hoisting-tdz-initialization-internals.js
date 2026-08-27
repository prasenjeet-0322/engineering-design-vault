/**
 * KPI 04 — Part 08: Scope, Hoisting, TDZ & Binding Initialization Internals
 * Demonstrates:
 * 1. Gotcha: var Early Initialization (undefined) vs let/const TDZ (ReferenceError)
 * 2. Prediction 1: TDZ Shadowing Trapping Outer Variable Lookup
 * 3. Prediction 2: Loop Closures (var Shared Binding vs let Per-Iteration Environments)
 * 4. Prediction 3: Default Parameter Left-to-Right Evaluation Order & TDZ
 * 5. Prediction 4: Class Declaration TDZ Violation
 * 6. Prediction 5: Function Declaration vs Expression Hoisting
 * 7. Practical Architecture: Enterprise Module Initialization Pipeline with Dependency Verification
 */

console.log("=== 1. GOTCHA: VAR INITIALIZATION VS LET/CONST TDZ ===");
// @ts-ignore
console.log("varAlpha before declaration line:", varAlpha); // undefined
var varAlpha = "initialized_var";

let letTdzCaught = false;
try {
  // @ts-ignore
  console.log("letBeta before declaration line:", letBeta);
  let letBeta = "initialized_let";
} catch (err) {
  letTdzCaught = true;
  console.log("let before declaration caught:", err.message);
}

console.log("\n=== 2. PREDICTION 1: TDZ SHADOWING TRAP ===");
const globalAuth = "GLOBAL_TOKEN";
let shadowTdzCaught = false;
try {
  {
    // Inner lexical block enters scope -> local 'globalAuth' is uninitialized in TDZ
    // @ts-ignore
    const read = globalAuth;
    const globalAuth = "BLOCK_TOKEN";
  }
} catch (err) {
  shadowTdzCaught = true;
  console.log("Inner TDZ shadowing caught:", err.message);
}

console.log("\n=== 3. PREDICTION 2: LOOP CLOSURES (VAR VS LET) ===");
const varClosures = [];
for (var v = 0; v < 3; v++) {
  varClosures.push(() => v);
}
console.log("var loop closures:", varClosures.map(fn => fn())); // [3, 3, 3]

const letClosures = [];
for (let l = 0; l < 3; l++) {
  letClosures.push(() => l);
}
console.log("let loop closures:", letClosures.map(fn => fn())); // [0, 1, 2]

console.log("\n=== 4. PREDICTION 3: DEFAULT PARAMETER TDZ EVALUATION ===");
function paramOrderTest(a = 5, b = a * 2) {
  return { a, b };
}
console.log("Valid default parameter evaluation:", paramOrderTest()); // { a: 5, b: 10 }

let paramTdzCaught = false;
try {
  function invalidParamOrder(x = y, y = 10) {
    return { x, y };
  }
  invalidParamOrder();
} catch (err) {
  paramTdzCaught = true;
  console.log("Invalid parameter default order caught:", err.message);
}

console.log("\n=== 5. PREDICTION 4: CLASS DECLARATION TDZ ===");
let classTdzCaught = false;
try {
  // @ts-ignore
  const instance = new OrderManager();
  class OrderManager {}
} catch (err) {
  classTdzCaught = true;
  console.log("Class instantiated before declaration caught:", err.message);
}

console.log("\n=== 6. PREDICTION 5: FUNCTION DECLARATION VS EXPRESSION ===");
console.log("typeof hoistedFnDeclaration:", typeof hoistedFnDeclaration); // "function"
console.log("typeof uninitializedFnVar:", typeof uninitializedFnVar);     // "undefined"
function hoistedFnDeclaration() { return true; }
var uninitializedFnVar = () => true;

console.log("\n=== 7. PRACTICAL ARCHITECTURE: MODULE INITIALIZATION PIPELINE ===");

class ModuleInitializationPipeline {
  constructor() {
    this.services = new Map();
    this.initializationOrder = [];
  }

  register(serviceName, dependencies, factoryFn) {
    this.services.set(serviceName, {
      dependencies,
      factoryFn,
      instance: null,
      status: "UNINITIALIZED" // TDZ-equivalent state
    });
  }

  initialize(serviceName) {
    const serviceDef = this.services.get(serviceName);
    if (!serviceDef) throw new Error(`Unknown service: ${serviceName}`);
    if (serviceDef.status === "INITIALIZING") {
      throw new Error(`Circular dependency detected while initializing: ${serviceName}`);
    }
    if (serviceDef.status === "INITIALIZED") {
      return serviceDef.instance;
    }

    serviceDef.status = "INITIALIZING";

    // Resolve dependencies first (Topological initialization order)
    const resolvedDeps = serviceDef.dependencies.map(dep => this.initialize(dep));

    serviceDef.instance = serviceDef.factoryFn(...resolvedDeps);
    serviceDef.status = "INITIALIZED";
    this.initializationOrder.push(serviceName);

    return serviceDef.instance;
  }
}

const pipeline = new ModuleInitializationPipeline();

pipeline.register("DatabaseService", [], () => ({ dbUrl: "postgres://localhost:5432" }));
pipeline.register("LoggerService", [], () => ({ log: (m) => console.log(`[LOG] ${m}`) }));
pipeline.register("UserService", ["DatabaseService", "LoggerService"], (db, logger) => {
  return {
    getUser: (id) => {
      logger.log(`Querying ${db.dbUrl} for user ${id}`);
      return { id, name: "Sunny" };
    }
  };
});

const userSvc = pipeline.initialize("UserService");
console.log("UserService query output:", userSvc.getUser("usr_100"));
console.log("Initialization Order:", pipeline.initializationOrder);
