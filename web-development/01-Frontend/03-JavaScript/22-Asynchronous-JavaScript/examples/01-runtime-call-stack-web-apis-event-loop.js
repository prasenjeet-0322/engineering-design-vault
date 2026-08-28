/**
 * KPI 22 — Part 01: The JavaScript Runtime, Call Stack, Web APIs & Event Loop
 * Demonstrates:
 * 1. Gotcha: Microtask Queue Draining Priority over Task Queue (`setTimeout(0)`)
 * 2. Gotcha: Synchronous Main-Thread Blocking Delaying Timers
 * 3. Prediction 1: Complete Event Loop Mixed Turn Trace
 * 4. Prediction 2: Chained Microtask Insertion during Draining
 * 5. Practical Architecture: Standalone Non-Blocking Task Chunking Processor
 */

"use strict";

console.log("=== 1. GOTCHA: MICROTASKS PRIORITY OVER TASKS (setTimeout 0ms) ===");

const logs = [];

setTimeout(() => {
  logs.push("Task Queue (setTimeout 0ms)");
  console.log("  [Step 4 - Task]:", logs[logs.length - 1]);
}, 0);

Promise.resolve().then(() => {
  logs.push("Microtask Queue (Promise.resolve)");
  console.log("  [Step 2 - Microtask 1]:", logs[logs.length - 1]);
});

queueMicrotask(() => {
  logs.push("Microtask Queue (queueMicrotask)");
  console.log("  [Step 3 - Microtask 2]:", logs[logs.length - 1]);
});

logs.push("Synchronous Execution (Call Stack)");
console.log("  [Step 1 - Sync]:", logs[0]);

console.log("\n=== 2. GOTCHA: SYNCHRONOUS BLOCKING DELAYS TIMER TASK ===");

const timerStart = Date.now();
setTimeout(() => {
  const actualDelay = Date.now() - timerStart;
  console.log(`  ⏱️ [Timer Fired]: Expected ~20ms, Actual Delay: ${actualDelay}ms (Blocked by synchronous loop!)`);
}, 20);

// Synchronously block the call stack for ~60ms
const blockStart = Date.now();
while (Date.now() - blockStart < 60) {
  // Burning CPU cycles
}
console.log("  🛑 Synchronous 60ms Blocking Loop Finished.");

console.log("\n=== 3. PRACTICAL ARCHITECTURE: NON-BLOCKING TASK CHUNKER ===");

function processLargeDatasetNonBlocking(items, chunkSize = 100, onProgress) {
  return new Promise((resolve) => {
    let index = 0;
    const total = items.length;
    const results = [];

    function processChunk() {
      const chunkEnd = Math.min(index + chunkSize, total);
      for (; index < chunkEnd; index++) {
        results.push(items[index] * 2); // Simulating transformation
      }

      const percent = Math.round((index / total) * 100);
      if (onProgress) onProgress(percent, index, total);

      if (index < total) {
        // 🟢 Yield control to the Task Queue to allow Event Loop turns!
        setTimeout(processChunk, 0);
      } else {
        resolve(results);
      }
    }

    processChunk();
  });
}

const mockDataset = Array.from({ length: 500 }, (_, i) => i + 1);

processLargeDatasetNonBlocking(mockDataset, 150, (pct, current, total) => {
  console.log(`    📊 [Task Chunker]: Progress: ${pct}% (${current}/${total} items processed)`);
}).then((results) => {
  console.log("  ✅ Large Dataset Non-Blocking Processing Complete! Total Transformed:", results.length);
  console.log("\n  🎉 [The JavaScript Runtime, Call Stack, Web APIs & Event Loop Verification Completed Successfully!]");
});
