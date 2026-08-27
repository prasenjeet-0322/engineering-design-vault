/**
 * KPI 11 — Part 02: Timers, Scheduling, Repetition & Cancellation
 * Demonstrates:
 * 1. Gotcha: setInterval Overlapping Async Hazard vs Recursive setTimeout Serialization
 * 2. Gotcha: Debounce Cancellation Pattern (Suppressing Intermediate Executions)
 * 3. Prediction 1: Timer Cancellation via clearTimeout
 * 4. Prediction 2: Timer Drift Accumulation & Drift Compensation
 * 5. Practical Architecture: Standalone Resilient Recursive Poller with Cancellation
 */

"use strict";

console.log("=== 1. GOTCHA: setInterval OVERLAPPING CONCURRENCY HAZARD ===");

let intervalActiveCount = 0;
let maxIntervalConcurrent = 0;

// Fast interval (20ms) with slow async operation (60ms)
const intervalId = setInterval(async () => {
  intervalActiveCount++;
  if (intervalActiveCount > maxIntervalConcurrent) {
    maxIntervalConcurrent = intervalActiveCount;
  }

  // Simulate slow async I/O
  await new Promise((resolve) => setTimeout(resolve, 60));

  intervalActiveCount--;
}, 20);

setTimeout(() => {
  clearInterval(intervalId);
  console.log(`❌ setInterval Flaw: Max concurrent overlapping tasks = ${maxIntervalConcurrent} (Overlapping Hazard!)`);
}, 100);

console.log("\n=== 2. RECURSIVE setTimeout SERIALIZED EXECUTION ===");

let recursiveActiveCount = 0;
let maxRecursiveConcurrent = 0;
let recursiveRuns = 0;

async function runRecursivePoll() {
  if (recursiveRuns >= 3) {
    console.log(`✅ Recursive setTimeout Standard: Max concurrent tasks = ${maxRecursiveConcurrent} (Strict Serialization!)`);
    return;
  }

  recursiveRuns++;
  recursiveActiveCount++;
  if (recursiveActiveCount > maxRecursiveConcurrent) {
    maxRecursiveConcurrent = recursiveActiveCount;
  }

  // Simulate async work
  await new Promise((resolve) => setTimeout(resolve, 30));
  recursiveActiveCount--;

  // 🟢 Schedule next turn ONLY after current finishes
  setTimeout(runRecursivePoll, 10);
}

setTimeout(() => {
  runRecursivePoll();
}, 120);

console.log("\n=== 3. DEBOUNCE IMPLEMENTATION & OBSOLETE TASK CANCELLATION ===");

function debounce(fn, delayMs) {
  let timerId = null;
  return function (...args) {
    if (timerId !== null) {
      clearTimeout(timerId); // Cancel previous obsolete timer
    }
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delayMs);
  };
}

const executedQueries = [];
const debouncedSearch = debounce((query) => {
  executedQueries.push(query);
  console.log(`  [Debounced Search Executed]: "${query}"`);
}, 50);

// Simulate typing "R", "Re", "React"
debouncedSearch("R");
setTimeout(() => debouncedSearch("Re"), 20);
setTimeout(() => debouncedSearch("React"), 40);

setTimeout(() => {
  console.log("Total Executed Queries (Expected: 1):", executedQueries);
}, 200);

console.log("\n=== 4. TIMER DRIFT & CLOCK COMPENSATION ENGINE ===");

class PrecisionClock {
  constructor(intervalMs, targetTicks) {
    this.intervalMs = intervalMs;
    this.targetTicks = targetTicks;
    this.startTime = Date.now();
    this.tickCount = 0;
    this.timer = null;
  }

  start() {
    const tick = () => {
      this.tickCount++;
      const expectedTime = this.startTime + this.tickCount * this.intervalMs;
      const actualTime = Date.now();
      const drift = actualTime - expectedTime;

      console.log(`  [Tick #${this.tickCount}]: Drift = ${drift}ms (Actual: ${actualTime - this.startTime}ms)`);

      if (this.tickCount < this.targetTicks) {
        // Compensate next delay for accumulated drift:
        const nextDelay = Math.max(0, this.intervalMs - drift);
        this.timer = setTimeout(tick, nextDelay);
      } else {
        console.log("✅ Precision clock completed target ticks with drift compensation.");
      }
    };

    this.timer = setTimeout(tick, this.intervalMs);
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
  }
}

setTimeout(() => {
  console.log("\nStarting Precision Clock (3 ticks of 50ms):");
  const clock = new PrecisionClock(50, 3);
  clock.start();
}, 220);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: RESILIENT BACKGROUND POLLER ===");

class ResilientPoller {
  constructor(fetcher, intervalMs) {
    this.fetcher = fetcher;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.isCancelled = false;
  }

  start() {
    const loop = async () => {
      if (this.isCancelled) return;

      try {
        const result = await this.fetcher();
        console.log(`  [Poller Result]: ${JSON.stringify(result)}`);
      } catch (err) {
        console.error(`  [Poller Error]: ${err.message}`);
      } finally {
        if (!this.isCancelled) {
          this.timer = setTimeout(loop, this.intervalMs);
        }
      }
    };

    loop();
  }

  cancel() {
    this.isCancelled = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      console.log("✅ ResilientPoller safely cancelled and timer memory cleared.");
    }
  }
}

setTimeout(() => {
  let counter = 0;
  const poller = new ResilientPoller(async () => {
    counter++;
    return { status: "OK", count: counter };
  }, 40);

  poller.start();

  setTimeout(() => {
    poller.cancel();
  }, 100);
}, 450);
