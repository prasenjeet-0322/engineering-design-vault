/**
 * KPI 13 — Part 05: Real-World fetch, HTTP Errors, AbortController, Cancellation, Timeouts & Race Conditions
 * Demonstrates:
 * 1. Gotcha: fetch() Fulfilling on HTTP 500 vs Explicit `response.ok` Validation
 * 2. Gotcha: Search-as-You-Type Race Condition & Monotonic Request ID Guarding
 * 3. Prediction 1: Filtering Out `AbortError` as Normal Control Flow
 * 4. Prediction 2: True Timeout Cancellation with AbortController
 * 5. Practical Architecture: Production-Grade Cancellable & Versioned Search Engine
 */

"use strict";

console.log("=== 1. GOTCHA: FETCH() HTTP 500 FULFILLMENT VS RESPONSE.OK CHECK ===");

// Mocking fetch response
function mockNetworkFetch(url, isServerError = false) {
  return Promise.resolve({
    status: isServerError ? 500 : 200,
    ok: !isServerError,
    json: () => Promise.resolve(isServerError ? { error: "Database Crash" } : { id: 1, name: "Alice" })
  });
}

// ❌ Bug: Assuming fetch() rejects on HTTP 500
async function buggyFetchUser() {
  try {
    const res = await mockNetworkFetch("/api/user", true);
    const data = await res.json();
    console.log("  ❌ [Buggy Flow - Silent Success on 500]: Received parsed body =", data);
  } catch (err) {
    console.log("Will not run!");
  }
}

// ✅ Fix: Validate response.ok
async function robustFetchUser() {
  try {
    const res = await mockNetworkFetch("/api/user", true);
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.log("  ✅ [Robust Flow - Properly Thrown & Caught]:", err.message);
  }
}

buggyFetchUser().then(() => robustFetchUser());

console.log("\n=== 2. GOTCHA: SEARCH RACE CONDITION & REQUEST ID GUARDING ===");

let currentSearchSequence = 0;

async function executeSearch(term, delayMs) {
  const seq = ++currentSearchSequence;
  console.log(`  ▶️ [Dispatched Query "${term}"] with Sequence ID = ${seq}`);

  const result = await new Promise((resolve) =>
    setTimeout(() => resolve({ term, seq, data: [`Match for "${term}"`] }), delayMs)
  );

  if (result.seq !== currentSearchSequence) {
    console.log(`  🛡️ [Discarded Stale Result]: Query "${result.term}" (Seq ${result.seq}) != Active Seq ${currentSearchSequence}`);
    return;
  }

  console.log(`  🎉 [Rendered Fresh UI]: Query "${result.term}" (Seq ${result.seq}) matches Active Seq ${currentSearchSequence}`);
}

// "rea" dispatched 1st but takes 60ms; "react" dispatched 2nd and takes 20ms
executeSearch("rea", 60);
setTimeout(() => executeSearch("react", 20), 10);

console.log("\n=== 3. TRUE TIMEOUT CANCELLATION WITH ABORTCONTROLLER ===");

function fetchWithTimeout(durationMs, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    console.log(`  ⏱️ [Timeout of ${timeoutMs}ms Triggered]: Aborting request socket!`);
    controller.abort();
  }, timeoutMs);

  return new Promise((resolve, reject) => {
    controller.signal.addEventListener("abort", () => {
      reject(new Error("Request timed out and aborted"));
    });

    setTimeout(() => resolve("Data payload received successfully"), durationMs);
  }).finally(() => {
    clearTimeout(timer);
  });
}

setTimeout(async () => {
  console.log("\nTesting fetchWithTimeout (Duration = 80ms, Timeout = 30ms):");
  try {
    const data = await fetchWithTimeout(80, 30);
    console.log("Success:", data);
  } catch (err) {
    console.log("  🛡️ [Timeout Exception Caught]:", err.message);
  }
}, 80);
