/**
 * KPI 22 — Part 02: Callbacks, Callback Hell & Promises Lifecycle
 * Demonstrates:
 * 1. Gotcha: Synchronous Executor Execution vs Asynchronous Microtask Reaction Scheduling
 * 2. Gotcha: The Settling Invariant (Resolve followed by Reject is ignored)
 * 3. Prediction 1: Explicit Value Propagation through `.then()` Chains
 * 4. Prediction 2: Error Recovery in `.catch()` Allowing Downstream Continuation
 * 5. Practical Architecture: Standalone Promise-based User Data Pipeline with `.finally()`
 */

"use strict";

console.log("=== 1. GOTCHA: SYNCHRONOUS EXECUTOR VS MICROTASK REACTION ===");

console.log("  [Step 1]: Before new Promise");

new Promise((resolve) => {
  console.log("  [Step 2]: Inside Promise Executor (Runs Synchronously on Call Stack!)");
  resolve("EXECUTOR_PAYLOAD");
  console.log("  [Step 3]: After resolve() inside Executor");
}).then((data) => {
  console.log("  [Step 5]: Inside .then() reaction (Runs Asynchronously in Microtask Queue!):", data);
});

console.log("  [Step 4]: After new Promise definition");

console.log("\n=== 2. GOTCHA: THE PROMISE SETTLING INVARIANT ===");

const immutablePromise = new Promise((resolve, reject) => {
  resolve("INITIAL_FULFILLMENT_WINS");
  reject(new Error("LATER_REJECTION_IGNORED"));
  resolve("LATER_FULFILLMENT_IGNORED");
});

immutablePromise
  .then((val) => console.log("  ✅ Promise Settled Immutable Value:", val))
  .catch((err) => console.error("  ❌ This will never run:", err.message));

console.log("\n=== 3. PREDICTIONS: VALUE PROPAGATION & .CATCH() RECOVERY ===");

// Value propagation pipeline
Promise.resolve(10)
  .then((x) => x * 2) // 20
  .then((x) => x + 5) // 25
  .then((x) => console.log("  Pipeline Arithmetic Result:", x));

// Error recovery pipeline
Promise.reject(new Error("Database Connection Failed"))
  .catch((err) => {
    console.log("  ⚠️ [Error Recovered in .catch()]:", err.message);
    return { fallback: true, source: "MEMORY_CACHE" }; // Recovery payload
  })
  .then((data) => {
    console.log("  ✅ Downstream .then() received recovery data:", data);
  });

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE PROMISE DATA PIPELINE ===");

function simulateApiRequest(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId <= 0) reject(new Error(`Invalid User ID: ${userId}`));
      else resolve({ id: userId, name: "Sunny", email: "sunny@vault.com" });
    }, 50);
  });
}

function processUserData(userId) {
  console.log(`    ⏳ [Pipeline Initiated]: Fetching data for User #${userId}...`);

  return simulateApiRequest(userId)
    .then((user) => {
      console.log("    📦 [User Received]:", user.name);
      return { ...user, token: "JWT_" + Date.now() };
    })
    .catch((err) => {
      console.warn("    ⚠️ [Pipeline Error Caught]:", err.message);
      return { id: 0, name: "Guest", token: null };
    })
    .finally(() => {
      console.log("    🧹 [Pipeline Cleanup]: Closing network socket & clearing loading state.");
    });
}

processUserData(101).then((finalResult) => {
  console.log("  Final Pipeline Result:", finalResult);
  console.log("\n  🎉 [Callbacks, Callback Hell & Promises Lifecycle Verification Completed Successfully!]");
});
