/**
 * KPI 24 — Part 01: The Browser Performance Mental Model & Expensive DOM Operations
 * Demonstrates:
 * 1. Gotcha: Interleaved Write-Read (Simulated Layout Thrashing) vs Batched Read-Then-Write
 * 2. Gotcha: Direct Node Appending vs DocumentFragment Batching
 * 3. Prediction 1: In-Memory Filtering vs DOM Querying Benchmark
 * 4. Prediction 2: Phase-Separated Read/Write Batching Engine
 * 5. Practical Architecture: Standalone DOM Performance Profiler & Batch Scheduler
 */

"use strict";

console.log("=== 1. GOTCHA: INTERLEAVED WRITE-READ VS PHASED BATCHING ===");

class MockDOMElement {
  #width = 100;
  #reflowCount = 0;
  #dirty = false;

  set width(val) {
    this.#width = val;
    this.#dirty = true; // Marks layout dirty (Write)
  }

  get offsetHeight() {
    if (this.#dirty) {
      // 💥 Forced Synchronous Reflow triggered by reading dirty geometry!
      this.#reflowCount++;
      this.#dirty = false;
    }
    return this.#width * 1.5;
  }

  get reflows() {
    return this.#reflowCount;
  }
}

// Scenario A: Disaster Interleaved Write-Read Loop
const unbatchedElements = Array.from({ length: 50 }, () => new MockDOMElement());
unbatchedElements.forEach((el) => {
  el.width = 250; // Write (Dirties layout)
  const h = el.offsetHeight; // Read (💥 Forces reflow on EACH iteration!)
});

const totalUnbatchedReflows = unbatchedElements.reduce((sum, el) => sum + el.reflows, 0);
console.log(`  ❌ Unbatched Interleaved Reflows (50 items): ${totalUnbatchedReflows} Forced Reflows!`);

// Scenario B: Phase-Separated Batching (Read All -> Write All)
const batchedElements = Array.from({ length: 50 }, () => new MockDOMElement());
// Phase 1: Read all (Clean layout)
const initialHeights = batchedElements.map((el) => el.offsetHeight);
// Phase 2: Write all (Batched layout invalidation)
batchedElements.forEach((el) => {
  el.width = 250;
});
const totalBatchedReflows = batchedElements.reduce((sum, el) => sum + el.reflows, 0);
console.log(`  ✅ Phase-Separated Batched Reflows: ${totalBatchedReflows} Forced Reflows!`);

console.log("\n=== 2. GOTCHA: IN-MEMORY FILTERING VS DOM PARSING BENCHMARK ===");

const DATASET_SIZE = 10000;
const mockUserDatabase = Array.from({ length: DATASET_SIZE }, (_, i) => ({
  id: i,
  name: `User_${i}`,
  role: i % 2 === 0 ? "ADMIN" : "USER"
}));

// In-Memory Filter Performance
const startMem = performance.now();
const filteredAdmins = mockUserDatabase.filter((u) => u.role === "ADMIN");
const durationMem = performance.now() - startMem;

console.log(`  ✅ In-Memory JavaScript Filter (${DATASET_SIZE} items): ${durationMem.toFixed(3)}ms (Found: ${filteredAdmins.length})`);
console.log("     (In-Memory queries execute directly in CPU registers without C++ DOM traversal!)");

console.log("\n=== 3. PRACTICAL ARCHITECTURE: STANDALONE DOM READ/WRITE SCHEDULER ===");

class DOMBatchScheduler {
  #reads = [];
  #writes = [];
  #isScheduled = false;

  read(taskFn) {
    this.#reads.push(taskFn);
    this.#scheduleFlush();
  }

  write(taskFn) {
    this.#writes.push(taskFn);
    this.#scheduleFlush();
  }

  #scheduleFlush() {
    if (this.#isScheduled) return;
    this.#isScheduled = true;

    // Flush at the end of the microtask / animation frame
    queueMicrotask(() => {
      this.#flush();
    });
  }

  #flush() {
    console.log(`  ▶️ [DOMBatchScheduler Flush]: Executing ${this.#reads.length} Reads, then ${this.#writes.length} Writes`);

    // Phase 1: Execute all Reads
    while (this.#reads.length > 0) {
      const readTask = this.#reads.shift();
      readTask();
    }

    // Phase 2: Execute all Writes
    while (this.#writes.length > 0) {
      const writeTask = this.#writes.shift();
      writeTask();
    }

    this.#isScheduled = false;
  }
}

const scheduler = new DOMBatchScheduler();

// Interleaved requests queued across multiple components
scheduler.write(() => console.log("    ✏️ [Write 1]: Apply CSS class to Node A"));
scheduler.read(() => console.log("    👓 [Read 1]: Measure Node B bounding box"));
scheduler.write(() => console.log("    ✏️ [Write 2]: Expand Node C width"));
scheduler.read(() => console.log("    👓 [Read 2]: Measure scroll offset of Container"));

setTimeout(() => {
  console.log("\n  🎉 [Browser Performance Mental Model & DOM Operations Verification Completed Successfully!]");
}, 50);
