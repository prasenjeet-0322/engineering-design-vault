/**
 * KPI 22 — Part 03: Promise Chaining, Value Propagation, Error Propagation & Promise Combinators
 * Demonstrates:
 * 1. Gotcha: `Promise.all()` Fail-Fast Behavior & Background Task Continuation
 * 2. Gotcha: `Promise.race()` vs `Promise.any()` (Settling vs Fulfillment Semantics)
 * 3. Prediction 1: `.finally()` Value Pass-Through vs Exception Override
 * 4. Prediction 2: `Promise.allSettled()` Resilient Multi-Widget Aggregation
 * 5. Practical Architecture: Standalone Multi-Source Resilient Dashboard Aggregator
 */

"use strict";

console.log("=== 1. GOTCHA: PROMISE.ALL FAIL-FAST VS SIBLING EXECUTION ===");

let siblingTaskCompleted = false;

const fastFailTask = new Promise((_, reject) => {
  setTimeout(() => reject(new Error("FAST_DATABASE_ERROR")), 20);
});

const slowHeavyTask = new Promise((resolve) => {
  setTimeout(() => {
    siblingTaskCompleted = true;
    console.log("  ⚠️ [Sibling Alert]: slowHeavyTask finished in background at 60ms!");
    resolve("HEAVY_DATA");
  }, 60);
});

Promise.all([fastFailTask, slowHeavyTask])
  .then(() => console.log("  ❌ This will never run"))
  .catch((err) => {
    console.log("  ✅ Promise.all caught fast error at 20ms:", err.message);
  });

console.log("\n=== 2. GOTCHA: PROMISE.RACE VS PROMISE.ANY ===");

const cdnMirrorFast404 = Promise.reject(new Error("CDN Mirror 1 (404 Not Found in 10ms)"));
const cdnMirrorSlow200 = new Promise((res) => setTimeout(() => res("CDN Mirror 2 (Content Loaded)"), 40));

// Race: Fast rejection wins
Promise.race([cdnMirrorFast404, cdnMirrorSlow200])
  .catch((err) => console.log("  🛑 Promise.race Failed on first settlement:", err.message));

// Any: Ignores fast rejection, waits for first success
Promise.any([cdnMirrorFast404, cdnMirrorSlow200])
  .then((data) => console.log("  ✅ Promise.any Succeeded on first fulfillment:", data));

console.log("\n=== 3. PREDICTIONS: .FINALLY() PASS-THROUGH & AGGREGATE ERROR ===");

Promise.resolve("ORIGINAL_TOKEN")
  .finally(() => {
    return "IGNORED_OVERRIDE"; // Ignored in .finally()
  })
  .then((val) => console.log("  ✅ .finally() Passed Value Through:", val));

Promise.any([Promise.reject("Err A"), Promise.reject("Err B")])
  .catch((err) => {
    console.log("  ✅ Promise.any All Rejected Threw:", err.name, "| Errors count:", err.errors.length);
  });

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE RESILIENT DASHBOARD AGGREGATOR ===");

async function loadEnterpriseDashboard() {
  const fetchUser = () => Promise.resolve({ id: 1, name: "Sunny", role: "ADMIN" });
  const fetchRevenue = () => Promise.reject(new Error("Revenue Service 503 Outage"));
  const fetchServerMetrics = () => Promise.resolve({ cpuUsage: "12%", uptimeHours: 720 });

  // 1. Mandatory Core User
  const user = await fetchUser();

  // 2. Resilient Independent Widget Loading
  const [revenueResult, metricsResult] = await Promise.allSettled([
    fetchRevenue(),
    fetchServerMetrics()
  ]);

  return {
    user,
    revenue: revenueResult.status === "fulfilled" ? revenueResult.value : { fallback: true, message: "Widget Unavailable" },
    metrics: metricsResult.status === "fulfilled" ? metricsResult.value : null
  };
}

setTimeout(async () => {
  const dashboard = await loadEnterpriseDashboard();
  console.log("  📊 Aggregated Dashboard Result:", JSON.stringify(dashboard, null, 2));
  console.log("\n  🎉 [Promise Chaining, Value Propagation & Combinators Verification Completed Successfully!]");
}, 80);
