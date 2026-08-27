/**
 * KPI 19 — Part 03: AbortController, Request Cancellation, Race Conditions & Concurrency
 * Demonstrates:
 * 1. Gotcha: AbortError Non-Retry Rule vs Transient Error Retries
 * 2. Gotcha: Search-As-You-Type Race Condition Prevention (AbortController + Request ID)
 * 3. Prediction 1: Multi-Operation Signal Coordination
 * 4. Prediction 2: Native AbortSignal.timeout() Execution
 * 5. Practical Architecture: Standalone Cancellable Search Engine with Exponential Backoff
 */

"use strict";

console.log("=== 1. GOTCHA: ABORTERROR NON-RETRY EXCLUSION RULE ===");

async function resilientFetchWithRetry(fetchFn, retries = 2) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fetchFn();
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("    🛑 [Retry Guard]: AbortError detected -> Cancelling immediately without retry!");
        throw err;
      }
      attempt++;
      if (attempt > retries) throw err;
      console.log(`    🔄 [Retry Loop]: Transient error caught -> Retrying attempt #${attempt}...`);
    }
  }
}

// Case A: Intentionally Aborted Request
const abortCtrl = new AbortController();
abortCtrl.abort();

resilientFetchWithRetry(
  () =>
    new Promise((_, reject) => {
      if (abortCtrl.signal.aborted) {
        reject(new DOMException("This operation was aborted", "AbortError"));
      }
    })
).catch((err) => {
  console.log("  ✅ Correctly handled AbortError without infinite retries:", err.name);
});

console.log("\n=== 2. GOTCHA: SEARCH RACE CONDITION WITH ABORTCONTROLLER + REQUEST ID ===");

let currentController = null;
let currentRequestId = 0;
let committedSearchResults = "";

async function executeSearch(query, latencyMs) {
  // 1. Abort previous in-flight request
  if (currentController) {
    currentController.abort();
  }

  currentController = new AbortController();
  const requestId = ++currentRequestId;
  const signal = currentController.signal;

  console.log(`    🔍 [Search Dispatched]: ID #${requestId} ("${query}") with ${latencyMs}ms delay`);

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, latencyMs);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });

    // 2. Concurrency Guard: Only update if still latest
    if (requestId === currentRequestId) {
      committedSearchResults = `RESULTS_FOR_${query.toUpperCase()}`;
      console.log(`    ✅ [Search Committed]: ID #${requestId} committed: "${committedSearchResults}"`);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.log(`    🛑 [Search Aborted]: ID #${requestId} ("${query}") cancelled cleanly.`);
      return;
    }
    throw err;
  }
}

// User types "React" (slow, takes 60ms)
executeSearch("React", 60);

// User immediately types "Vue" (fast, takes 15ms)
executeSearch("Vue", 15);

setTimeout(() => {
  console.log("\n  📦 Final Committed Search State in UI:", committedSearchResults);
}, 80);

console.log("\n=== 3. NATIVE ABORTSIGNAL.TIMEOUT() DEMONSTRATION ===");

async function testTimeoutSignal() {
  const signal = AbortSignal.timeout(30); // Auto-aborts after 30ms

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 80); // Takes 80ms (exceeds timeout!)
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(signal.reason);
      });
    });
  } catch (err) {
    console.log("  ✅ Successfully Caught Timeout Signal:", err.name, "(Exceeded 30ms SLA)");
    console.log("\n  🎉 [AbortController, Race Conditions & Concurrency Verification Completed Successfully!]");
  }
}

testTimeoutSignal();
