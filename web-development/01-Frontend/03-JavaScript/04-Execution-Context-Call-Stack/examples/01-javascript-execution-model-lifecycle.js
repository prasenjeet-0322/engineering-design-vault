/**
 * KPI 04 — Part 01: The JavaScript Execution Model — Why “Code Runs Top to Bottom” Is an Incomplete Mental Model
 * Demonstrates:
 * 1. Gotcha: Execution Context vs Call Stack vs Scope Chain
 * 2. Prediction 1: Independent Local Variables Across Multiple Invocations
 * 3. Prediction 2: Execution Context vs Lexical Scope Resolution
 * 4. Prediction 3: Synchronous Nested Invocations & Caller Pausing
 * 5. Prediction 4: Context Object Instance Independence
 * 6. Practical Architecture: Enterprise Execution Context & Call Stack Simulator
 */

console.log("=== 1. GOTCHA & PREDICTION 2: EXECUTION CONTEXT VS SCOPE CHAIN ===");
const globalScopeValue = "global_lexical_binding";

function targetFunction() {
  return globalScopeValue; // Resolved via static Scope Chain (GEC)
}

function callerFunction() {
  const globalScopeValue = "caller_frame_binding";
  return targetFunction(); // Called here, but ignores caller's frame
}

console.log("targetFunction() output via caller:", callerFunction()); // "global_lexical_binding"

console.log("\n=== 2. PREDICTION 1: INDEPENDENT LOCAL CONTEXT VARIABLES ===");
function calculateSum(a, b) {
  const localSum = a + b;
  return localSum;
}
console.log("calculateSum(1, 2) output:", calculateSum(1, 2));   // 3
console.log("calculateSum(10, 20) output:", calculateSum(10, 20)); // 30

console.log("\n=== 3. PREDICTION 3: SYNCHRONOUS NESTED INVOCATIONS ===");
const executionLog = [];
function firstStep() {
  executionLog.push("First Start");
  secondStep();
  executionLog.push("First End");
}
function secondStep() {
  executionLog.push("Second Step Executed");
}
firstStep();
console.log("Execution Log:", executionLog); // ["First Start", "Second Step Executed", "First End"]

console.log("\n=== 4. PREDICTION 4: CONTEXT OBJECT INSTANCE INDEPENDENCE ===");
function createInstance(id) {
  return { id, timestamp: Date.now() };
}
const instanceA = createInstance("alpha");
const instanceB = createInstance("alpha");
console.log("instanceA === instanceB?", instanceA === instanceB); // false

console.log("\n=== 5. PRACTICAL ARCHITECTURE: EXECUTION CONTEXT SIMULATOR ===");

class ExecutionContextSimulator {
  constructor() {
    this.callStack = [];
    this.pushContext("Global Execution Context (GEC)", { globalVar: "active" });
  }

  pushContext(name, bindings = {}) {
    const frame = {
      contextName: name,
      environmentRecord: bindings,
      pushedAt: Date.now()
    };
    this.callStack.push(frame);
    console.log(`[Call Stack PUSH] Active Frame: ${name} (Depth: ${this.callStack.length})`);
    return frame;
  }

  popContext() {
    const popped = this.callStack.pop();
    console.log(`[Call Stack POP] Deallocated Frame: ${popped.contextName} (Remaining Depth: ${this.callStack.length})`);
    return popped;
  }

  execute(fnName, bindings, workFn) {
    this.pushContext(fnName, bindings);
    const result = workFn(bindings);
    this.popContext();
    return result;
  }
}

const simulator = new ExecutionContextSimulator();

simulator.execute("fetchUserProfile", { userId: "usr_991" }, (ctx) => {
  return simulator.execute("validateUserRole", { role: "ADMIN" }, (subCtx) => {
    return `User ${ctx.userId} verified with role ${subCtx.role}`;
  });
});
