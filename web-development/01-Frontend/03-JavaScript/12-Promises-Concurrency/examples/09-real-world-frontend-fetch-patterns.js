/**
 * KPI 12 — Part 09: Real-World Promise Usage, fetch(), Race Conditions, Cancellation & Frontend Architecture
 * Demonstrates:
 * 1. Gotcha: fetch() Fulfills on HTTP 404/500 vs Explicit response.ok Validation
 * 2. Gotcha: Search-as-You-Type Race Condition & Stale UI Overwrite Solution
 * 3. Prediction 1: In-Flight Request Deduplication via Promise Cache
 * 4. Prediction 2: True Timeout Cancellation with AbortController
 * 5. Practical Architecture: Standalone Deduplicated & Cancellable HTTP Client
 */

"use strict";

console.log("=== 1. GOTCHA: FETCH() HTTP STATUS ERROR TRAP ===");

// Simulating fetch response object
function mockFetch(url, shouldFailHttp = false) {
  return Promise.resolve({
    status: shouldFailHttp ? 500 : 200,
    ok: !shouldFailHttp,
    json: () => Promise.resolve(shouldFailHttp ? { error: "Database Crash" } : { id: "USR-1", name: "Alice" })
  });
}

// ❌ Bug: Not checking response.ok
mockFetch("/api/user/1", true)
  .then((res) => res.json())
  .then((data) => {
    console.log("  ❌ [Buggy Flow - Silent Success on 500]: Received parsed data =", data);
  })
  .catch((err) => console.log("Will not run!"));

// ✅ Fix: Validate response.ok
mockFetch("/api/user/1", true)
  .then((res) => {
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  })
  .then(() => console.log("Will not run"))
  .catch((err) => {
    console.log("  ✅ [Fixed Flow - Properly Rejected]:", err.message);
  });

console.log("\n=== 2. SEARCH RACE CONDITION & STALE PROTECTION ===");

let currentSearchId = 0;

function simulateSearch(query, durationMs) {
  const requestId = ++currentSearchId;
  console.log(`  ▶️ [Dispatched Query "${query}"] with ID = ${requestId}`);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ query, requestId, data: [`Result for "${query}"`] });
    }, durationMs);
  }).then((result) => {
    if (result.requestId !== currentSearchId) {
      console.log(`  🛡️ [Discarded Stale Result]: Query "${result.query}" (ID ${result.requestId}) != Active ID ${currentSearchId}`);
      return;
    }
    console.log(`  🎉 [Rendered Fresh UI]: Query "${result.query}" (ID ${result.requestId}) matches Active ID ${currentSearchId}`);
  });
}

// Query 1 takes 60ms; Query 2 takes 20ms
simulateSearch("rea", 60);
setTimeout(() => simulateSearch("react", 20), 10);

console.log("\n=== 3. IN-FLIGHT PROMISE DEDUPLICATION ===");

class InFlightDeduplicator {
  constructor() {
    this.cache = new Map();
  }

  fetchDeduplicated(url) {
    if (this.cache.has(url)) {
      console.log(`  📦 [In-Flight Cache Hit]: Reusing active Promise for "${url}"`);
      return this.cache.get(url);
    }

    console.log(`  🌐 [Network Dispatch]: Firing single HTTP fetch for "${url}"`);
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve({ url, data: "Payload" }), 40);
    }).finally(() => {
      this.cache.delete(url);
      console.log(`  🧹 [Cache Evicted]: Cleaned up in-flight Promise for "${url}"`);
    });

    this.cache.set(url, promise);
    return promise;
  }
}

const deduplicator = new InFlightDeduplicator();
// 3 Synchronous callers
deduplicator.fetchDeduplicated("/api/posts/10").then((res) => console.log("    Caller 1 got:", res.url));
deduplicator.fetchDeduplicated("/api/posts/10").then((res) => console.log("    Caller 2 got:", res.url));
deduplicator.fetchDeduplicated("/api/posts/10").then((res) => console.log("    Caller 3 got:", res.url));

console.log("\n=== 4. TIMEOUT WITH ABORTCONTROLLER ===");

function fetchWithTimeout(durationMs, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    console.log(`  ⏱️ [Timeout Exceeded ${timeoutMs}ms]: Aborting request!`);
    controller.abort();
  }, timeoutMs);

  return new Promise((resolve, reject) => {
    controller.signal.addEventListener("abort", () => {
      reject(new Error("Request aborted due to timeout"));
    });

    setTimeout(() => {
      resolve("Data received successfully");
    }, durationMs);
  }).finally(() => {
    clearTimeout(timer);
  });
}

setTimeout(() => {
  console.log("\nTesting fetchWithTimeout:");
  fetchWithTimeout(80, 30)
    .then((data) => console.log("Success:", data))
    .catch((err) => console.log("  🛡️ [Timeout Caught]:", err.message));
}, 100);
