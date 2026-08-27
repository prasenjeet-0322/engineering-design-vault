/**
 * KPI 13 — Part 03: Sequential vs Concurrent Execution, Loops & The Async Waterfall Problem
 * Demonstrates:
 * 1. Gotcha: The `forEach(async)` Trap vs `for...of` vs `Promise.all(map)`
 * 2. Gotcha: Sequential Waterfall vs Parallel Fan-Out Benchmark
 * 3. Prediction 1: Array Order Preservation in Promise.all Despite Out-of-Order Completion
 * 4. Prediction 2: Shared Mutable State Race Condition Across `await` Suspension Points
 * 5. Practical Architecture: Standalone Bounded Concurrency Queue (`mapConcurrent`)
 */

"use strict";

console.log("=== 1. GOTCHA: FOREACH(ASYNC) TRAP VS PROPER AWAIT ===");

const items = [1, 2, 3];

// ❌ Bug: forEach does not await async callbacks!
console.log("  1. Starting forEach test...");
items.forEach(async (id) => {
  await new Promise((r) => setTimeout(r, 20));
  console.log(`    ❌ [forEach Callback Finished]: Item ${id}`);
});
console.log("  2. Main code after forEach finished immediately!");

// ✅ Fix: Sequential with for...of
async function testSequentialForOf() {
  console.log("\n  ▶️ [Sequential for...of Started]:");
  for (const id of [10, 20]) {
    await new Promise((r) => setTimeout(r, 15));
    console.log(`    🟢 [for...of]: Item ${id}`);
  }
  console.log("  ✅ [for...of Fully Finished]");
}

// ✅ Fix: Parallel with Promise.all(map)
async function testParallelMap() {
  console.log("\n  ▶️ [Parallel Promise.all(map) Started]:");
  const results = await Promise.all(
    [100, 200].map(async (id) => {
      await new Promise((r) => setTimeout(r, 15));
      return `Item-${id}`;
    })
  );
  console.log("  ✅ [Parallel Map Completed]:", results);
}

setTimeout(async () => {
  await testSequentialForOf();
  await testParallelMap();

  console.log("\n=== 2. PREDICTION: ARRAY ORDER PRESERVATION IN PROMISE.ALL ===");

  const delays = [40, 10, 25]; // Item 1 finishes first (10ms), Item 0 finishes last (40ms)
  const results = await Promise.all(
    delays.map(
      (ms, idx) =>
        new Promise((res) =>
          setTimeout(() => {
            console.log(`  ⏱️ [Resolved Task ${idx}] (${ms}ms)`);
            res(`Result-${idx}`);
          }, ms)
        )
    )
  );
  console.log("  📦 [Final Output Array (Index Order Preserved)]:", results);

  console.log("\n=== 3. PRACTICAL ARCHITECTURE: BOUNDED CONCURRENCY POOL ===");

  async function mapConcurrent(items, limit, workerFn) {
    const results = new Array(items.length);
    let currentIndex = 0;

    async function worker(workerId) {
      while (currentIndex < items.length) {
        // 🟢 Critical: Claim index synchronously before await!
        const idx = currentIndex++;
        const start = Date.now();
        console.log(`    ▶️ [Worker ${workerId}] processing Item ${items[idx]} (Index ${idx})`);
        results[idx] = await workerFn(items[idx], idx);
        console.log(`    ✅ [Worker ${workerId}] finished Item ${items[idx]} in ${Date.now() - start}ms`);
      }
    }

    const workerCount = Math.min(limit, items.length);
    const workers = Array.from({ length: workerCount }, (_, i) => worker(i + 1));
    await Promise.all(workers);
    return results;
  }

  console.log("Running Bounded Concurrency (6 items with Limit = 2):");
  const batchData = [1, 2, 3, 4, 5, 6];
  const outcomes = await mapConcurrent(batchData, 2, async (val) => {
    await new Promise((r) => setTimeout(r, 30));
    return `Processed-${val}`;
  });

  console.log("\n  🎉 [Bounded Pool Batch Fully Finished]:", outcomes);
}, 30);
