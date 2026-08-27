/**
 * KPI 10 — Part 06: Testing Error Paths & Failure Scenarios
 * Demonstrates:
 * 1. Gotcha: Unawaited Async Rejection vs Awaited Validation
 * 2. Gotcha: State Invariant Verification (Preventing Stuck Loading Spinners)
 * 3. Prediction 1: Synchronous vs Asynchronous Error Assertions
 * 4. Prediction 2: Testing Retry State Machine Transitions
 * 5. Practical Architecture: Standalone Error Test Runner Engine
 */

"use strict";

console.log("=== 1. MINI TEST RUNNER HARNESS ===");

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async test(description, testFn) {
    try {
      await testFn();
      this.passed++;
      console.log(`  ✅ PASS: ${description}`);
    } catch (err) {
      this.failed++;
      console.error(`  ❌ FAIL: ${description}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  summary() {
    console.log(`\nTest Suite Completed: ${this.passed} Passed, ${this.failed} Failed.`);
  }
}

const runner = new TestRunner();

// Custom Assertion Helpers
function expectSync(fn) {
  return {
    toThrow(expectedErrorType) {
      let threw = false;
      try {
        fn();
      } catch (err) {
        threw = true;
        if (expectedErrorType && !(err instanceof expectedErrorType)) {
          throw new Error(`Expected error instance of ${expectedErrorType.name}, but got ${err.name}`);
        }
      }
      if (!threw) {
        throw new Error("Expected function to throw, but it executed without error.");
      }
    }
  };
}

function expectAsync(promise) {
  return {
    rejects: {
      async toThrow(expectedErrorType) {
        let rejected = false;
        try {
          await promise;
        } catch (err) {
          rejected = true;
          if (expectedErrorType && !(err instanceof expectedErrorType)) {
            throw new Error(`Expected async rejection of ${expectedErrorType.name}, but got ${err.name}`);
          }
        }
        if (!rejected) {
          throw new Error("Expected Promise to reject, but it fulfilled successfully.");
        }
      }
    }
  };
}

console.log("\n=== 2. DOMAIN CLASSES UNDER TEST ===");

class ValidationError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "ValidationError";
  }
}

class NetworkError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "NetworkError";
  }
}

function calculateTax(subtotal) {
  if (typeof subtotal !== "number" || subtotal < 0) {
    throw new ValidationError("Subtotal must be positive non-zero number");
  }
  return subtotal * 0.1;
}

async function fetchUserProfile(userId) {
  if (!userId) {
    throw new ValidationError("User ID required");
  }
  if (userId === "simulate-network-fail") {
    throw new NetworkError("Connection Dropped");
  }
  return { id: userId, name: "Sunny" };
}

console.log("\n=== 3. EXECUTING ASYNC & SYNC FAILURE TESTS ===");

async function runAllTests() {
  // Test 1: Synchronous Thrown Exception
  await runner.test("calculateTax throws ValidationError on negative subtotal", () => {
    expectSync(() => calculateTax(-50)).toThrow(ValidationError);
  });

  // Test 2: Synchronous Success Path
  await runner.test("calculateTax returns correct 10% tax on positive subtotal", () => {
    const tax = calculateTax(100);
    if (tax !== 10) throw new Error(`Expected 10, got ${tax}`);
  });

  // Test 3: Asynchronous Rejection Assertion
  await runner.test("fetchUserProfile rejects with NetworkError on network drop", async () => {
    await expectAsync(fetchUserProfile("simulate-network-fail")).rejects.toThrow(NetworkError);
  });

  // Test 4: Asynchronous Rejection with Missing ID
  await runner.test("fetchUserProfile rejects with ValidationError on empty ID", async () => {
    await expectAsync(fetchUserProfile("")).rejects.toThrow(ValidationError);
  });

  // Test 5: State Machine State Reset Verification (Preventing Stuck Spinners)
  await runner.test("state machine guarantees loading=false and records error on API crash", async () => {
    const state = { loading: false, error: null, data: null };

    // Action with finally block guarantee
    async function loadData() {
      state.loading = true;
      state.error = null;
      try {
        state.data = await fetchUserProfile("simulate-network-fail");
      } catch (err) {
        state.error = err.message;
      } finally {
        state.loading = false; // 🟢 Invariant Guarantee
      }
    }

    await loadData();

    if (state.loading !== false) throw new Error("Invariant failed: loading state remained true!");
    if (state.error !== "Connection Dropped") throw new Error(`Expected error message, got ${state.error}`);
    if (state.data !== null) throw new Error("Data should remain null on failure");
  });

  // Test 6: Retry State Recovery Workflow
  await runner.test("retry mechanism recovers from transient failure on attempt 2", async () => {
    let attempts = 0;
    const flakyApi = async () => {
      attempts++;
      if (attempts === 1) throw new NetworkError("Transient 503");
      return { status: 200, data: "Success" };
    };

    let result = null;
    for (let i = 0; i < 2; i++) {
      try {
        result = await flakyApi();
        break;
      } catch (e) {
        // Retry next attempt
      }
    }

    if (attempts !== 2) throw new Error(`Expected 2 attempts, took ${attempts}`);
    if (result.data !== "Success") throw new Error("Expected successful recovery on attempt 2");
  });

  runner.summary();
}

runAllTests();
