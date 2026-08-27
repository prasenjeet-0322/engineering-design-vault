/**
 * KPI 10 — Part 10: Testing Error Paths & Debugging Practice
 * Demonstrates:
 * 1. Gotcha: Post-Failure State Assertion (Eliminating Stuck Loading Spinners)
 * 2. Gotcha: Deferred Promise Concurrency Controller (Race Condition Testing)
 * 3. Prediction 1: State Machine Transition & Retry Sequence Assertion
 * 4. Prediction 2: Teardown Cleanup & Duplicate Listener Leak Verification
 * 5. Practical Architecture: Standalone Concurrency & Chaos Test Runner
 */

"use strict";

console.log("=== 1. MINI TEST RUNNER HARNESS ===");

class TestHarness {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async run(name, fn) {
    try {
      await fn();
      this.passed++;
      console.log(`  ✅ PASS: ${name}`);
    } catch (err) {
      this.failed++;
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
    }
  }

  report() {
    console.log(`\n========================================`);
    console.log(`Test Execution Summary: ${this.passed} Passed, ${this.failed} Failed.`);
    console.log(`========================================\n`);
  }
}

const harness = new TestHarness();

// Deferred Promise Factory for Concurrency Control
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

console.log("\n=== 2. RUNNING PRACTICAL FAILURE & CONCURRENCY TESTS ===");

async function executeTestSuite() {
  // Test 1: Post-Failure State Invariant Guarantee
  await harness.run("Guarantees isLoading resets to false on API crash", async () => {
    const state = { isLoading: false, error: null, data: null };

    async function submitOrder(shouldCrash) {
      state.isLoading = true;
      state.error = null;
      try {
        if (shouldCrash) throw new Error("Payment Gateway Timeout (504)");
        state.data = { orderId: "ORD-1" };
      } catch (err) {
        state.error = err.message;
      } finally {
        state.isLoading = false; // 🟢 Invariant Guarantee
      }
    }

    await submitOrder(true);

    if (state.isLoading !== false) throw new Error("Stuck Loading Spinner Bug: isLoading remained true!");
    if (state.error !== "Payment Gateway Timeout (504)") throw new Error("Error message was not captured");
    if (state.data !== null) throw new Error("Data should remain null on failure");
  });

  // Test 2: Deferred Promise Out-of-Order Concurrency Test
  await harness.run("Discards stale out-of-order search responses", async () => {
    let latestSequenceId = 0;
    let renderedQuery = "";

    function executeSearch(query, deferred) {
      const seqId = ++latestSequenceId;
      deferred.promise.then(() => {
        if (seqId === latestSequenceId) {
          renderedQuery = query;
        }
      });
    }

    const deferredA = createDeferred(); // Query "re" (Req #1)
    const deferredB = createDeferred(); // Query "react" (Req #2)

    executeSearch("re", deferredA);
    executeSearch("react", deferredB);

    // Resolve in reverse arrival order (B first, A second)
    deferredB.resolve();
    await deferredB.promise;

    deferredA.resolve();
    await deferredA.promise;

    if (renderedQuery !== "react") {
      throw new Error(`Race condition bug: Stale query "${renderedQuery}" overwrote "react"!`);
    }
  });

  // Test 3: Complete State Machine Retry Recovery
  await harness.run("State machine transitions from ERROR to LOADING to SUCCESS on retry", async () => {
    let attempts = 0;
    const transientService = async () => {
      attempts++;
      if (attempts === 1) throw new Error("Transient 503");
      return { status: 200, payload: "Success Payload" };
    };

    let currentState = "IDLE";
    let payload = null;

    async function loadWithRetry() {
      for (let i = 0; i < 2; i++) {
        currentState = "LOADING";
        try {
          const res = await transientService();
          payload = res.payload;
          currentState = "SUCCESS";
          break;
        } catch (err) {
          currentState = "ERROR";
        }
      }
    }

    await loadWithRetry();

    if (attempts !== 2) throw new Error(`Expected 2 attempts, took ${attempts}`);
    if (currentState !== "SUCCESS") throw new Error(`Expected state SUCCESS, got ${currentState}`);
    if (payload !== "Success Payload") throw new Error("Payload missing after retry recovery");
  });

  // Test 4: Lifecycle Teardown Cleanup & Duplicate Listener Leak Verification
  await harness.run("Component cleanup prevents duplicate event listener execution", async () => {
    let executionCount = 0;
    const listeners = new Set();

    const mockWindow = {
      addEventListener(type, fn) {
        listeners.add(fn);
      },
      removeEventListener(type, fn) {
        listeners.delete(fn);
      },
      dispatchEvent() {
        listeners.forEach((fn) => fn());
      }
    };

    function mount() {
      const handler = () => {
        executionCount++;
      };
      mockWindow.addEventListener("customEvent", handler);
      return function unmount() {
        mockWindow.removeEventListener("customEvent", handler);
      };
    }

    // Mount 1 and Unmount 1
    const unmount1 = mount();
    unmount1();

    // Mount 2
    mount();

    // Trigger event: should execute exactly 1 time
    mockWindow.dispatchEvent();

    if (executionCount !== 1) {
      throw new Error(`Memory leak bug: Handler executed ${executionCount} times instead of 1!`);
    }
  });

  harness.report();
}

executeTestSuite();
