/**
 * KPI 12 — Part 07: Real-World Promise Patterns, Error Architecture, Anti-Patterns & Telemetry
 * Demonstrates:
 * 1. Gotcha: Preserving Root Cause via ES2022 Error.cause
 * 2. Gotcha: Guarding Fire-and-Forget Promises Against Rejection Leaks
 * 3. Prediction 1: Error Bubbling Skipping Intermediate .then() Handlers
 * 4. Prediction 2: Multi-Tier Layered Error Recovery
 * 5. Practical Architecture: Resilient Exponential Backoff Retry with Jitter & Telemetry
 */

"use strict";

console.log("=== 1. PRESERVING ROOT CAUSE VIA ES2022 ERROR.CAUSE ===");

class UserDataDomainError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "UserDataDomainError";
  }
}

function fetchRawUserData() {
  return Promise.reject(new TypeError("Failed to fetch: DNS_PROBE_FINISHED_NXDOMAIN"));
}

fetchRawUserData()
  .catch((networkErr) => {
    // 🟢 Wrap in application domain error preserving original cause
    throw new UserDataDomainError("User profile service unavailable", networkErr);
  })
  .catch((domainErr) => {
    console.log("  🏢 [Domain Error Caught]:", domainErr.message);
    console.log("  🔍 [Preserved Root Cause]:", domainErr.cause.name, "->", domainErr.cause.message);
  });

console.log("\n=== 2. GUARDING FIRE-AND-FORGET BACKGROUND PROMISES ===");

function trackBackgroundTelemetry(payload) {
  return Promise.reject(new Error("Telemetry Ingest Rate Limited (HTTP 429)"));
}

// 🟢 Fire-and-forget guarded with catch
void trackBackgroundTelemetry({ action: "CLICK_CHECKOUT" }).catch((err) => {
  console.log("  📊 [Guarded Telemetry Rejection Handled]:", err.message);
});

console.log("\n=== 3. ASYNC ERROR BUBBLING THROUGH PIPELINE ===");

Promise.resolve("Input Data")
  .then((data) => {
    console.log("  [Step 1]: Validated", data);
    throw new Error("Validation Failed at Step 2");
  })
  .then(() => console.log("  [Step 3]: (Skipped)"))
  .then(() => console.log("  [Step 4]: (Skipped)"))
  .catch((err) => {
    console.log("  🛡️ [Pipeline Catch Caught]:", err.message);
  });

console.log("\n=== 4. MULTI-TIER LAYERED ERROR RECOVERY ===");

function serviceLayer() {
  return Promise.reject(new Error("Primary Cache Miss")).catch((err) => {
    console.log("  ℹ️ [Service Layer]: Handled with Guest Fallback");
    return { id: "GUEST-USER", role: "ANONYMOUS" }; // 🟢 Local recovery!
  });
}

serviceLayer().then((user) => {
  console.log("  ✅ [UI Layer Rendered Successfully]:", user);
});

console.log("\n=== 5. PRACTICAL ARCHITECTURE: RETRY WITH EXPONENTIAL BACKOFF & JITTER ===");

class ResilientClient {
  static async fetchWithRetry(fn, retries = 2, delayMs = 30) {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) {
        console.error("  💥 [Retries Exhausted]: Escalating error...");
        throw err;
      }
      const jitter = Math.random() * 20;
      const totalWait = delayMs + jitter;
      console.warn(`  ⚠️ [Transient Failure]: Retrying in ${totalWait.toFixed(1)}ms... (Remaining retries: ${retries})`);

      await new Promise((resolve) => setTimeout(resolve, totalWait));
      return ResilientClient.fetchWithRetry(fn, retries - 1, delayMs * 2);
    }
  }
}

setTimeout(() => {
  console.log("\nTesting ResilientClient with Flaky Endpoint:");
  let attempts = 0;
  const flakyEndpoint = () =>
    new Promise((resolve, reject) => {
      attempts++;
      if (attempts < 3) {
        reject(new Error(`Server 500 Internal Error (Attempt ${attempts})`));
      } else {
        resolve({ status: 200, data: "Success on attempt 3" });
      }
    });

  ResilientClient.fetchWithRetry(flakyEndpoint, 3, 20)
    .then((res) => {
      console.log("  🎉 [Resilient Pipeline Succeeded]:", res);
    })
    .catch((err) => {
      console.error("  ❌ [Pipeline Failed Permanently]:", err.message);
    });
}, 50);
