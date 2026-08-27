/**
 * KPI 03 — Part 09: Closures, Lexical Environments & Memory Retention
 * Demonstrates:
 * 1. Gotcha: Live Variable Mutation vs Static Value Copying
 * 2. Prediction 1: Independent Factory Environments
 * 3. Prediction 3: Shared Lexical Environment Across Multiple Methods
 * 4. Prediction 4: Asynchronous Loop Closures (var vs let)
 * 5. Practical Architecture: Enterprise Event Aggregator with Functional Updaters & Ref Tunnels
 */

console.log("=== 1. GOTCHA: LIVE MUTATION VS STATIC COPYING ===");
function createCounter() {
  let count = 0;
  return function increment() {
    count++;
    return count;
  };
}
const counter = createCounter();
console.log("counter() call #1:", counter()); // 1
console.log("counter() call #2:", counter()); // 2
console.log("counter() call #3:", counter()); // 3

console.log("\n=== 2. PREDICTION 1: INDEPENDENT FACTORY CLOSURES ===");
const counterA = createCounter();
const counterB = createCounter();
console.log("counterA:", counterA(), counterA()); // 1, 2
console.log("counterB:", counterB());            // 1
console.log("counterA:", counterA());            // 3

console.log("\n=== 3. PREDICTION 3: SHARED MULTI-METHOD CLOSURE STATE ===");
function createStore() {
  let value = 0;
  return {
    increment() { value++; },
    getValue() { return value; }
  };
}
const store = createStore();
store.increment();
store.increment();
console.log("store.getValue():", store.getValue()); // 2

console.log("\n=== 4. PREDICTION 4: ASYNC LOOP CLOSURES (VAR VS LET) ===");
// Simulating var loop:
const varResults = [];
for (var i = 0; i < 3; i++) {
  varResults.push(() => i);
}
console.log("var loop closures output:", varResults.map(fn => fn())); // [3, 3, 3]

// Simulating let loop:
const letResults = [];
for (let j = 0; j < 3; j++) {
  letResults.push(() => j);
}
console.log("let loop closures output:", letResults.map(fn => fn())); // [0, 1, 2]

console.log("\n=== 5. PRACTICAL ARCHITECTURE: EVENT AGGREGATOR WITH REF TUNNEL ===");

class ManagedEventAggregator {
  constructor() {
    this.buffer = [];
    this.isPaused = false;
  }

  // Ref tunnel pattern simulation
  setPaused(paused) {
    this.isPaused = paused;
    console.log(`[Aggregator] Stream status changed -> Paused: ${this.isPaused}`);
  }

  startStream(onFlush) {
    const timer = setInterval(() => {
      // Direct live check of latest state (Ref tunnel)
      if (this.isPaused) {
        console.log("[Aggregator] Ingestion paused. Skipping tick.");
        return;
      }

      const event = { id: `evt_${Date.now()}`, type: "METRIC_TICK" };
      this.buffer.push(event);

      // Functional updater simulation
      onFlush(this.buffer.slice(-3));
    }, 40);

    return () => clearInterval(timer);
  }
}

const aggregator = new ManagedEventAggregator();
const unsubscribe = aggregator.startStream(latestBatch => {
  console.log(`[Batch Received] Count: ${latestBatch.length} | Latest ID: ${latestBatch[latestBatch.length - 1].id}`);
});

// Simulate pause after 90ms
setTimeout(() => aggregator.setPaused(true), 90);
// Simulate cleanup after 150ms
setTimeout(() => {
  unsubscribe();
  console.log("[Aggregator] Stream cleanly unsubscribed. Zero memory leaks.");
}, 150);
