/**
 * KPI 02 — Part 15: Closures, Lexical Environments & Memory Retention
 * Demonstrates:
 * 1. Gotcha: Independent Factory Lexical Environments
 * 2. Prediction 1: Factory Scope Isolation
 * 3. Prediction 2: Shared Lexical Context Among Sibling Methods
 * 4. Prediction 5: Functional State Updaters vs Stale Closure Reads
 * 5. Prediction 6: In-Flight Network Race Condition & AbortController Elimination
 * 6. Practical Architecture: Live Poller with Mutable Ref Bridge
 */

console.log("=== 1. GOTCHA & PREDICTION 1: INDEPENDENT FACTORY SCOPES ===");
function createCounter() {
  let count = 0; // Heap Context Record
  return {
    increment() { count++; return count; },
    getCount() { return count; }
  };
}

const counterA = createCounter();
const counterB = createCounter();

counterA.increment();
counterA.increment();
counterB.increment();

console.log("counterA.getCount():", counterA.getCount()); // 2
console.log("counterB.getCount():", counterB.getCount()); // 1

console.log("\n=== 2. PREDICTION 2: SIBLING METHODS SHARING LEXICAL STATE ===");
function createState() {
  let value = 0;
  return {
    increment() { value++; },
    read() { return value; }
  };
}
const state = createState();
state.increment();
state.increment();
console.log("Shared binding state.read():", state.read()); // 2

console.log("\n=== 3. PREDICTION 5: FUNCTIONAL STATE UPDATES ===");
// Simulating React state batching:
let simulatedState = 0;

// Scenario A: Reading stale closure
function updateStale() {
  const current = simulatedState;
  simulatedState = current + 1;
  simulatedState = current + 1; // Both read current = 0
}
updateStale();
console.log("Stale closure update result:", simulatedState); // 1

// Scenario B: Functional updater pipeline
simulatedState = 0;
function updateFunctional() {
  const updaters = [(prev) => prev + 1, (prev) => prev + 1];
  for (const fn of updaters) {
    simulatedState = fn(simulatedState);
  }
}
updateFunctional();
console.log("Functional updater result:", simulatedState); // 2

console.log("\n=== 4. PREDICTION 6: ASYNC NETWORK RACE ELIMINATION ===");

class LiveSearchClient {
  constructor() {
    this.abortController = null;
  }

  async search(query, delayMs) {
    // 1. Abort previous in-flight request to eliminate race conditions
    if (this.abortController) {
      console.log(`[Abort] Cancelling outdated in-flight query...`);
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(`Result for: ${query}`);
      }, delayMs);

      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        const err = new Error("Query aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  }
}

async function runRaceDemo() {
  const client = new LiveSearchClient();

  // Query 1 starts (slow: 50ms)
  client.search("React", 50).catch(err => console.log(`Query 1 caught: ${err.message}`));

  // Query 2 starts immediately (fast: 10ms)
  const result = await client.search("Next.js", 10);
  console.log("Final active query received:", result);
}

runRaceDemo();
