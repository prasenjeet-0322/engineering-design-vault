"use strict";

/**
 * KPI 04 — Part 05: Strict Mode, Global Execution & ES Modules
 * Demonstrates:
 * 1. Gotcha: Strict Mode Plain Function Call (this === undefined)
 * 2. Prediction 1: Property Mutation on undefined Receiver (TypeError)
 * 3. Prediction 3: Accidental Global Prevention (ReferenceError)
 * 4. Prediction 4: Safe Environment Detection across Browser/Node.js/SSR
 * 5. Prediction 5: Non-Writable Property Mutation in Strict Mode (TypeError)
 * 6. Practical Architecture: Enterprise Multi-Runtime Boundary Isolator & Safe Request Context
 */

console.log("=== 1. GOTCHA: STRICT MODE PLAIN FUNCTION CALL (THIS === UNDEFINED) ===");
function getPlainThis() {
  return this;
}
console.log("getPlainThis() output in strict mode:", getPlainThis()); // undefined

console.log("\n=== 2. PREDICTION 1: PROPERTY ACCESS ON UNDEFINED RECEIVER ===");
function incrementCounter() {
  // @ts-ignore
  this.counter++;
}
let typeErrorCaught = false;
try {
  incrementCounter();
} catch (err) {
  typeErrorCaught = true;
  console.log("incrementCounter() error caught:", err.message);
}

console.log("\n=== 3. PREDICTION 3: ACCIDENTAL GLOBAL PREVENTION ===");
function createAccidentalGlobal() {
  // @ts-ignore
  undeclaredGlobalVar = "leaked_data";
}
let refErrorCaught = false;
try {
  createAccidentalGlobal();
} catch (err) {
  refErrorCaught = true;
  console.log("createAccidentalGlobal() error caught:", err.message);
}

console.log("\n=== 4. PREDICTION 4: SAFE ENVIRONMENT DETECTION ===");
function getRuntimeEnvironment() {
  const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
  const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
  const isWorker = typeof importScripts === "function";

  return {
    isBrowser,
    isNode,
    isWorker,
    globalContextName: typeof globalThis !== "undefined" ? "globalThis supported" : "unknown"
  };
}
console.log("Detected Runtime Environment:", getRuntimeEnvironment());

console.log("\n=== 5. PREDICTION 5: NON-WRITABLE PROPERTY MUTATION ===");
const sealedConfig = {};
Object.defineProperty(sealedConfig, "apiKey", {
  value: "PROD_SECRET_KEY",
  writable: false,
  configurable: false
});

let nonWritableCaught = false;
try {
  // @ts-ignore
  sealedConfig.apiKey = "DEV_OVERRIDE";
} catch (err) {
  nonWritableCaught = true;
  console.log("Mutating non-writable property caught:", err.message);
}

console.log("\n=== 6. PRACTICAL ARCHITECTURE: MULTI-RUNTIME BOUNDARY ISOLATOR ===");

class MultiRuntimeBoundaryIsolator {
  constructor() {
    this.runtime = getRuntimeEnvironment();
  }

  // Safe request-level execution isolating state across SSR concurrent calls
  executeWithRequestContext(requestContext, handlerFn) {
    const safeContext = Object.freeze({
      requestId: requestContext.requestId,
      tenantId: requestContext.tenantId,
      timestamp: Date.now(),
      isServer: this.runtime.isNode
    });

    return handlerFn(safeContext);
  }
}

const runtimeIsolator = new MultiRuntimeBoundaryIsolator();

const result = runtimeIsolator.executeWithRequestContext(
  { requestId: "req_alpha_991", tenantId: "tenant_enterprise" },
  (ctx) => {
    return `[${ctx.isServer ? 'SERVER' : 'CLIENT'}] Processed ${ctx.requestId} for ${ctx.tenantId}`;
  }
);

console.log("Boundary Isolator Result:", result);
