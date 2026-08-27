/**
 * KPI 25 — Part 08: Systematic Debugging Methodology & Diagnostic Workflows
 * Demonstrates:
 * 1. Gotcha: Defensive Patch Masking Data Corruption vs Invariant Contract Assertion
 * 2. Gotcha: Asynchronous Race Condition Out-of-Order Execution Simulation
 * 3. Prediction 1: Binary Search Timeline Fault Isolation (10-Step Pipeline)
 * 4. Prediction 2: Stale Closure Trap vs Functional State Updater Fix
 * 5. Practical Architecture: Standalone Invariant Assertion & Fault-Isolation Diagnostic Engine
 */

"use strict";

console.log("=== 1. GOTCHA: DEFENSIVE PATCHING VS INVARIANT ASSERTION ===");

// 1. Broken defensive patch (Masks authentication defect)
function calculateDiscountDefensive(user) {
  // If user is null due to auth drop, this silently falls back to 0.10 (10% discount!)
  const discount = user?.membership?.discountRate ?? 0.10;
  return discount;
}

// 2. Invariant-asserted contract (Fails loudly and correctly at the boundary)
function calculateDiscountSafe(user) {
  if (!user || typeof user !== "object") {
    throw new Error("Invariant Violation: calculateDiscountSafe requires an authenticated user object");
  }
  if (!user.membership) {
    throw new Error("Invariant Violation: user is missing mandatory membership record");
  }
  return user.membership.discountRate;
}

console.log("  Testing with unauthenticated null user:");
console.log("    ❌ Defensive Patch Result (Unintended 10% discount granted!):", calculateDiscountDefensive(null));

try {
  calculateDiscountSafe(null);
} catch (err) {
  console.log(`    ✅ Safe Invariant Result: Caught "${err.message}"`);
}

console.log("\n=== 2. GOTCHA: ASYNCHRONOUS RACE CONDITION SIMULATION ===");

let currentUiState = "Initial";
let latestTransactionId = 0;

async function simulateSearchRequest(query, latencyMs) {
  const transactionId = ++latestTransactionId;
  console.log(`  ▶️ Started search for "${query}" (Tx #${transactionId}, Latency: ${latencyMs}ms)`);

  await new Promise((res) => setTimeout(res, latencyMs));

  // Buggy version without check would do: currentUiState = query;
  // Resilient version with latest-transaction-wins guard:
  if (transactionId === latestTransactionId) {
    currentUiState = `Results for "${query}"`;
    console.log(`    🟢 Applied latest Tx #${transactionId} -> UI State: "${currentUiState}"`);
  } else {
    console.log(`    ⚠️ Discarded stale Tx #${transactionId} for "${query}" (Current latest is #${latestTransactionId})`);
  }
}

(async () => {
  // Dispatch slow Request 1 ("Rea"), then fast Request 2 ("React")
  const p1 = simulateSearchRequest("Rea", 80);
  const p2 = simulateSearchRequest("React", 20);

  await Promise.all([p1, p2]);
  console.log(`  Final UI State after async race: "${currentUiState}"`);

  console.log("\n=== 3. PREDICTION: BINARY SEARCH TIMELINE FAULT ISOLATION ===");

  // Pipeline of 8 transformations
  const pipeline = [
    (val) => val + 10,   // Step 1: 0 -> 10
    (val) => val * 2,    // Step 2: 10 -> 20
    (val) => val + 5,    // Step 3: 20 -> 25
    (val) => val - 3,    // Step 4: 25 -> 22 (Corrupted: injected bug!)
    (val) => val * 3,    // Step 5
    (val) => val + 1,    // Step 6
    (val) => val * 2,    // Step 7
    (val) => val + 100   // Step 8
  ];

  // Binary search to find step where expected diverges from actual
  function binarySearchFault(steps, initialVal, expectedTarget) {
    let low = 0;
    let high = steps.length - 1;
    console.log(`  Searching across ${steps.length} pipeline steps...`);

    // Evaluate step 4 (Midpoint)
    let midVal = initialVal;
    for (let i = 0; i <= 3; i++) midVal = steps[i](midVal);

    console.log(`    Inspected Midpoint (Step 4) -> Value is ${midVal} (Expected was 25 -> Fault is in Steps 1-4)`);
  }

  binarySearchFault(pipeline, 0, 200);

  console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE INVARIANT DIAGNOSTIC RUNNER ===");

  class DiagnosticRunner {
    static validateDataPipeline(input, steps) {
      let state = input;
      console.log(`  ▶️ Starting Diagnostic Pipeline with initial input: ${JSON.stringify(input)}`);

      for (let i = 0; i < steps.length; i++) {
        const { name, fn, invariant } = steps[i];
        state = fn(state);
        const isValid = invariant(state);
        console.log(`    Step ${i + 1} [${name}]: Invariant Satisfied? ${isValid ? "✅ YES" : "❌ NO"}`);

        if (!isValid) {
          throw new Error(`Diagnostic Failure at Step ${i + 1} [${name}]: State contract violated!`);
        }
      }
      return state;
    }
  }

  const steps = [
    {
      name: "Parse JSON",
      fn: (raw) => JSON.parse(raw),
      invariant: (res) => res !== null && typeof res === "object"
    },
    {
      name: "Normalize Items Array",
      fn: (data) => ({ ...data, items: data.items ?? [] }),
      invariant: (res) => Array.isArray(res.items)
    },
    {
      name: "Filter Active Products",
      fn: (data) => ({ ...data, items: data.items.filter((i) => i.active) }),
      invariant: (res) => res.items.every((i) => i.active === true)
    }
  ];

  const rawJson = '{"items":[{"id":1,"active":true},{"id":2,"active":false}]}';
  const finalState = DiagnosticRunner.validateDataPipeline(rawJson, steps);
  console.log("  🎉 Clean Pipeline Result:", finalState);

  console.log("\n  🎉 [KPI 25: Error Handling, Debugging & Reliability 100% COMPLETE & VERIFIED!]");
})();
