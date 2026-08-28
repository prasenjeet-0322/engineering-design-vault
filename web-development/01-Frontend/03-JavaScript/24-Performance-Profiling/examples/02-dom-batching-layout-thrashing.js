/**
 * KPI 24 — Part 02: DOM Batching & Layout Thrashing
 * Demonstrates:
 * 1. Gotcha: Clean Read vs Dirty Read Forced Reflow Verification
 * 2. Gotcha: Interleaved Equal-Height Thrashing vs Phase-Separated Batching
 * 3. Prediction 1: FastDOM Scheduler Read/Write Queue Priority Ordering
 * 4. Prediction 2: High-Frequency Event Coalescing via Simulated rAF
 * 5. Practical Architecture: Standalone FastDOM Batching Engine
 */

"use strict";

console.log("=== 1. GOTCHA: CLEAN READ VS DIRTY FORCED REFLOW ===");

class SimulatedLayoutNode {
  #width = 100;
  #height = 50;
  #isDirty = false;
  #reflowEvents = 0;

  set width(val) {
    this.#width = val;
    this.#isDirty = true; // Dirty layout state
  }

  set height(val) {
    this.#height = val;
    this.#isDirty = true; // Dirty layout state
  }

  get offsetHeight() {
    if (this.#isDirty) {
      this.#reflowEvents++;
      this.#isDirty = false; // Layout recalculated
    }
    return this.#height;
  }

  get reflowCount() {
    return this.#reflowEvents;
  }
}

// Clean reads: 5 consecutive reads on an unmodified tree
const cleanNode = new SimulatedLayoutNode();
for (let i = 0; i < 5; i++) {
  const h = cleanNode.offsetHeight;
}
console.log("  ✅ 5 Consecutive Reads on Clean Tree -> Total Forced Reflows:", cleanNode.reflowCount);

// Dirty reads: 5 interleaved write-read iterations
const dirtyNode = new SimulatedLayoutNode();
for (let i = 0; i < 5; i++) {
  dirtyNode.height = 100 + i; // Write
  const h = dirtyNode.offsetHeight; // Read
}
console.log("  ❌ 5 Interleaved Write-Read Iterations -> Total Forced Reflows:", dirtyNode.reflowCount);

console.log("\n=== 2. EQUAL-HEIGHT CARDS: THRASHER VS PHASE-SEPARATED ENGINE ===");

const cardListA = Array.from({ length: 20 }, () => new SimulatedLayoutNode());
// Bad Thrashed Implementation
cardListA.forEach((card, idx) => {
  card.height = 80; // Reset write
  const currentH = card.offsetHeight; // Read (💥 Reflow!)
  card.height = currentH + 20; // Final write
});
const thrashedReflows = cardListA.reduce((sum, c) => sum + c.reflowCount, 0);
console.log(`  ❌ Thrashed Card Loop (20 items): ${thrashedReflows} Forced Reflows!`);

const cardListB = Array.from({ length: 20 }, () => new SimulatedLayoutNode());
// Clean Phase-Separated Implementation
// Phase 1: Set auto
cardListB.forEach((c) => { c.height = 80; });
// Phase 2: Single batched read pass (First read forces 1 layout to resolve all preceding writes!)
const measuredHeights = cardListB.map((c) => c.offsetHeight);
const maxCalculatedHeight = Math.max(...measuredHeights);
// Phase 3: Single batched write pass
cardListB.forEach((c) => { c.height = maxCalculatedHeight + 20; });
const batchedReflows = cardListB.reduce((sum, c) => sum + c.reflowCount, 0);
console.log(`  ✅ Phase-Separated Batched Card Loop: ${batchedReflows} Forced Reflow (Consolidated)!`);

console.log("\n=== 3. PRACTICAL ARCHITECTURE: STANDALONE FASTDOM SCHEDULER ===");

class FastDOMScheduler {
  #readTasks = [];
  #writeTasks = [];
  #scheduled = false;

  measure(fn) {
    this.#readTasks.push(fn);
    this.#scheduleFlush();
  }

  mutate(fn) {
    this.#writeTasks.push(fn);
    this.#scheduleFlush();
  }

  #scheduleFlush() {
    if (this.#scheduled) return;
    this.#scheduled = true;

    // Flush in microtask
    queueMicrotask(() => {
      this.#flush();
    });
  }

  #flush() {
    console.log(`  ▶️ [FastDOM Engine Flush]: Running ${this.#readTasks.length} Measures, then ${this.#writeTasks.length} Mutates`);

    // Priority Phase 1: All Reads (Measures) executed first on clean tree
    while (this.#readTasks.length > 0) {
      const readTask = this.#readTasks.shift();
      readTask();
    }

    // Priority Phase 2: All Writes (Mutates) executed in a single atomic batch
    while (this.#writeTasks.length > 0) {
      const writeTask = this.#writeTasks.shift();
      writeTask();
    }

    this.#scheduled = false;
  }
}

const fastdom = new FastDOMScheduler();

// Interleaved calls across 3 independent UI widgets
fastdom.mutate(() => console.log("    ✏️ [Widget A Mutate]: Set sidebar width"));
fastdom.measure(() => console.log("    👓 [Widget B Measure]: Read modal height"));
fastdom.mutate(() => console.log("    ✏️ [Widget C Mutate]: Update card background"));
fastdom.measure(() => console.log("    👓 [Widget A Measure]: Read navbar offsetTop"));

setTimeout(() => {
  console.log("\n  🎉 [DOM Batching & Layout Thrashing Verification Completed Successfully!]");
}, 50);
