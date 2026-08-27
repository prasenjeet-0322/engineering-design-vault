/**
 * KPI 22 — Part 05: Production Async Patterns, `AbortController` & Race Conditions
 * Demonstrates:
 * 1. Gotcha: `fetch()` Resolving on 404 Status Code & Required `response.ok` Handling
 * 2. Gotcha: Search Race Condition Out-of-Order Overwrite & `AbortController` Cancellation
 * 3. Prediction 1: Handling `204 No Content` Responses Safely
 * 4. Prediction 2: Exponential Backoff with Jitter Retry Strategy
 * 5. Practical Architecture: Standalone Resilient API Search Client with Versioning
 */

"use strict";

console.log("=== 1. GOTCHA: FETCH RESOLVES ON 404 HTTP ERROR ===");

// Mock Fetch simulating HTTP 404 Not Found
function mockFetch404() {
  return Promise.resolve({
    ok: false,
    status: 404,
    statusText: "Not Found",
    json: () => Promise.resolve({ error: "User 999 does not exist" })
  });
}

async function fetchUserSafe(id) {
  const response = await mockFetch404();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Resource Not Found`);
  }
  return response.json();
}

fetchUserSafe(999).catch((err) => {
  console.log("  ✅ Correctly Caught HTTP 404 Error:", err.message);
});

console.log("\n=== 2. GOTCHA: SEARCH RACE CONDITION ELIMINATION WITH ABORTCONTROLLER ===");

class ResilientSearchEngine {
  #activeController = null;
  #latestQueryId = 0;

  async search(query, latencyMs) {
    // 1. Abort previous in-flight search
    if (this.#activeController) {
      this.#activeController.abort();
    }

    this.#activeController = new AbortController();
    const { signal } = this.#activeController;
    const currentId = ++this.#latestQueryId;

    try {
      console.log(`    🚀 [Search Dispatched]: "${query}" (Request ID: ${currentId}, Latency: ${latencyMs}ms)`);
      const result = await this.#mockNetworkSearch(query, latencyMs, signal);

      // 2. Version Check: Only apply if still latest request
      if (currentId === this.#latestQueryId) {
        console.log(`    ✅ [UI Rendered]: Latest Search "${query}" -> Found ${result.items.length} items`);
        return result;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log(`    🛑 [Search Aborted]: Stale query "${query}" (Request ID: ${currentId}) successfully cancelled!`);
      } else {
        console.error("    ❌ Search Error:", err.message);
      }
    }
  }

  #mockNetworkSearch(query, delay, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve({ query, items: [`${query} Result 1`, `${query} Result 2`] });
      }, delay);

      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("The user aborted a request.", "AbortError"));
      });
    });
  }
}

const searchEngine = new ResilientSearchEngine();

// Simulate rapid user typing: "r" (Slow: 80ms), then "re" (Fast: 20ms)
searchEngine.search("r", 80);
setTimeout(() => {
  searchEngine.search("re", 20);
}, 10);

console.log("\n=== 3. PREDICTIONS: 204 NO CONTENT & EXPONENTIAL BACKOFF ===");

// 204 No Content Handling
async function handleResponse(res) {
  if (res.status === 204) return null; // Safe bypass
  return res.json();
}
const mock204 = { status: 204, ok: true };
handleResponse(mock204).then((data) => {
  console.log("  ✅ 204 No Content safely returned:", data);
});

// Exponential Backoff with Jitter
async function fetchWithBackoff(operationFn, maxRetries = 3, baseDelayMs = 15) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operationFn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 5;
      const totalDelay = exponentialDelay + jitter;
      console.log(`    ⏳ [Retry Attempt ${attempt + 1}]: Waiting ${totalDelay.toFixed(1)}ms...`);
      await new Promise((res) => setTimeout(res, totalDelay));
    }
  }
}

let attemptCount = 0;
fetchWithBackoff(async () => {
  attemptCount++;
  if (attemptCount < 3) throw new Error("Transient 503 Gateway Outage");
  return { success: true, payload: "Service Restored" };
}).then((res) => {
  console.log("  ✅ Exponential Backoff Succeeded on Attempt", attemptCount, ":", res.payload);
  console.log("\n  🎉 [Production Async Patterns, AbortController & Race Conditions Verification Completed Successfully!]");
});
