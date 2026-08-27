/**
 * KPI 02 — Part 4: Higher-Order Functions & Callbacks
 * Demonstrates:
 * 1. Gotcha: Passing Function Reference vs Passing Invocation Result
 * 2. Prediction 1 & 4: Synchronous Callback Flow
 * 3. Prediction 5: Function Wrapper / Decorator Execution
 * 4. Prediction 6: Event Listener Removal Reference Identity Simulation
 * 5. Practical Architecture: Async Higher-Order Function with Exponential Backoff
 */

console.log("=== 1. GOTCHA: FUNCTION REFERENCE VS INVOCATION RESULT ===");
function execute(callback) {
  if (typeof callback !== "function") {
    console.log(`[Error caught] Expected function, received: ${typeof callback} (${callback})`);
    return;
  }
  callback();
}

function greet() {
  console.log("Hello from greet!");
  return "GREET_RETURN_VALUE";
}

console.log("Test A: execute(greet) -> Passes function pointer:");
execute(greet); // Executes correctly!

console.log("\nTest B: execute(greet()) -> Passes evaluated return string:");
execute(greet()); // Passes "GREET_RETURN_VALUE" -> Fails safely!

console.log("\n=== 2. SYNCHRONOUS CALLBACK FLOW ===");
function processPipeline(cb) {
  console.log("1. Pipeline Start");
  cb();
  console.log("3. Pipeline End");
}
processPipeline(() => console.log("2. Inside Synchronous Callback"));

console.log("\n=== 3. FUNCTION WRAPPER / DECORATOR ===");
function withTiming(fn, label) {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`[Telemetry] '${label}' executed in ${(end - start).toFixed(4)}ms`);
    return result;
  };
}

const add = (a, b) => a + b;
const timedAdd = withTiming(add, "Add Calculation");
console.log("Result:", timedAdd(10, 20));

console.log("\n=== 4. EVENT LISTENER REMOVAL REFERENCE IDENTITY ===");
class MockEventDispatcher {
  constructor() {
    this.listeners = [];
  }
  addEventListener(handler) {
    this.listeners.push(handler);
  }
  removeEventListener(handler) {
    this.listeners = this.listeners.filter(h => h !== handler);
  }
  trigger() {
    console.log(`Firing event to ${this.listeners.length} listener(s)...`);
    this.listeners.forEach(fn => fn());
  }
}

const dispatcher = new MockEventDispatcher();

// Attempt A: Passing anonymous arrow functions (MISMATCH)
dispatcher.addEventListener(() => console.log("Listener A Fired"));
dispatcher.removeEventListener(() => console.log("Listener A Fired")); // Different pointer!
console.log("After anonymous removal attempt:");
dispatcher.trigger(); // Still fires!

// Attempt B: Passing identical stored reference (MATCH)
const stableHandler = () => console.log("Stable Listener B Fired");
dispatcher.addEventListener(stableHandler);
dispatcher.removeEventListener(stableHandler);
console.log("After stable reference removal:");
dispatcher.trigger(); // Cleaned up!

console.log("\n=== 5. PRACTICAL ARCHITECTURE: ASYNC RETRY HOF ===");

function withRetry(fn, maxRetries = 2, delayMs = 50) {
  return async (...args) => {
    let attempt = 0;
    while (true) {
      try {
        return await fn(...args);
      } catch (err) {
        attempt++;
        if (attempt > maxRetries) {
          throw new Error(`Exhausted ${maxRetries} retries: ${err.message}`);
        }
        console.log(`[Retry HOF] Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  };
}

// Simulating an unreliable async operation
let failureCounter = 0;
const unreliableFetch = async (id) => {
  failureCounter++;
  if (failureCounter < 2) {
    throw new Error("Network timeout");
  }
  return { id, name: "Sunny", status: "SUCCESS" };
};

const robustFetch = withRetry(unreliableFetch, 3, 20);

robustFetch("user-42").then(data => {
  console.log("Fetched with retry successfully:", data);
});
