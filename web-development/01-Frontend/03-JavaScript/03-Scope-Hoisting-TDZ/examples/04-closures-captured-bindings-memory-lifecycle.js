/**
 * KPI 03 — Part 04: Closures — Captured Bindings, Memory Lifecycle & React Closure Architecture
 * Demonstrates:
 * 1. Gotcha: Closures Capture Live Bindings (Not Value Copies)
 * 2. Prediction 1: Independent Factory Environments
 * 3. Prediction 2 & 3: Live Mutation vs Intentional Primitive Snapshot
 * 4. Prediction 6: Avoiding Closure Memory Leaks via Primitive Destructuring
 * 5. Practical Architecture: Abortable Async Event Poller with Clean Closure Lifecycles
 */

console.log("=== 1. GOTCHA: CLOSURES CAPTURE LIVE BINDINGS ===");
function createCounter() {
  let count = 0;
  return {
    increment() { count++; },
    getCount() { return count; }
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log("counter.getCount() after 2 increments:", counter.getCount()); // 2

console.log("\n=== 2. PREDICTION 1: INDEPENDENT FACTORY SCOPES ===");
function makeCounter() {
  let count = 0;
  return () => ++count;
}

const a = makeCounter();
const b = makeCounter();
console.log("a():", a()); // 1
console.log("a():", a()); // 2
console.log("b():", b()); // 1
console.log("a():", a()); // 3

console.log("\n=== 3. PREDICTIONS 2 & 3: LIVE MUTATION VS INTENTIONAL SNAPSHOT ===");
let liveVal = 10;
const liveLogger = () => liveVal;
liveVal = 20;
console.log("Live binding logger output:", liveLogger()); // 20

let sourceVal = 10;
const snapshotVal = sourceVal; // Creates frozen primitive copy
const snapshotLogger = () => snapshotVal;
sourceVal = 20;
console.log("Snapshot logger output:", snapshotLogger()); // 10

console.log("\n=== 4. PREDICTION 6: PREVENTING CLOSURE MEMORY RETENTION ===");
function createCleanHandler(userProfile) {
  // Destructure only the needed primitive ID so large data isn't retained
  const userId = userProfile.id;
  return () => `Processing user ID: ${userId}`;
}

const largeUser = {
  id: "usr_5521",
  rawBlobData: new Array(1000).fill("large_data_chunk")
};

const cleanHandler = createCleanHandler(largeUser);
console.log(cleanHandler());

console.log("\n=== 5. PRACTICAL ARCHITECTURE: ABORTABLE EVENT POLLER ===");

class AsyncMetricPoller {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.abortController = new AbortController();
  }

  startPolling(callback, intervalMs = 50) {
    let tickCount = 0;
    const signal = this.abortController.signal;

    const timerId = setInterval(() => {
      if (signal.aborted) {
        clearInterval(timerId);
        return;
      }

      tickCount++;
      callback({
        endpoint: this.endpoint,
        tick: tickCount,
        timestamp: Date.now()
      });

      if (tickCount >= 3) {
        console.log(`[Poller] Auto-stopping poll after 3 ticks.`);
        this.stop();
      }
    }, intervalMs);
  }

  stop() {
    this.abortController.abort();
    console.log(`[Poller] Poller aborted and timer cleared.`);
  }
}

const poller = new AsyncMetricPoller("https://api.enterprise.io/v1/metrics");
poller.startPolling(metric => {
  console.log(`[Metric Event] Received Tick #${metric.tick} from ${metric.endpoint}`);
});
