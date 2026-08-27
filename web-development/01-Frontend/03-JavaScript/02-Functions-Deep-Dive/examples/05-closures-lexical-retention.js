/**
 * KPI 02 — Part 5: Closures & Lexical Environment Retention
 * Demonstrates:
 * 1. Gotcha: Shared Lexical Environment in Multi-Method Closures
 * 2. Prediction 1: Live Binding Mutation vs Value Snapshot
 * 3. Prediction 4: Independent Factory Instances
 * 4. Prediction 5: Loop Closures (let vs var)
 * 5. Prediction 6: React State Queue Update Simulation
 * 6. Practical Architecture: useLatest Bridge & Polling Overlap Guard
 */

console.log("=== 1. GOTCHA: SHARED LEXICAL ENVIRONMENT IN CLOSURES ===");
function createCounter() {
  let count = 0; // Heap Context variable
  return {
    increment() { count++; },
    decrement() { count--; },
    getCount() { return count; }
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log("Shared binding count value:", counter.getCount()); // 2

console.log("\n=== 2. PREDICTION 1: LIVE BINDING MUTATION ===");
function createReader() {
  let value = "A";
  const read = () => value;
  value = "B"; // Reassigned before returning function!
  return read;
}
const reader = createReader();
console.log("reader() reads live binding:", reader()); // "B"

console.log("\n=== 3. PREDICTION 4: INDEPENDENT FACTORY SCOPES ===");
const counterA = createCounter();
const counterB = createCounter();
counterA.increment();
counterA.increment();
counterB.increment();

console.log("counterA count:", counterA.getCount()); // 2
console.log("counterB count:", counterB.getCount()); // 1

console.log("\n=== 4. PREDICTION 5: LOOP CLOSURES (LET VS VAR) ===");
const letHandlers = [];
for (let i = 0; i < 3; i++) {
  letHandlers.push(() => i);
}
console.log("let handlers (per-iteration scope):", letHandlers.map(fn => fn())); // [0, 1, 2]

const varHandlers = [];
for (var j = 0; j < 3; j++) {
  varHandlers.push(() => j);
}
console.log("var handlers (shared single binding):", varHandlers.map(fn => fn())); // [3, 3, 3]

console.log("\n=== 5. PREDICTION 6: REACT STATE QUEUE SIMULATION ===");

class StateManagerSimulation {
  constructor(initial) {
    this.state = initial;
    this.updateQueue = [];
  }

  // Queues a state update
  queueUpdate(updaterOrValue) {
    this.updateQueue.push(updaterOrValue);
  }

  // Processes batch
  flush() {
    this.updateQueue.forEach(update => {
      if (typeof update === "function") {
        this.state = update(this.state);
      } else {
        this.state = update;
      }
    });
    this.updateQueue = [];
    return this.state;
  }
}

const manager = new StateManagerSimulation(0);
const currentSnapshot = manager.state; // count = 0

// Simulating: setCount(count + 1); setCount(count + 1); setCount(prev => prev + 1);
manager.queueUpdate(currentSnapshot + 1);      // Queues 1
manager.queueUpdate(currentSnapshot + 1);      // Queues 1
manager.queueUpdate((prev) => prev + 1);       // Functional updater

console.log("Final computed state after batch flush:", manager.flush()); // 2 ✅

console.log("\n=== 6. PRACTICAL ARCHITECTURE: USELATEST POLLING SIMULATION ===");

class PollerSimulation {
  constructor(callback, intervalMs) {
    this.latestCallback = callback; // useLatest ref bridge
    this.intervalMs = intervalMs;
    this.isExecuting = false;
    this.timer = null;
  }

  updateCallback(newCallback) {
    this.latestCallback = newCallback; // Mutates ref without restarting timer!
  }

  async tick() {
    if (this.isExecuting) {
      console.log("⚠️ Previous poll still executing. Skipping overlap!");
      return;
    }
    this.isExecuting = true;
    try {
      await this.latestCallback();
    } finally {
      this.isExecuting = false;
    }
  }
}

async function runPollerDemo() {
  let query = "React";
  const poller = new PollerSimulation(async () => {
    console.log(`[Poller executed] Query: ${query}`);
  }, 50);

  await poller.tick(); // Polls "React"

  query = "Next.js"; // User types in input
  poller.updateCallback(async () => {
    console.log(`[Poller executed with useLatest] Query: ${query}`);
  });

  await poller.tick(); // Polls "Next.js" directly without stale closure!
}

runPollerDemo();
