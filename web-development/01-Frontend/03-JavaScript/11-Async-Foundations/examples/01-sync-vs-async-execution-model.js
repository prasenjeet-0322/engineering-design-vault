/**
 * KPI 11 — Part 01: The Fundamental Model: Synchronous vs Asynchronous Execution
 * Demonstrates:
 * 1. Gotcha: setTimeout(fn, 0) Execution Order vs Call Stack
 * 2. Gotcha: Synchronous Callbacks (forEach) vs Asynchronous Callbacks (setTimeout)
 * 3. Prediction 1: Main-Thread Blocking Delaying a Timer Callback
 * 4. Prediction 2: Multiple Timers Expiration Ordering
 * 5. Practical Architecture: Standalone Non-Blocking Time-Slicer Engine
 */

"use strict";

console.log("=== 1. GOTCHA: setTimeout(fn, 0) VS SYNCHRONOUS STACK ===");

console.log("1. Synchronous Main Script Start");

setTimeout(() => {
  console.log("3. Macrotask: setTimeout(0ms) Callback Executed");
}, 0);

console.log("2. Synchronous Main Script End");

console.log("\n=== 2. SYNCHRONOUS CALLBACKS VS ASYNCHRONOUS CALLBACKS ===");

console.log("Before forEach");
[10, 20].forEach((item) => {
  console.log(`  -> Synchronous Callback for item: ${item}`);
});
console.log("After forEach");

console.log("\n=== 3. TIMER DELAY IS A MINIMUM THRESHOLD (NOT EXACT TIME) ===");

const timerStart = Date.now();
setTimeout(() => {
  const elapsed = Date.now() - timerStart;
  console.log(`[Timer Callback (Requested: 30ms)]: Executed after ${elapsed}ms`);
}, 30);

// Deliberately block the single JavaScript thread for 100ms
const busyWaitStart = Date.now();
while (Date.now() - busyWaitStart < 100) {
  // Heavy synchronous busy wait blocking the Call Stack
}
console.log(`Synchronous main thread unblocked after ${Date.now() - busyWaitStart}ms`);

console.log("\n=== 4. MULTI-TIMER EXPIRATION ORDERING ===");

setTimeout(() => console.log("  [Timer Output]: 100ms timer finished"), 100);
setTimeout(() => console.log("  [Timer Output]: 0ms timer finished"), 0);
setTimeout(() => console.log("  [Timer Output]: 50ms timer finished"), 50);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: TIME-SLICED BATCH SCHEDULER ===");

/**
 * Yields execution back to the host event loop to avoid blocking the main thread.
 */
function yieldToMain() {
  return new Promise((resolve) => {
    // In Node.js setImmediate is available; in browser MessageChannel or setTimeout(0) is used
    if (typeof setImmediate === "function") {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

async function runTimeSlicedTask(totalItems, chunkSize) {
  console.log(`Starting non-blocking processing of ${totalItems} items in chunks of ${chunkSize}...`);
  const startTime = Date.now();
  let processed = 0;

  for (let i = 0; i < totalItems; i += chunkSize) {
    // Process synchronous chunk
    const currentChunkEnd = Math.min(i + chunkSize, totalItems);
    for (let j = i; j < currentChunkEnd; j++) {
      processed++;
      Math.sqrt(j);
    }

    const percent = Math.round((processed / totalItems) * 100);
    console.log(`  [TimeSlice Progress]: ${percent}% (${processed}/${totalItems} items)`);

    // Yield control so other tasks and I/O can execute!
    await yieldToMain();
  }

  const duration = Date.now() - startTime;
  console.log(`✅ Completed all ${processed} items in ${duration}ms without locking the thread!`);
}

// Run time-sliced task after timers initialize
setTimeout(() => {
  runTimeSlicedTask(50000, 15000);
}, 150);
