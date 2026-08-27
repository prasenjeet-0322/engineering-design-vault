/**
 * KPI 10 — Part 03: Asynchronous Error Handling & Network Resilience
 * Demonstrates:
 * 1. Gotcha: fetch() HTTP 500 Resolving vs Network Rejection
 * 2. Gotcha: Search Input Race Condition Simulation & AbortController Fix
 * 3. Prediction 1: Promise.all vs Promise.allSettled Partial Failures
 * 4. Prediction 2: Un-Awaited Promise Escape Trap
 * 5. Practical Architecture: Resilient Fetch Client with Exponential Backoff + Jitter
 */

"use strict";

console.log("=== 1. GOTCHA: FETCH() HTTP 500 RESOLUTION VS NETWORK REJECTION ===");

// Mock Fetch Transport Engine
async function mockFetch(url, shouldSimulateNetworkDrop = false, status = 200) {
  if (shouldSimulateNetworkDrop) {
    throw new TypeError("Failed to fetch (DNS / Network dropped)");
  }
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 500 ? "Internal Server Error" : "OK",
    json: async () => ({ error: "Database down" })
  };
}

async function demonstrateFetchResolution() {
  // Case A: HTTP 500 Server Error
  try {
    const res = await mockFetch("/api/crash", false, 500);
    console.log(`Fetch resolved successfully with HTTP ${res.status}! (Did NOT throw!)`);

    if (!res.ok) {
      console.log("-> Manually asserted !res.ok -> Normalizing to Error");
    }
  } catch (err) {
    console.log("Caught:", err.message);
  }

  // Case B: True Network Drop
  try {
    await mockFetch("/api/crash", true);
  } catch (err) {
    console.log(`Fetch threw directly on network failure: ${err.message}`);
  }
}

demonstrateFetchResolution();

console.log("\n=== 2. GOTCHA: SEARCH INPUT RACE CONDITION SIMULATION & ABORT FIX ===");

let currentUiState = "Initial";

async function simulateSearch(query, delayMs, signal) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve(`Results for query: "${query}"`);
    }, delayMs);

    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timeout);
        const err = new Error("AbortError");
        err.name = "AbortError";
        reject(err);
      });
    }
  });
}

// Simulate AbortController Race Prevention
let controller = null;

async function onUserKeystroke(query, delayMs) {
  if (controller) controller.abort(); // Cancel previous request!
  controller = new AbortController();

  try {
    const data = await simulateSearch(query, delayMs, controller.signal);
    currentUiState = data;
    console.log("[UI Rendered]:", currentUiState);
  } catch (err) {
    if (err.name === "AbortError") {
      console.log(`[Canceled stale request for "${query}"]`);
      return;
    }
    console.error("Search Error:", err.message);
  }
}

// User types "re" (slow, takes 50ms), then types "react" (fast, takes 20ms)
onUserKeystroke("re", 50);
setTimeout(() => onUserKeystroke("react", 20), 10);

console.log("\n=== 3. PREDICTION 1: PROMISE.ALL VS PROMISE.ALLSETTLED ===");

const p1 = Promise.resolve({ widget: "UserProfile", data: "Sunny" });
const p2 = Promise.reject(new Error("Notification Service 503"));

// Promise.all (All or Nothing)
Promise.all([p1, p2])
  .then(() => console.log("Promise.all passed"))
  .catch((e) => console.log("Promise.all rejected on first failure:", e.message));

// Promise.allSettled (Partial Success Aggregation)
Promise.allSettled([p1, p2]).then((results) => {
  console.log("Promise.allSettled Results Summary:");
  results.forEach((r, idx) => {
    if (r.status === "fulfilled") {
      console.log(`  [Widget ${idx + 1}] Rendered ->`, r.value.widget);
    } else {
      console.log(`  [Widget ${idx + 1}] Failed with retry button ->`, r.reason.message);
    }
  });
});

console.log("\n=== 4. PRACTICAL ARCHITECTURE: RESILIENT RETRY WITH BACKOFF & JITTER ===");

async function fetchWithExponentialBackoff(fetcher, maxRetries = 3, baseDelay = 100) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetcher(attempt);
    } catch (err) {
      if (attempt === maxRetries) {
        console.log(`All ${maxRetries} retry attempts exhausted. Propagating fatal error.`);
        throw err;
      }

      // Exponential delay with jitter: base * 2^attempt + jitter
      const jitter = Math.random() * 30;
      const delay = baseDelay * Math.pow(2, attempt) + jitter;
      console.log(`[Attempt ${attempt + 1} Failed]: ${err.message}. Retrying in ${delay.toFixed(0)}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Test Transient Failure that succeeds on 3rd attempt
let attemptCount = 0;
const transientService = async () => {
  attemptCount++;
  if (attemptCount < 3) {
    throw new Error("HTTP 503 Service Unavailable");
  }
  return { status: 200, payload: "Payment processed successfully" };
};

setTimeout(async () => {
  console.log("\nInitiating Resilient Retry Call...");
  const result = await fetchWithExponentialBackoff(transientService, 3, 50);
  console.log("Final Operation Result:", result);
}, 100);
