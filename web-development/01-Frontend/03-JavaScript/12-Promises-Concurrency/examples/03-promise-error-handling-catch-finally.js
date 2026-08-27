/**
 * KPI 12 — Part 03: .catch(), finally(), Rejection Propagation & Error Recovery
 * Demonstrates:
 * 1. Gotcha: Accidental `undefined` Error Recovery vs Explicit Fallbacks
 * 2. Gotcha: .finally() Value Neutrality vs Thrown Exception Override
 * 3. Prediction 1: Error Bubbling Skipping Intermediate .then() Handlers
 * 4. Prediction 2: Rethrowing from .catch() to Preserve Rejection State
 * 5. Practical Architecture: Standalone Resilient Pipeline with Local Recovery
 */

"use strict";

console.log("=== 1. GOTCHA: SILENT UNDEFINED RECOVERY VS EXPLICIT FALLBACK ===");

// ❌ Bug: Silent undefined recovery causes downstream TypeError
Promise.reject(new Error("Database Connection Timeout"))
  .catch((err) => {
    console.log("  ⚠️ [Logged Error]:", err.message);
    // Omitting return causes implicit `return undefined` (recovering to FULFILLED!)
  })
  .then((user) => {
    console.log("  ❌ [Downstream Crash]: Received user =", user); // undefined
  });

// ✅ Fix: Return explicit valid fallback or rethrow
Promise.reject(new Error("Primary Cache Miss"))
  .catch((err) => {
    console.log("  ℹ️ [Handled Gracefully]: Returning Guest Fallback");
    return { id: "GUEST-01", name: "Guest User" }; // 🟢 Explicit fallback recovery
  })
  .then((user) => {
    console.log("  ✅ [Downstream Success]: Recovered user name =", user.name);
  });

console.log("\n=== 2. GOTCHA: .finally() VALUE NEUTRALITY VS THROW OVERRIDE ===");

// Value Transparency (Return value is ignored)
Promise.resolve("Protected Master Payload")
  .finally(() => {
    console.log("  🧹 [Finally 1 Cleanup]: Executing teardown logic");
    return "Ignored Value"; // 💥 Has no effect on downstream value!
  })
  .then((val) => {
    console.log("  ✅ [Transparent Value Preserved]:", val); // "Protected Master Payload"
  });

// Exception Override (Thrown error replaces original outcome)
Promise.resolve("Initial Good State")
  .finally(() => {
    console.log("  🧹 [Finally 2 Cleanup]: Throwing cleanup failure");
    throw new Error("Teardown Lockfile Error"); // 💥 Overrides success!
  })
  .then(() => {
    console.log("This will never run!");
  })
  .catch((err) => {
    console.log("  ❌ [Override Caught]:", err.message); // "Teardown Lockfile Error"
  });

console.log("\n=== 3. ASYNC ERROR BUBBLING & HANDLER SKIPPING ===");

Promise.resolve("Start Data")
  .then((d) => {
    console.log(`  [Step 1]: Processed ${d}`);
    throw new Error("Validation Error at Step 2");
  })
  .then((d) => {
    console.log("  [Step 3]: This line is SKIPPED!");
  })
  .then((d) => {
    console.log("  [Step 4]: This line is also SKIPPED!");
  })
  .catch((err) => {
    console.log("  🛡️ [Central Catch Caught]:", err.message);
  });

console.log("\n=== 4. RETHROWING REJECTIONS IN INTERMEDIATE LAYERS ===");

function serviceLayerFetch() {
  return Promise.reject(new Error("Stripe Charge Declined")).catch((err) => {
    console.log("  📊 [Service Telemetry Logged]:", err.message);
    throw err; // 🟢 Re-throw so caller UI knows it failed!
  });
}

serviceLayerFetch()
  .then(() => console.log("Checkout complete"))
  .catch((err) => {
    console.log("  🚨 [UI Layer Handled]: Rendered Payment Error Banner:", err.message);
  });

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-TIER RESILIENT PIPELINE ===");

class ResilientDataPipeline {
  static async execute(primaryFetcher, fallbackFetcher) {
    let isLoading = true;
    console.log("\n[Pipeline Started]: isLoading = true");

    return primaryFetcher()
      .catch((primaryErr) => {
        console.warn("  ⚠️ Primary fetcher failed; triggering fallback fetcher...");
        return fallbackFetcher();
      })
      .then((data) => {
        console.log("  🎉 Data pipeline resolved successfully with:", data);
        return data;
      })
      .catch((fatalErr) => {
        console.error("  💥 Fatal: Both primary and fallback failed!", fatalErr.message);
        throw fatalErr;
      })
      .finally(() => {
        isLoading = false;
        console.log("[Pipeline Finished]: isLoading = false (Guaranteed Cleanup)");
      });
  }
}

setTimeout(() => {
  console.log("\nTesting ResilientDataPipeline:");
  const failPrimary = () => Promise.reject(new Error("Primary Database Offline"));
  const succeedFallback = () => Promise.resolve({ source: "REDIS_BACKUP_CACHE", version: "1.2" });

  ResilientDataPipeline.execute(failPrimary, succeedFallback);
}, 60);
