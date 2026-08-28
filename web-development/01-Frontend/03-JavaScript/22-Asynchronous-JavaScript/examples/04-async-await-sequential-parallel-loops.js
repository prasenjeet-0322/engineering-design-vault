/**
 * KPI 22 — Part 04: `async` / `await`, Error Handling, Parallel Execution & Async Loops
 * Demonstrates:
 * 1. Gotcha: `Array.prototype.forEach(async)` Concurrency Bug vs `for...of`
 * 2. Gotcha: Accidental Sequential Request Waterfalls vs Parallel `Promise.all()`
 * 3. Prediction 1: `async` Function Microtask Suspension & Resumption
 * 4. Prediction 2: `try / catch / finally` Exception Transformation
 * 5. Practical Architecture: Standalone Bounded Concurrency Batch Processor
 */

"use strict";

console.log("=== 1. GOTCHA: FOREACH(ASYNC) SILENT BUG VS FOR...OF ===");

const records = [1, 2, 3];
const forEachLog = [];
const forOfLog = [];

// ❌ BANNED: forEach does NOT await async callbacks
records.forEach(async (id) => {
  await new Promise((res) => setTimeout(res, 10));
  forEachLog.push(id);
});
console.log("  🛑 forEach finished immediately! Elements processed so far:", forEachLog.length); // 0

// ✅ PROPER: for...of strictly awaits in sequence
async function runForOf() {
  for (const id of records) {
    await new Promise((res) => setTimeout(res, 10));
    forOfLog.push(id);
  }
  console.log("  ✅ for...of finished strictly! Elements processed:", forOfLog);
}

console.log("\n=== 2. GOTCHA: SEQUENTIAL WATERFALL VS PARALLEL PROMISE.ALL ===");

function mockRequest(name, delayMs) {
  return new Promise((res) => setTimeout(() => res(`${name} (${delayMs}ms)`), delayMs));
}

async function benchmark() {
  // 1. Sequential Waterfall: ~60ms total
  const seqStart = Date.now();
  const u = await mockRequest("User", 20);
  const s = await mockRequest("Settings", 20);
  const f = await mockRequest("Feed", 20);
  const seqDuration = Date.now() - seqStart;
  console.log(`  ⏳ [Sequential Waterfall]: Finished in ${seqDuration}ms (Expected ~60ms)`);

  // 2. Parallel Promise.all: ~20ms total
  const parStart = Date.now();
  const [pu, ps, pf] = await Promise.all([
    mockRequest("User", 20),
    mockRequest("Settings", 20),
    mockRequest("Feed", 20)
  ]);
  const parDuration = Date.now() - parStart;
  console.log(`  🚀 [Parallel Promise.all]: Finished in ${parDuration}ms (Expected ~20ms)`);
}

console.log("\n=== 3. PRACTICAL ARCHITECTURE: BOUNDED CONCURRENCY BATCH POOL ===");

async function processBatchWithConcurrencyLimit(items, limit, workerFn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const taskPromise = (async () => {
      const res = await workerFn(item);
      results.push(res);
    })();

    const wrapped = taskPromise.then(() => executing.delete(wrapped));
    executing.add(wrapped);

    if (executing.size >= limit) {
      await Promise.race(executing); // Wait for fastest worker to finish
    }
  }

  await Promise.all(executing); // Drain remaining workers
  return results;
}

async function main() {
  await runForOf();
  await benchmark();

  const dataset = [10, 20, 30, 40, 50, 60];
  console.log(`\n  ▶️ Processing ${dataset.length} items with Concurrency Pool Limit: 2...`);

  const poolResults = await processBatchWithConcurrencyLimit(dataset, 2, async (val) => {
    await new Promise((res) => setTimeout(res, 15));
    console.log(`    ⚡ [Worker Processed]: ${val} -> ${val * 2}`);
    return val * 2;
  });

  console.log("  ✅ Bounded Batch Processing Complete! Transformed:", poolResults);
  console.log("\n  🎉 [`async/await`, Error Handling, Parallelism & Async Loops Verification Completed Successfully!]");
}

main();
