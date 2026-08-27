/**
 * KPI 10 — Part 07: Advanced Debugging Scenarios & Stale State
 * Demonstrates:
 * 1. Gotcha: Stale Closures in Async Callbacks vs Mutable Ref Pointer Fix
 * 2. Gotcha: Uncleared Interval Retainer Graph vs Explicit Teardown Cleanup
 * 3. Prediction 1: Microtask vs Macrotask Event Loop Timing Order
 * 4. Prediction 2: Concurrency Race Conditions & Sequence ID Protection
 * 5. Practical Architecture: Enterprise Concurrency & State Isolation Engine
 */

"use strict";

console.log("=== 1. GOTCHA: STALE CLOSURE VS MUTABLE REF POINTER ===");

// Simulation of Stale Closure Trap
function simulateStaleClosure(callback) {
  setTimeout(() => {
    callback();
  }, 50);
}

let activeUserId = "User-A";

// A. Broken Stale Closure: Captures primitive variable at definition time
const capturedId = activeUserId;
simulateStaleClosure(() => {
  console.log("❌ Stale Callback executed with:", capturedId); // "User-A"
});

// Mutate state immediately
activeUserId = "User-B";

// B. Fixed Live Pointer: Points to mutable container object
const livePointer = { current: activeUserId };
activeUserId = "User-B";
livePointer.current = activeUserId;

simulateStaleClosure(() => {
  console.log("✅ Fixed Live Pointer Callback executed with:", livePointer.current); // "User-B"
});

console.log("\n=== 2. PREDICTION 1: EVENT LOOP TIMING (MICROTASKS VS MACROTASKS) ===");

const executionLog = [];

executionLog.push("1. Synchronous Main Script Start");

setTimeout(() => {
  executionLog.push("4. Macrotask (setTimeout 0ms)");
  console.log("Event Loop Execution Sequence Result:");
  executionLog.forEach((entry) => console.log(`  -> ${entry}`));
}, 0);

Promise.resolve().then(() => {
  executionLog.push("3. Microtask (Promise.then)");
});

executionLog.push("2. Synchronous Main Script End");

console.log("\n=== 3. PREDICTION 2: CONCURRENCY RACE CONDITION & SEQUENCE IDS ===");

class SafeAsyncCoordinator {
  constructor() {
    this.latestSequenceId = 0;
    this.appliedResults = [];
  }

  async executeQuery(query, delayMs) {
    const seqId = ++this.latestSequenceId;

    return new Promise((resolve) => {
      setTimeout(() => {
        if (seqId === this.latestSequenceId) {
          this.appliedResults.push({ query, seqId, status: "APPLIED" });
          console.log(`  [APPLIED Fresh]: "${query}" (Seq #${seqId})`);
        } else {
          this.appliedResults.push({ query, seqId, status: "DISCARDED" });
          console.log(`  [DISCARDED Stale]: "${query}" (Seq #${seqId}, Latest is #${this.latestSequenceId})`);
        }
        resolve();
      }, delayMs);
    });
  }
}

const coordinator = new SafeAsyncCoordinator();

// Request 1: "re" (slow, takes 80ms)
// Request 2: "react" (fast, takes 20ms)
coordinator.executeQuery("re", 80);
setTimeout(() => coordinator.executeQuery("react", 20), 10);

console.log("\n=== 4. PRACTICAL ARCHITECTURE: MEMORY LEAK CLEANUP HARNESS ===");

class LongLivedWorker {
  constructor(name) {
    this.name = name;
    this.buffer = new Array(10000).fill("Payload Data");
    this.timer = null;
    this.isActive = false;
  }

  start() {
    this.isActive = true;
    this.timer = setInterval(() => {
      if (this.isActive) {
        // Do periodic work
      }
    }, 100);
    console.log(`Worker "${this.name}" started with active interval timer.`);
  }

  stop() {
    this.isActive = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log(`Worker "${this.name}" successfully stopped and interval timer cleared!`);
    }
  }
}

const worker = new LongLivedWorker("TelemetrySyncWorker");
worker.start();

setTimeout(() => {
  worker.stop();
  console.log("Memory Leak Verification: Worker interval cleanly released.");
}, 120);
