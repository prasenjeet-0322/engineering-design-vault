/**
 * KPI 11 — Part 04: Callback Queues, Task Scheduling & Execution Order
 * Demonstrates:
 * 1. Gotcha: Peer Timers vs Nested Timers Turn Inversion
 * 2. Gotcha: Synchronous Blocking Body inside Async Callback
 * 3. Prediction 1: Run-to-Completion Execution Order Trace
 * 4. Prediction 2: Queue Delay Accumulation during Long Synchronous Tasks
 * 5. Practical Architecture: Standalone Task Queue Simulator & Scheduler
 */

"use strict";

console.log("=== 1. GOTCHA: PEER TIMERS VS NESTED TIMERS TURN INVERSION ===");

const executionSequence = [];

executionSequence.push("1. Synchronous Start");

setTimeout(() => {
  executionSequence.push("3. Peer Timer A (0ms)");

  setTimeout(() => {
    executionSequence.push("5. Nested Timer inside A (0ms)");
  }, 0);
}, 0);

setTimeout(() => {
  executionSequence.push("4. Peer Timer B (0ms)");
}, 0);

executionSequence.push("2. Synchronous End");

setTimeout(() => {
  console.log("Recorded Execution Sequence (Expected: 1 -> 2 -> 3 -> 4 -> 5):");
  executionSequence.forEach((item) => console.log(`  ${item}`));
}, 50);

console.log("\n=== 2. QUEUE DELAY ACCUMULATION DURING MAIN THREAD BLOCK ===");

const timerQueuedTime = Date.now();
setTimeout(() => {
  const actualExecutionTime = Date.now();
  const queueDelay = actualExecutionTime - timerQueuedTime;
  console.log(`  [Timer Callback]: Ready at 0ms, Executed at ${queueDelay}ms (Queue Delay = ${queueDelay}ms)`);
}, 0);

// Simulate 40ms synchronous block
const blockStart = Date.now();
while (Date.now() - blockStart < 40) {
  // Heavy synchronous busy wait blocking the Call Stack!
}
console.log(`  [Main Thread Unblocked]: Finished busy wait after ${Date.now() - blockStart}ms`);

console.log("\n=== 3. PRACTICAL ARCHITECTURE: STANDALONE MACROTASK QUEUE SIMULATOR ===");

class TaskQueueSimulator {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(taskName, taskFn) {
    this.queue.push({ name: taskName, fn: taskFn });
    console.log(`  📥 Enqueued task: "${taskName}" (Queue Depth = ${this.queue.length})`);
    this.scheduleDrain();
  }

  scheduleDrain() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Simulate Event Loop turn via setTimeout(0)
    setTimeout(() => {
      this.drain();
    }, 0);
  }

  drain() {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      console.log(`  ⚙️ Executing Macrotask: "${task.name}"`);
      task.fn();
    }
    this.isProcessing = false;
    console.log("  🏁 All queued tasks drained.");
  }
}

setTimeout(() => {
  console.log("\nStarting Task Queue Simulator:");
  const sim = new TaskQueueSimulator();

  sim.enqueue("Task 1: Fetch Profile", () => {
    // Nested enqueue during execution
    sim.enqueue("Task 3: (Nested) Fetch Friends", () => {});
  });

  sim.enqueue("Task 2: Fetch Notifications", () => {});
}, 80);
