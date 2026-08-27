/**
 * KPI 25 — Part 04: Async Errors, Promise Rejections & `async/await`
 * Demonstrates:
 * 1. Gotcha: return promise vs return await promise inside try/catch
 * 2. Gotcha: The Floating Promise (Missing await) False Success Trap
 * 3. Prediction 1: Promise.all Fail-Fast vs Promise.allSettled Resilience
 * 4. Prediction 2: Promise .catch() Swallowing and Trailing .then() Execution
 * 5. Practical Architecture: Standalone Async Concurrency Engine with Timeout & Settled Partitioning
 */

"use strict";

console.log("=== 1. GOTCHA: RETURN PROMISE VS RETURN AWAIT PROMISE IN TRY/CATCH ===");

async function failingAsyncOp() {
  return Promise.reject(new Error("Database connection dropped"));
}

// Case A: return without await (Bypasses catch block!)
async function testReturnWithoutAwait() {
  try {
    return failingAsyncOp();
  } catch (err) {
    return "Handled locally in Case A"; // 💥 Never reached!
  }
}

// Case B: return with await (Caught locally!)
async function testReturnWithAwait() {
  try {
    return await failingAsyncOp();
  } catch (err) {
    return `✅ Caught locally in Case B: "${err.message}"`;
  }
}

(async () => {
  // Test Case A
  try {
    await testReturnWithoutAwait();
  } catch (err) {
    console.log(`  ❌ Case A (No await) escaped local catch -> Caught in outer boundary: "${err.message}"`);
  }

  // Test Case B
  const resB = await testReturnWithAwait();
  console.log(`  ${resB}`);

  console.log("\n=== 2. GOTCHA: FLOATING PROMISE FALSE SUCCESS SIMULATION ===");

  async function asyncMutation() {
    return new Promise((_, reject) => setTimeout(() => reject(new Error("Credit Card Declined")), 20));
  }

  let uiStatus = "IDLE";

  // Leaky implementation without await
  function executeCheckout() {
    asyncMutation().catch((e) => {
      // Rejection handled late!
    });
    uiStatus = "ORDER_CONFIRMED"; // 💥 Executed synchronously before mutation settled!
  }

  executeCheckout();
  console.log(`  ❌ UI Status immediately after un-awaited checkout: "${uiStatus}" (False Success!)`);

  console.log("\n=== 3. PREDICTION: PROMISE.ALL VS PROMISE.ALLSETTLED ===");

  const pSuccess1 = Promise.resolve("Widget 1 Data");
  const pFail2 = Promise.reject(new Error("Widget 2 API 503"));
  const pSuccess3 = Promise.resolve("Widget 3 Data");

  // 1. Promise.all (Fail-Fast)
  try {
    await Promise.all([pSuccess1, pFail2, pSuccess3]);
  } catch (allErr) {
    console.log(`  ⚠️ Promise.all rejected immediately on first failure: "${allErr.message}"`);
  }

  // 2. Promise.allSettled (Partial Resilience)
  const settledResults = await Promise.allSettled([pSuccess1, pFail2, pSuccess3]);
  console.log("  🟢 Promise.allSettled Partitioned Results:");
  settledResults.forEach((res, i) => {
    if (res.status === "fulfilled") {
      console.log(`     Widget ${i + 1}: [FULFILLED] -> Value: "${res.value}"`);
    } else {
      console.log(`     Widget ${i + 1}: [REJECTED] -> Reason: "${res.reason.message}"`);
    }
  });

  console.log("\n=== 4. PRACTICAL ARCHITECTURE: ASYNC CONCURRENCY ENGINE WITH TIMEOUT ===");

  class AsyncConcurrencyEngine {
    static async withTimeout(promise, ms, operationName) {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Timeout: "${operationName}" exceeded SLA limit of ${ms}ms`));
        }, ms);
      });

      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        clearTimeout(timeoutId); // Guaranteed timer cleanup
      }
    }
  }

  // Test timeout engine
  const slowTask = new Promise((resolve) => setTimeout(() => resolve("Slow Data"), 150));

  try {
    await AsyncConcurrencyEngine.withTimeout(slowTask, 50, "Analytics Report Generation");
  } catch (timeoutErr) {
    console.log(`  ⏱️ Handled Timeout Exception: "${timeoutErr.message}"`);
  }

  console.log("\n  🎉 [Async Errors, Promise Rejections & async/await Verification Completed Successfully!]");
})();
