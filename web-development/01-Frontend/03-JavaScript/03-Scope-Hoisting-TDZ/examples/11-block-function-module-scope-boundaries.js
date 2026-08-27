/**
 * KPI 03 — Part 11: Block Scope, Function Scope, Module Scope & Scope Boundaries
 * Demonstrates:
 * 1. Gotcha: var in Block vs let/const Block Isolation
 * 2. Prediction 1: Block Scope Shadowing
 * 3. Prediction 2: var Leaking from Control Blocks
 * 4. Prediction 3: Loop Closures (Per-Iteration Bindings)
 * 5. Prediction 4: Escaping Closure Extending Block Lifetime
 * 6. Practical Architecture: Multi-Layer Scope Boundary Isolator Engine
 */

console.log("=== 1. GOTCHA: VAR VS LET/CONST IN BLOCKS ===");
{
  var varMessage = "hello_var";
  const constMessage = "hello_const";
}
console.log("varMessage accessible outside block:", varMessage); // "hello_var"

let constAccessible = false;
try {
  // @ts-ignore
  if (typeof constMessage !== "undefined") constAccessible = true;
} catch {
  constAccessible = false;
}
console.log("constMessage accessible outside block?", constAccessible); // false (ReferenceError)

console.log("\n=== 2. PREDICTION 1: BLOCK SCOPE SHADOWING ===");
let scopedVal = "outer_val";
{
  const scopedVal = "inner_val";
  console.log("Inside block scopedVal:", scopedVal); // "inner_val"
}
console.log("Outside block scopedVal:", scopedVal);   // "outer_val"

console.log("\n=== 3. PREDICTION 2: VAR LEAKING FROM IF BLOCK ===");
function testVarLeak() {
  if (true) {
    var leakedFlag = "flag_active";
  }
  return leakedFlag;
}
console.log("testVarLeak() output:", testVarLeak()); // "flag_active"

console.log("\n=== 4. PREDICTION 3: LOOP CLOSURES PER-ITERATION BINDINGS ===");
const iterationCallbacks = [];
for (let i = 0; i < 3; i++) {
  iterationCallbacks.push(() => i);
}
console.log("Iteration callbacks evaluation:", iterationCallbacks.map(fn => fn())); // [0, 1, 2]

console.log("\n=== 5. PREDICTION 4: ESCAPING CLOSURE EXTENDING BLOCK LIFETIME ===");
function createBlockClosure() {
  {
    const blockSecret = "block_secret_9942";
    return () => `Retrieved: ${blockSecret}`;
  }
}
const blockClosure = createBlockClosure();
console.log("blockClosure() output:", blockClosure()); // "Retrieved: block_secret_9942"

console.log("\n=== 6. PRACTICAL ARCHITECTURE: MULTI-LAYER SCOPE BOUNDARY ISOLATOR ===");

class ScopeBoundaryIsolator {
  constructor() {
    this.moduleCache = new Map();
  }

  // Safe Request-Level Scope Isolation Simulation
  createRequestScope(requestId, userId) {
    // Request Lexical Environment
    const requestMetadata = { requestId, userId, createdAt: Date.now() };

    return {
      executeInScope: (actionFn) => {
        // Block-level computation inside function scope
        const blockTimestamp = Date.now();
        return actionFn({ ...requestMetadata, executedAt: blockTimestamp });
      }
    };
  }
}

const isolator = new ScopeBoundaryIsolator();
const requestScope1 = isolator.createRequestScope("req_101", "usr_alpha");
const requestScope2 = isolator.createRequestScope("req_102", "usr_beta");

const res1 = requestScope1.executeInScope((ctx) => `User ${ctx.userId} processed request ${ctx.requestId}`);
const res2 = requestScope2.executeInScope((ctx) => `User ${ctx.userId} processed request ${ctx.requestId}`);

console.log("Request 1 Output:", res1);
console.log("Request 2 Output:", res2);
