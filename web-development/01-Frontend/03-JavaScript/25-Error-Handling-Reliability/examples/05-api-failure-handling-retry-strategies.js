/**
 * KPI 25 — Part 05: API Failure Handling, Retries, Timeouts, Cancellation & Production-Safe Requests
 * Demonstrates:
 * 1. Gotcha: fetch() response.ok Verification vs Unhandled 404/500 HTTP Responses
 * 2. Gotcha: Non-Idempotent Mutation Protection via Idempotency-Key
 * 3. Prediction 1: Exponential Backoff with Full Jitter Formula Calculation
 * 4. Prediction 2: AbortController Request Cancellation Simulation
 * 5. Practical Architecture: Standalone Resilient Fetch Engine with Retry Budget & Backoff
 */

"use strict";

console.log("=== 1. GOTCHA: FETCH() RESPONSE.OK VERIFICATION ===");

class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// Simulated mock fetch
function mockFetch(url) {
  return Promise.resolve({
    ok: false,
    status: 503,
    statusText: "Service Unavailable",
    json: async () => ({ error: "Database capacity exceeded" })
  });
}

// 1. Broken implementation: Assumes fetch rejects on 503
async function badFetch(url) {
  try {
    const res = await mockFetch(url);
    // 💥 Failed to check res.ok!
    return "Assumed Success";
  } catch (err) {
    return "Caught";
  }
}

// 2. Correct implementation: Checks res.ok
async function goodFetch(url) {
  const res = await mockFetch(url);
  if (!res.ok) {
    throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status);
  }
  return res.json();
}

(async () => {
  const badResult = await badFetch("/api/data");
  console.log(`  ❌ Bad fetch result: "${badResult}" (HTTP 503 was treated as success!)`);

  try {
    await goodFetch("/api/data");
  } catch (err) {
    console.log(`  ✅ Good fetch caught error: [${err.name}] Status ${err.status} - "${err.message}"`);
  }

  console.log("\n=== 2. GOTCHA: IDEMPOTENCY KEY MUTATION DEDUPLICATION ===");

  const processedMutations = new Set();

  function processPayment(idempotencyKey, amount) {
    if (processedMutations.has(idempotencyKey)) {
      return { status: "DEDUPLICATED", message: `Payment of $${amount} already processed.` };
    }
    processedMutations.add(idempotencyKey);
    return { status: "CHARGED", message: `Successfully charged $${amount}.` };
  }

  const key = "tx_key_883019";
  console.log("  Attempt 1 (Original):", processPayment(key, 100));
  console.log("  Attempt 2 (Retry on network timeout):", processPayment(key, 100));

  console.log("\n=== 3. PREDICTION: EXPONENTIAL BACKOFF WITH FULL JITTER ===");

  function calculateFullJitter(attempt, baseMs = 1000) {
    const maxBackoff = baseMs * Math.pow(2, attempt);
    const sleep = Math.floor(Math.random() * maxBackoff);
    return { attempt, maxBackoff, sleep };
  }

  console.log("  Sample Full Jitter Sleep Calculations (Base: 1000ms):");
  for (let i = 0; i < 4; i++) {
    const res = calculateFullJitter(i);
    console.log(`    Attempt ${i + 1} -> Max Window: ${res.maxBackoff}ms | Random Jitter Sleep: ${res.sleep}ms`);
  }

  console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE RESILIENT FETCH ENGINE ===");

  class ResilientFetchEngine {
    static async executeWithRetry(taskName, taskFn, maxRetries = 3, baseDelayMs = 20) {
      console.log(`  ▶️ Starting Resilient Pipeline: "${taskName}" (Max Retries: ${maxRetries})`);

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await taskFn(attempt);
        } catch (err) {
          const isTransient = err.status >= 500 || err.name === "NetworkError";
          const isLast = attempt === maxRetries - 1;

          console.log(`    ⚠️ Attempt ${attempt + 1} Failed: "${err.message}" (Transient: ${isTransient})`);

          if (isLast || !isTransient) {
            throw err;
          }

          const jitterDelay = Math.floor(Math.random() * (baseDelayMs * Math.pow(2, attempt)));
          console.log(`      ⏳ Backoff sleep: ${jitterDelay}ms before attempt ${attempt + 2}...`);
          await new Promise((r) => setTimeout(r, jitterDelay));
        }
      }
    }
  }

  // Test Resilient Engine: Fails on attempt 0 and 1, succeeds on attempt 2
  let callCount = 0;
  try {
    const result = await ResilientFetchEngine.executeWithRetry(
      "Fetch Real-Time Analytics",
      async (attempt) => {
        callCount++;
        if (callCount < 3) {
          throw new HttpError("503 Service Temporarily Unavailable", 503);
        }
        return { views: 14200, status: "ONLINE" };
      }
    );
    console.log(`  🎉 Pipeline Succeeded on Attempt ${callCount}:`, result);
  } catch (finalErr) {
    console.log("  Failed permanently:", finalErr);
  }

  console.log("\n  🎉 [API Failure Handling, Retries & Production-Safe Requests Verification Completed Successfully!]");
})();
