/**
 * KPI 04 — Part 03: Execution Context Lifecycle — Global Context, Function Context, Parameters & Binding Initialization
 * Demonstrates:
 * 1. Gotcha & Prediction 3: TDZ Binding Creation vs Function Declaration Hoisting vs typeof TDZ
 * 2. Prediction 1: Independent Parameter Bindings Across Separate Invocations
 * 3. Prediction 2: TDZ Violation Inside a Function Called Before Declaration
 * 4. Prediction 4: Object Reachability Surviving Function Return
 * 5. Practical Architecture: Enterprise Execution Lifecycle & Binding State Synchronizer
 */

console.log("=== 1. GOTCHA & PREDICTION 3: FUNCTION DECLARATIONS VS CONST ARROWS VS TYPEOF TDZ ===");
// Function declaration is fully initialized in Creation Phase:
console.log("typeof hoistedFnDeclaration:", typeof hoistedFnDeclaration); // "function"
console.log("hoistedFnDeclaration() output:", hoistedFnDeclaration());   // "instantiated_in_creation_phase"

function hoistedFnDeclaration() {
  return "instantiated_in_creation_phase";
}

let typeofTDZCaught = false;
try {
  // @ts-ignore
  const check = typeof tdzArrowFn; // Throws ReferenceError (TDZ violation)
  const tdzArrowFn = () => "arrow_fn";
} catch (err) {
  typeofTDZCaught = true;
  console.log("typeof on TDZ variable caught:", err.message);
}

console.log("\n=== 2. PREDICTION 1: PARAMETER BINDING INDEPENDENCE ===");
function modifyParameter(val) {
  val = val + 5;
  return val;
}
const firstCall = modifyParameter(10);
const secondCall = modifyParameter(10);
console.log("firstCall output:", firstCall);   // 15
console.log("secondCall output:", secondCall); // 15

console.log("\n=== 3. PREDICTION 2: TDZ VIOLATION INSIDE CALLED FUNCTION ===");
function readTheme() {
  // @ts-ignore
  return appTheme;
}
let tdzCallCaught = false;
try {
  readTheme(); // Attempt to read uninitialized global binding
  // @ts-ignore
  let appTheme = "dark";
} catch (err) {
  tdzCallCaught = true;
  console.log("readTheme() before declaration caught:", err.message);
}

console.log("\n=== 4. PREDICTION 4: OBJECT REACHABILITY SURVIVING RETURN ===");
function createSessionToken(userId) {
  const token = {
    userId,
    tokenString: `tok_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now()
  };
  return token; // Context pops off stack, but Object survives on Heap
}
const activeToken = createSessionToken("usr_889");
console.log("activeToken survives stack pop:", activeToken.userId, activeToken.tokenString);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: EXECUTION LIFECYCLE TRACKER ===");

class ExecutionLifecycleTracker {
  constructor() {
    this.recordedPhases = [];
  }

  traceInvocation(fnName, argsObject, executionCallback) {
    const contextId = `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    
    // Creation Phase: Initialize Parameter Records
    const parameterBindings = { ...argsObject };
    this.recordedPhases.push({
      contextId,
      fnName,
      phase: "CREATION_PHASE",
      bindings: parameterBindings
    });

    // Execution Phase: Run Function Body
    this.recordedPhases.push({
      contextId,
      fnName,
      phase: "EXECUTION_PHASE"
    });

    const result = executionCallback(parameterBindings);

    // Completion Phase: Return Result
    this.recordedPhases.push({
      contextId,
      fnName,
      phase: "COMPLETED",
      returnedResult: result
    });

    return result;
  }
}

const lifecycleEngine = new ExecutionLifecycleTracker();

const calcResult = lifecycleEngine.traceInvocation(
  "calculateInvoice",
  { subtotal: 500, taxRate: 0.18, discount: 50 },
  (params) => {
    const tax = params.subtotal * params.taxRate;
    const finalTotal = params.subtotal + tax - params.discount;
    return { subtotal: params.subtotal, tax, discount: params.discount, total: finalTotal };
  }
);

console.log("Lifecycle Tracking Result Total:", calcResult.total);
console.log("Recorded Lifecycle Phases:", lifecycleEngine.recordedPhases.map(p => `${p.fnName} [${p.phase}]`));
