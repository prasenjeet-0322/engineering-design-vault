/**
 * KPI 13 — Part 02: Error Handling with try / catch / finally in async Functions
 * Demonstrates:
 * 1. Gotcha: `return await` inside try/catch vs Raw Promise Return (Bypassing Catch)
 * 2. Gotcha: Silent Error Swallowing Returning Undefined vs Explicit Fallbacks
 * 3. Prediction 1: Capturing Synchronous Runtime Errors Alongside Async Rejections
 * 4. Prediction 2: finally Block Return Override Trap
 * 5. Practical Architecture: Go-Style Result Tuple Adapter (toAsync) & Resilient Pipeline
 */

"use strict";

console.log("=== 1. GOTCHA: RETURN AWAIT INSIDE TRY/CATCH VS RAW PROMISE RETURN ===");

function flakyNetworkCall() {
  return Promise.reject(new Error("Connection Reset by Peer (ECONNRESET)"));
}

// ❌ Bug: Omitting await inside try/catch bypasses local catch!
async function buggyBypassHandler() {
  try {
    return flakyNetworkCall(); // Missing await!
  } catch (err) {
    console.log("This will NEVER run!");
    return "Recovered locally";
  }
}

buggyBypassHandler().catch((err) => {
  console.log("  🚨 [Bypassed Local Catch]: Rejection escaped to caller:", err.message);
});

// ✅ Fix: Using `return await` inside try/catch
async function properCatchHandler() {
  try {
    return await flakyNetworkCall(); // 🟢 Correctly awaited inside try block
  } catch (err) {
    console.log("  🛡️ [Properly Caught Locally]:", err.message);
    return { status: "FALLBACK_GUEST", name: "Guest User" };
  }
}

properCatchHandler().then((res) => {
  console.log("  ✅ [Recovered Safely]:", res);
});

console.log("\n=== 2. GOTCHA: SILENT UNDEFINED ERROR SWALLOWING VS EXPLICIT FALLBACK ===");

async function swallowErrorBug() {
  try {
    throw new Error("Disk Full");
  } catch (err) {
    console.log("  ⚠️ [Logged Error but Omitted Return]:", err.message);
    // Implicitly returns undefined!
  }
}

swallowErrorBug().then((val) => {
  console.log("  ❌ [Downstream Result of Swallowing]: Value is", val); // undefined
});

console.log("\n=== 3. FINALLY BLOCK RETURN OVERRIDE HAZARD ===");

async function testFinallyOverride() {
  try {
    throw new Error("Original Network Error");
  } catch (err) {
    return "Recovered Value from Catch";
  } finally {
    return "💥 OVERRIDDEN IN FINALLY"; // Overrides everything!
  }
}

testFinallyOverride().then((val) => {
  console.log("  ⚠️ [Finally Override Output]:", val);
});

console.log("\n=== 4. PRACTICAL ARCHITECTURE: GO-STYLE RESULT TUPLE HELPER ===");

/**
 * Result Tuple Helper: [error, data]
 */
async function toAsync(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}

async function executeBusinessWorkflow() {
  console.log("\nExecuting Business Workflow with Result Tuples:");

  const fetchSuccess = Promise.resolve({ userId: 101, plan: "PRO" });
  const [err1, user] = await toAsync(fetchSuccess);
  if (err1) {
    console.error("User fetch failed:", err1);
    return;
  }
  console.log("  👤 User Loaded:", user);

  const fetchFail = Promise.reject(new Error("Billing Service 503"));
  const [err2, billing] = await toAsync(fetchFail);
  if (err2) {
    console.log("  ℹ️ [Non-Critical Handled]: Billing unavailable, using Free tier defaults:", err2.message);
  }
}

executeBusinessWorkflow();
