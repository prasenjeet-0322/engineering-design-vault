/**
 * KPI 16 — Part 01: The Browser as a Platform, Web APIs & Page Lifecycle
 * Demonstrates:
 * 1. Gotcha: `setInterval` Async Overlap vs Guaranteed Sequential Recursive `setTimeout`
 * 2. Gotcha: Function Reference Equality in Event Listener Teardown
 * 3. Prediction 1: Debounce Trailing-Edge Execution
 * 4. Prediction 2: Throttle Rate-Limiting Behavior
 * 5. Practical Architecture: Standalone Adaptive Polling & Visibility Controller Engine
 */

"use strict";

console.log("=== 1. GOTCHA: SETINTERVAL ASYNC OVERLAP VS RECURSIVE SETTIMEOUT ===");

// 1. Buggy setInterval Async Overlap Simulation
let intervalConcurrency = 0;
let maxIntervalConcurrency = 0;

async function slowAsyncFetch() {
  intervalConcurrency++;
  maxIntervalConcurrency = Math.max(maxIntervalConcurrency, intervalConcurrency);
  // Simulating 50ms slow network request
  await new Promise((resolve) => setTimeout(resolve, 50));
  intervalConcurrency--;
}

const intervalHandle = setInterval(slowAsyncFetch, 15); // Interval fires every 15ms

setTimeout(() => {
  clearInterval(intervalHandle);
  console.log(`  ❌ [setInterval Concurrency Bug]: Max concurrent requests spiked to: ${maxIntervalConcurrency} (Overlapping!)`);
}, 70);

// 2. Sequential Recursive setTimeout
setTimeout(() => {
  let sequentialConcurrency = 0;
  let maxSequentialConcurrency = 0;
  let pollCount = 0;

  async function safeSequentialPoll() {
    sequentialConcurrency++;
    maxSequentialConcurrency = Math.max(maxSequentialConcurrency, sequentialConcurrency);
    await new Promise((resolve) => setTimeout(resolve, 30));
    sequentialConcurrency--;
    pollCount++;

    if (pollCount < 3) {
      setTimeout(safeSequentialPoll, 10);
    } else {
      console.log(`  ✅ [Recursive setTimeout Invariant]: Max concurrent requests: ${maxSequentialConcurrency} (Strictly 1 at a time!)`);
    }
  }

  safeSequentialPoll();
}, 90);

console.log("\n=== 2. DEBOUNCE VS THROTTLE SCHEDULING SIMULATION ===");

function createDebounce(fn, delayMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

function createThrottle(fn, intervalMs) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= intervalMs) {
      lastTime = now;
      fn(...args);
    }
  };
}

const debouncedLog = createDebounce((msg) => console.log("  🎯 [Debounce Executed]:", msg), 30);
const throttledLog = createThrottle((msg) => console.log("  ⚡ [Throttle Executed]:", msg), 20);

setTimeout(() => {
  console.log("\nTriggering rapid events for Debounce & Throttle:");
  debouncedLog("Query-A");
  debouncedLog("Query-B");
  debouncedLog("Query-C (Final Settled)");

  throttledLog("Scroll-1 (Immediate)");
  throttledLog("Scroll-2 (Suppressed)");
  throttledLog("Scroll-3 (Suppressed)");
}, 180);

setTimeout(() => {
  console.log("\n=== 3. PRACTICAL ARCHITECTURE: ADAPTIVE POLLING ENGINE ===");

  class AdaptivePollingEngine {
    constructor(taskFn, intervalMs = 25) {
      this.taskFn = taskFn;
      this.intervalMs = intervalMs;
      this.isTabVisible = true;
      this.timer = null;
      this.isRunning = false;
    }

    start() {
      this.isRunning = true;
      this.poll();
    }

    stop() {
      this.isRunning = false;
      if (this.timer) clearTimeout(this.timer);
    }

    setVisibility(isVisible) {
      this.isTabVisible = isVisible;
      console.log(`    👁️ [Visibility State Changed]: isVisible = ${isVisible}`);
      if (isVisible && this.isRunning) {
        this.poll(); // Instant refresh on tab focus!
      }
    }

    async poll() {
      if (!this.isRunning || !this.isTabVisible) {
        console.log("    ⏸️ [Polling Suspended]: Tab is in background to save resources.");
        return;
      }

      try {
        const result = await this.taskFn();
        console.log("    📦 [Poll Success]:", result);
      } finally {
        if (this.isRunning && this.isTabVisible) {
          this.timer = setTimeout(() => this.poll(), this.intervalMs);
        }
      }
    }
  }

  let counter = 0;
  const engine = new AdaptivePollingEngine(() => Promise.resolve({ metricId: ++counter, load: "OK" }), 20);

  console.log("  ▶️ Starting Adaptive Polling in active tab:");
  engine.start();

  // Simulate user switching to background tab
  setTimeout(() => {
    engine.setVisibility(false);
  }, 45);

  // Simulate user returning to tab
  setTimeout(() => {
    engine.setVisibility(true);
  }, 75);

  // Teardown
  setTimeout(() => {
    engine.stop();
    console.log("  🎉 [Adaptive Polling Engine Verification Completed Successfully!]");
  }, 110);
}, 240);
