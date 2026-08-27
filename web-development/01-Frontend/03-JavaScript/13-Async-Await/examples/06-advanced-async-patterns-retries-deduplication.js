/**
 * KPI 13 — Part 06: Advanced Async Patterns, Retries, Deduplication & Telemetry Architecture
 * Demonstrates:
 * 1. Gotcha: The Cached Rejected Promise Bug vs Guaranteed `.finally()` Eviction
 * 2. Gotcha: Retrying Transient 500 Errors with Exponential Backoff and Randomized Jitter
 * 3. Prediction 1: In-Flight Request Deduplication Sharing 1 Promise Across 3 Callers
 * 4. Prediction 2: `Promise.any` vs `Promise.race` on Rejection Handling
 * 5. Practical Architecture: Standalone Production Resilient HTTP Client
 */

"use strict";

console.log("=== 1. GOTCHA: IN-FLIGHT PROMISE DEDUPLICATION & CACHE EVICTION ===");

class InFlightDeduplicator {
  constructor() {
    this.inFlightMap = new Map();
  }

  fetchDeduplicated(url) {
    if (this.inFlightMap.has(url)) {
      console.log(`  📦 [In-Flight Cache Hit]: Sharing active Promise for "${url}"`);
      return this.inFlightMap.get(url);
    }

    console.log(`  🌐 [Network Dispatch]: Firing single HTTP fetch for "${url}"`);
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve({ url, data: "Payload-Data" }), 35);
    }).finally(() => {
      // 🟢 Prevent Poisoned Cache: Always evict on settle!
      this.inFlightMap.delete(url);
      console.log(`  🧹 [Cache Evicted]: Cleaned up in-flight Promise for "${url}"`);
    });

    this.inFlightMap.set(url, promise);
    return promise;
  }
}

const deduplicator = new InFlightDeduplicator();

// 3 Synchronous callers firing simultaneously
deduplicator.fetchDeduplicated("/api/users/10").then((r) => console.log("    Caller 1 received:", r.url));
deduplicator.fetchDeduplicated("/api/users/10").then((r) => console.log("    Caller 2 received:", r.url));
deduplicator.fetchDeduplicated("/api/users/10").then((r) => console.log("    Caller 3 received:", r.url));

console.log("\n=== 2. PROMISE.ANY VS PROMISE.RACE BEHAVIOR ===");

const fastFail = new Promise((_, rej) => setTimeout(() => rej(new Error("CDN 1 Offline")), 15));
const slowSuccess = new Promise((res) => setTimeout(() => res("CDN 2 Data Success"), 40));

// Promise.race settles on the fast rejection
Promise.race([fastFail, slowSuccess])
  .catch((err) => console.log("  🏁 [Promise.race Settled on Fast Failure]:", err.message));

// Promise.any ignores the fast rejection and fulfills on slowSuccess
Promise.any([fastFail, slowSuccess])
  .then((res) => console.log("  🎯 [Promise.any Succeeded with First Success]:", res));

console.log("\n=== 3. EXPONENTIAL BACKOFF WITH RANDOMIZED JITTER ===");

async function retryWithBackoffAndJitter(taskFn, maxAttempts = 3, baseDelay = 20) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`  ▶️ [Attempt ${attempt + 1}/${maxAttempts}] Executing task...`);
      return await taskFn(attempt + 1);
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts - 1) break;

      const expDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * expDelay;
      const sleepMs = expDelay + jitter;
      console.log(`    ⚠️ [Attempt ${attempt + 1} Failed: ${err.message}]. Sleeping ${Math.round(sleepMs)}ms (Backoff + Jitter)...`);
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }

  throw lastError;
}

setTimeout(async () => {
  console.log("\nTesting Retry Engine (Fails on attempts 1 & 2, succeeds on 3):");
  let tries = 0;
  const resilientTask = (attemptNumber) => {
    tries++;
    if (tries < 3) return Promise.reject(new Error(`503 Service Unavailable (Try ${tries})`));
    return Promise.resolve({ status: 200, message: "Transaction Completed!" });
  };

  const finalResult = await retryWithBackoffAndJitter(resilientTask, 3, 15);
  console.log("  🎉 [Retry Workflow Completed Successfully]:", finalResult);
}, 60);
