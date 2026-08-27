/**
 * KPI 12 — Part 05: Promise Combinators & Concurrency Coordination
 * Demonstrates:
 * 1. Gotcha: Promise.all() Fail-Fast vs Promise.allSettled() Resilient Inspection
 * 2. Gotcha: Promise.race() vs Promise.any() with AggregateError
 * 3. Prediction 1: Promise.all() Index Order Preservation
 * 4. Prediction 2: forEach(async) Race Bug vs Promise.all(map)
 * 5. Practical Architecture: Standalone Concurrency Pool / Throttler (p-limit pattern)
 */

"use strict";

console.log("=== 1. PROMISE.ALL() VS PROMISE.ALLSETTLED() ===");

const reqSuccess = Promise.resolve("Critical User Data");
const reqFail = Promise.reject(new Error("Recommendations Service Offline"));
const reqSlow = new Promise((res) => setTimeout(() => res("Notifications"), 30));

// Promise.all rejects immediately on reqFail
Promise.all([reqSuccess, reqFail, reqSlow])
  .then(() => console.log("Promise.all succeeded"))
  .catch((err) => {
    console.log("  🚨 [Promise.all Fail-Fast Caught]:", err.message);
  });

// Promise.allSettled waits for all and reports per-item status
Promise.allSettled([reqSuccess, reqFail, reqSlow]).then((results) => {
  console.log("  📦 [Promise.allSettled Complete]:");
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`    Index ${i} [FULFILLED]:`, r.value);
    } else {
      console.log(`    Index ${i} [REJECTED]:`, r.reason.message);
    }
  });
});

console.log("\n=== 2. PROMISE.RACE() VS PROMISE.ANY() ===");

const cdnFailFast = new Promise((_, rej) => setTimeout(() => rej(new Error("CDN 1 503 Error")), 10));
const cdnSuccessSlow = new Promise((res) => setTimeout(() => res("CDN 2 Image Bytes"), 25));

// Race: Fast rejection wins
Promise.race([cdnFailFast, cdnSuccessSlow])
  .then((data) => console.log("Race Won:", data))
  .catch((err) => console.log("  🏁 [Promise.race Settled First (Error)]: ", err.message));

// Any: Ignores fast rejection, waits for slow success
Promise.any([cdnFailFast, cdnSuccessSlow])
  .then((data) => console.log("  🎯 [Promise.any Fulfilled First (Success)]: ", data))
  .catch((err) => console.error("Any failed:", err));

console.log("\n=== 3. PROMISE.ALL() INPUT ORDER PRESERVATION ===");

const slowTask = new Promise((res) => setTimeout(() => res("Slow (Index 0)"), 40));
const fastTask = new Promise((res) => setTimeout(() => res("Fast (Index 1)"), 15));

Promise.all([slowTask, fastTask]).then(([res0, res1]) => {
  console.log(`  [Order Preserved]: Res[0]="${res0}", Res[1]="${res1}"`);
});

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE CONCURRENCY POOL ===");

class ConcurrencyPool {
  constructor(limit) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }

  run(taskFn) {
    return new Promise((resolve, reject) => {
      const execute = () => {
        this.running++;
        taskFn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.running--;
            if (this.queue.length > 0) {
              const next = this.queue.shift();
              next();
            }
          });
      };

      if (this.running < this.limit) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

setTimeout(() => {
  console.log("\nTesting ConcurrencyPool (Max 2 concurrent tasks):");
  const pool = new ConcurrencyPool(2);

  const createMockTask = (id, durationMs) => {
    return () =>
      new Promise((resolve) => {
        console.log(`  ▶️ [Task ${id} STARTED] (Active = ${pool.running + 1})`);
        setTimeout(() => {
          console.log(`  ✅ [Task ${id} FINISHED] after ${durationMs}ms`);
          resolve(`Result-${id}`);
        }, durationMs);
      });
  };

  const tasks = [
    pool.run(createMockTask(1, 30)),
    pool.run(createMockTask(2, 50)),
    pool.run(createMockTask(3, 20)),
    pool.run(createMockTask(4, 20))
  ];

  Promise.all(tasks).then((allResults) => {
    console.log("  🎉 [All Throttled Tasks Complete]:", allResults);
  });
}, 70);
