/**
 * KPI 12 — Part 06: Promise Timing, Microtasks, the Event Loop & Execution Order
 * Demonstrates:
 * 1. Gotcha: Microtask Queue Exhaustion Before Next Macrotask (setTimeout 0ms)
 * 2. Gotcha: Async Function Synchronous Beginning vs Deferred Await Continuation
 * 3. Prediction 1: Complex Mixed Tasks & Microtasks Interleaving
 * 4. Prediction 2: queueMicrotask vs Promise.then FIFO Order
 * 5. Practical Architecture: Standalone Microtask State Batcher
 */

"use strict";

console.log("=== 1. MICROTASKS EXHAUSTION BEFORE MACROTASK ===");

console.log("1. Synchronous Main Start");

setTimeout(() => {
  console.log("5. Macrotask (setTimeout 0ms)");
}, 0);

Promise.resolve().then(() => {
  console.log("3. Microtask 1");
  Promise.resolve().then(() => {
    console.log("4. Nested Microtask 2 (Runs before setTimeout!)");
  });
});

console.log("2. Synchronous Main End");

console.log("\n=== 2. ASYNC FUNCTION SYNCHRONOUS BOUNDARY ===");

async function asyncExecutionTrace() {
  console.log("  [Inside Async]: Synchronous execution before await");
  await null; // Creates microtask boundary
  console.log("  [Inside Async]: Deferred execution AFTER await");
}

console.log("  [Caller]: Invoking async function");
asyncExecutionTrace();
console.log("  [Caller]: Immediately after async function call");

console.log("\n=== 3. QUEUEMICROTASK VS PROMISE.THEN FIFO ORDER ===");

queueMicrotask(() => console.log("  [FIFO 1]: queueMicrotask callback"));
Promise.resolve().then(() => console.log("  [FIFO 2]: Promise.then callback"));
queueMicrotask(() => console.log("  [FIFO 3]: queueMicrotask callback"));

console.log("\n=== 4. PRACTICAL ARCHITECTURE: MICROTASK STATE BATCHER ===");

class MicrotaskStateBatcher {
  constructor(flushCallback) {
    this.updates = [];
    this.isScheduled = false;
    this.flushCallback = flushCallback;
  }

  mutate(item) {
    this.updates.push(item);
    console.log(`  📥 [Mutation Enqueued]: "${item}" (Total pending = ${this.updates.length})`);

    if (!this.isScheduled) {
      this.isScheduled = true;
      // Schedule single combined flush on Microtask Queue
      queueMicrotask(() => {
        const batchToFlush = [...this.updates];
        this.updates = [];
        this.isScheduled = false;
        console.log("  ⚙️ [Microtask Checkpoint]: Flushing batch to UI renderer!");
        this.flushCallback(batchToFlush);
      });
    }
  }
}

setTimeout(() => {
  console.log("\nTesting MicrotaskStateBatcher:");
  const batcher = new MicrotaskStateBatcher((batch) => {
    console.log(`  🎉 [Flushed 1 Single Render for ${batch.length} Mutations]:`, batch);
  });

  // 4 Synchronous mutations dispatched in tight succession
  batcher.mutate("User: Change Theme to Dark");
  batcher.mutate("User: Enable Notifications");
  batcher.mutate("User: Set Volume to 80%");
  batcher.mutate("User: Update Avatar");
}, 50);
