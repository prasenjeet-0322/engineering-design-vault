/**
 * KPI 04 — Part 09: The Event Loop, Web APIs, Tasks, Microtasks & Async Execution
 * Demonstrates:
 * 1. Gotcha: Microtask Queue Priority over setTimeout(fn, 0)
 * 2. Prediction 1: Mixed Task vs Microtask Execution Interleaving
 * 3. Prediction 2: Microtask Scheduled Inside a Timer Task
 * 4. Prediction 3: async / await Synchronous Start vs Microtask Resume
 * 5. Practical Architecture: Race-Condition-Free Monotonic Async Pipeline with AbortController
 */

console.log("=== 1. GOTCHA: PROMISE MICROTASKS RUN BEFORE SETTIMEOUT(0) ===");
console.log("Sync A");
setTimeout(() => console.log("Timer Task B (Runs 3rd)"), 0);
Promise.resolve().then(() => console.log("Microtask C (Runs 2nd)"));
console.log("Sync D (Runs 1st)");

console.log("\n=== 2. PREDICTION 1: MIXED TASK VS MICROTASK ORDER ===");
setTimeout(() => {
  console.log("Timer Task 1");
  Promise.resolve().then(() => console.log("Microtask inside Timer Task 1"));
}, 10);

Promise.resolve().then(() => {
  console.log("Initial Microtask Alpha");
});

console.log("\n=== 3. PREDICTION 3: ASYNC / AWAIT SYNCHRONOUS START ===");
async function asyncFlow() {
  console.log("Async Function: Synchronous Start");
  await Promise.resolve();
  console.log("Async Function: Resumed as Microtask");
}
asyncFlow();
console.log("Sync Code After Calling asyncFlow()");

console.log("\n=== 4. PRACTICAL ARCHITECTURE: RACE-FREE ASYNC PIPELINE ===");

class RaceFreeAsyncPipeline {
  constructor() {
    this.latestRequestId = 0;
    this.activeAbortController = null;
  }

  async executeQuery(queryText, mockDelayMs) {
    // 1. Cancel previous in-flight request
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }

    const abortController = new AbortController();
    this.activeAbortController = abortController;
    const currentRequestId = ++this.latestRequestId;

    console.log(`[Request #${currentRequestId}] Started for "${queryText}" (Delay: ${mockDelayMs}ms)`);

    try {
      // Simulate network roundtrip with abort support
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve({ query: queryText, data: `Results for ${queryText}` });
        }, mockDelayMs);

        abortController.signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("AbortError: Query superseded"));
        });
      });

      // 2. Monotonic check: verify this is still the newest request
      if (currentRequestId === this.latestRequestId) {
        console.log(`[Request #${currentRequestId}] ✅ APPLIED TO STATE:`, result.data);
        return result;
      } else {
        console.log(`[Request #${currentRequestId}] ⚠️ IGNORED (Superseded by #${this.latestRequestId})`);
      }
    } catch (err) {
      console.log(`[Request #${currentRequestId}] 🛑 CANCELLED:`, err.message);
    }
  }
}

const pipeline = new RaceFreeAsyncPipeline();

// Simulate rapid user typing: "R" (slow 100ms) then "React" (fast 30ms)
pipeline.executeQuery("R", 100);
setTimeout(() => {
  pipeline.executeQuery("React", 30);
}, 10);
