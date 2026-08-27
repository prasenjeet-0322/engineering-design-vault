/**
 * KPI 12 — Part 10: Promise Mastery, Performance, Anti-Patterns & Senior-Level Architecture
 * Demonstrates:
 * 1. Gotcha: The Floating Promise Rejection Hazard vs Guarded Background Operations
 * 2. Gotcha: Unbounded Concurrency Overload vs Bounded Concurrency Queue
 * 3. Prediction 1: Missing `return` In Chained Transformations
 * 4. Prediction 2: Error Swallowing Recovering to Undefined State
 * 5. Practical Architecture: Standalone Production Bounded Concurrency Pool with Metrics
 */

"use strict";

console.log("=== 1. GOTCHA: FLOATING PROMISE REJECTION LEAK ===");

function untrackedBackgroundOperation() {
  // Simulates a background operation that rejects after 10ms
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Telemetry Database Connection Timeout")), 10);
  });
}

// ❌ Bug: Floating Promise (unhandled rejection risk)
// untrackedBackgroundOperation();

// ✅ Fix: Guarded fire-and-forget with catch
void untrackedBackgroundOperation().catch((err) => {
  console.log("  🛡️ [Guarded Background Rejection Caught]:", err.message);
});

console.log("\n=== 2. ASYNC WATERFALL VS PROMISE.ALL PARALLELIZATION ===");

const mockQuery = (name, delayMs) =>
  new Promise((res) => setTimeout(() => res(`${name} Data`), delayMs));

// Parallel execution via Promise.all
const startTime = Date.now();
Promise.all([
  mockQuery("User", 30),
  mockQuery("Projects", 40),
  mockQuery("Notifications", 20)
]).then(([u, p, n]) => {
  const elapsed = Date.now() - startTime;
  console.log(`  ⚡ [Parallel Execution Finished in ${elapsed}ms] (Expected ~40ms, not 90ms):`, { u, p, n });
});

console.log("\n=== 3. PREDICTION: MISSING RETURN VS PROPER VALUE PROPAGATION ===");

// Missing return returns undefined
Promise.resolve(50)
  .then((val) => {
    val * 2; // 💥 Missing return
  })
  .then((res) => {
    console.log("  ❌ [Missing Return Value]:", res); // undefined
  });

// Proper return
Promise.resolve(50)
  .then((val) => {
    return val * 2; // 🟢 Explicit return
  })
  .then((res) => {
    console.log("  ✅ [Properly Returned Value]:", res); // 100
  });

console.log("\n=== 4. PRACTICAL ARCHITECTURE: BOUNDED CONCURRENCY WORKER POOL ===");

class BoundedWorkerPool {
  constructor(concurrencyLimit) {
    this.concurrencyLimit = concurrencyLimit;
    this.activeWorkers = 0;
    this.queue = [];
  }

  run(taskName, taskFn) {
    return new Promise((resolve, reject) => {
      const execute = () => {
        this.activeWorkers++;
        const start = Date.now();
        console.log(`  ▶️ [Task "${taskName}" STARTED] (Active Workers = ${this.activeWorkers})`);

        taskFn()
          .then((res) => {
            const duration = Date.now() - start;
            console.log(`  ✅ [Task "${taskName}" FINISHED in ${duration}ms]`);
            resolve({ taskName, res, duration });
          })
          .catch(reject)
          .finally(() => {
            this.activeWorkers--;
            if (this.queue.length > 0) {
              const next = this.queue.shift();
              next();
            }
          });
      };

      if (this.activeWorkers < this.concurrencyLimit) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

setTimeout(() => {
  console.log("\nTesting BoundedWorkerPool (Limit = 2 across 5 tasks):");
  const pool = new BoundedWorkerPool(2);

  const tasks = [
    pool.run("Upload File 1", () => new Promise((r) => setTimeout(r, 40))),
    pool.run("Upload File 2", () => new Promise((r) => setTimeout(r, 60))),
    pool.run("Upload File 3", () => new Promise((r) => setTimeout(r, 20))),
    pool.run("Upload File 4", () => new Promise((r) => setTimeout(r, 30))),
    pool.run("Upload File 5", () => new Promise((r) => setTimeout(r, 20)))
  ];

  Promise.all(tasks).then((results) => {
    console.log("\n  🎉 [All 5 Throttled Tasks Completed Successfully!]:");
    results.forEach((r) => console.log(`    - ${r.taskName}: ${r.duration}ms`));
  });
}, 70);
