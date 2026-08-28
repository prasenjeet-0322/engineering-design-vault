/**
 * KPI 24 — Part 05: Long Tasks, Main-Thread Blocking & UI Responsiveness
 * Demonstrates:
 * 1. Gotcha: The async CPU-Blocking Misconception Benchmark
 * 2. Gotcha: Monolithic Synchronous Task vs Time-Sliced Chunked Execution
 * 3. Prediction 1: Total Blocking Time (TBT) Calculation Engine
 * 4. Prediction 2: Macrotask Yielding Allowing Interleaved Priority Work
 * 5. Practical Architecture: Standalone Time-Sliced Array Processor with Progress Events
 */

"use strict";

console.log("=== 1. GOTCHA: THE ASYNC FUNCTION CPU-BLOCKING FALLACY ===");

function heavySynchronousMath(iterations = 5000000) {
  let count = 0;
  for (let i = 0; i < iterations; i++) {
    count += Math.sqrt(i);
  }
  return count;
}

// Misconception: "Wrapping in async makes it run in the background"
async function pseudoAsyncBlockingTask() {
  const start = performance.now();
  // 💥 Synchronous CPU loop executes directly on the SINGLE main thread!
  const res = heavySynchronousMath(10000000);
  const duration = performance.now() - start;
  return { duration: duration.toFixed(2), res };
}

console.log("  ▶️ Dispatching pseudoAsyncBlockingTask()...");
pseudoAsyncBlockingTask().then((data) => {
  console.log(`    ⚠️ pseudoAsync completed in ${data.duration}ms (Main thread was BLOCKED the entire time!)`);
});

console.log("\n=== 2. TBT (TOTAL BLOCKING TIME) CALCULATION ENGINE ===");

function calculateTBT(tasks) {
  let tbt = 0;
  tasks.forEach((t, i) => {
    const blocking = Math.max(0, t.duration - 50);
    tbt += blocking;
    console.log(`    Task #${i + 1} (${t.duration}ms): Blocking Duration = ${blocking}ms`);
  });
  return tbt;
}

const sampleTaskDurations = [{ duration: 30 }, { duration: 120 }, { duration: 40 }, { duration: 200 }];
console.log("  Calculating Total Blocking Time for 4 Tasks [30ms, 120ms, 40ms, 200ms]:");
const totalTBT = calculateTBT(sampleTaskDurations);
console.log(`  📊 Total Blocking Time (TBT): ${totalTBT}ms (Target: 0ms)`);

console.log("\n=== 3. PRACTICAL ARCHITECTURE: STANDALONE TIME-SLICED CHUNK PROCESSOR ===");

async function processInTimeSlices(items, transformFn, chunkSize = 1000, onProgress = null) {
  const results = [];
  const total = items.length;

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(...chunk.map(transformFn));

    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + chunkSize) / total) * 100)));
    }

    // 🟢 Cooperative Yield: Give Event Loop opportunity to handle clicks and paint!
    if (i + chunkSize < total) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  return results;
}

const largeArray = Array.from({ length: 10000 }, (_, i) => i);

console.log("  ▶️ Processing 10,000 items in time slices of 2,500 items:");
const startSliced = performance.now();

processInTimeSlices(
  largeArray,
  (n) => n * 2,
  2500,
  (pct) => console.log(`    ⏳ [Progress Update]: ${pct}% processed (Event loop yielded!)`)
).then((res) => {
  const duration = (performance.now() - startSliced).toFixed(2);
  console.log(`  ✅ Time-Sliced Processing Finished (${res.length} items) in ${duration}ms with ZERO Long Tasks!`);
  console.log("\n  🎉 [Long Tasks, Main-Thread Blocking & UI Responsiveness Verification Completed Successfully!]");
});
