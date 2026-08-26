/**
 * KPI 04 — Part 07: Execution Context Internals & Lexical Environment Deep Dive
 * Demonstrates:
 * 1. Gotcha: Closure Retaining Live Mutable Binding Slot vs Frozen Value Snapshot
 * 2. Prediction 1: Lexical Scope Shadowing Order
 * 3. Prediction 2: Lexical Scope vs Caller Scope Disconnect
 * 4. Prediction 3: Asynchronous Stale Closure Simulation
 * 5. Prediction 4: Escaping Closure Retaining Heap Context
 * 6. Practical Architecture: Closure-Based Dependency Injection & Scoped Service Factory
 */

console.log("=== 1. GOTCHA: CLOSURES RETAIN LIVE MUTABLE BINDINGS ===");
function createCounterFactory() {
  let count = 0; // Mutable Lexical Binding in Function Environment Record
  return {
    increment: () => { count += 1; return count; },
    decrement: () => { count -= 1; return count; },
    get: () => count
  };
}

const counter = createCounterFactory();
console.log("counter.increment():", counter.increment()); // 1
console.log("counter.increment():", counter.increment()); // 2
console.log("counter.decrement():", counter.decrement()); // 1
console.log("counter.get():", counter.get());             // 1

console.log("\n=== 2. PREDICTION 1: LEXICAL SHADOWING ORDER ===");
const globalScopeVal = "global";
function outerScope() {
  const outerVal = "outer";
  function innerScope() {
    console.log("Inner resolved:", outerVal); // "outer"
  }
  innerScope();
}
outerScope();

console.log("\n=== 3. PREDICTION 2: LEXICAL SCOPE VS CALLER SCOPE ===");
const envTarget = "global_target";
function definedInGlobal() {
  return envTarget;
}
function callerFunction() {
  const envTarget = "caller_target";
  // Calling definedInGlobal resolves to where it was defined (Global), not who called it (Caller)
  return definedInGlobal();
}
console.log("callerFunction() output:", callerFunction()); // "global_target"

console.log("\n=== 4. PREDICTION 3: ASYNC STALE CLOSURE SIMULATION ===");
function simulateRenderClosure(renderId, initialCount) {
  const count = initialCount;
  // Simulating an event handler captured in this render pass
  const handleClick = () => {
    return `[Render #${renderId}] Captured count: ${count}`;
  };
  return handleClick;
}

const render1Handler = simulateRenderClosure(1, 0);
const render2Handler = simulateRenderClosure(2, 1);

console.log("Invoking Render 1 Handler:", render1Handler()); // Captured count: 0
console.log("Invoking Render 2 Handler:", render2Handler()); // Captured count: 1

console.log("\n=== 5. PRACTICAL ARCHITECTURE: CLOSURE-BASED DEPENDENCY INJECTION ===");

function createPaymentProcessor(config, logger) {
  // Enclosing Lexical Environment acts as private, immutable dependency container
  const apiEndpoint = `${config.baseUrl}/v1/charges`;

  return {
    processCharge: async (amount, currency = "USD") => {
      logger.info(`Initiating charge of ${amount} ${currency} to ${apiEndpoint}`);
      
      const payload = {
        amount,
        currency,
        merchantId: config.merchantId,
        timestamp: Date.now()
      };

      // Mock network roundtrip
      const transactionId = `txn_${Math.random().toString(36).slice(2, 9)}`;
      logger.info(`Charge successful. Txn ID: ${transactionId}`);

      return { success: true, transactionId, payload };
    }
  };
}

// Composition Root
const mockLogger = {
  info: (msg) => console.log(`[LOGGER INFO] ${msg}`)
};
const processor = createPaymentProcessor(
  { baseUrl: "https://secure.payments.com", merchantId: "merch_9918" },
  mockLogger
);

processor.processCharge(149.99, "USD").then(res => {
  console.log("Payment Processing Completed:", res.transactionId);
});
