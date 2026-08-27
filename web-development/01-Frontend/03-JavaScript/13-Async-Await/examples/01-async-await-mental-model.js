/**
 * KPI 13 — Part 01: The Mental Model, async Functions & await Mechanics
 * Demonstrates:
 * 1. Gotcha: Synchronous Entry Phase Before First `await` vs Microtask Continuation
 * 2. Gotcha: Sequential Async Waterfall vs Parallel Promise.all Execution
 * 3. Prediction 1: Awaiting Non-Promise Constants (await 42 Microtask Tick)
 * 4. Prediction 2: Implicit Promise Lifting and Adoption
 * 5. Practical Architecture: Standalone Generator-to-Async Coroutine Runner (asyncToGenerator)
 */

"use strict";

console.log("=== 1. GOTCHA: SYNCHRONOUS ENTRY PHASE BEFORE FIRST AWAIT ===");

async function traceOrder() {
  console.log("  2. Inside Async: Synchronous execution BEFORE await");
  await null; // Suspends traceOrder and yields control
  console.log("  4. Inside Async: Deferred continuation AFTER await");
}

console.log("  1. Main Script: Invoking traceOrder()");
traceOrder();
console.log("  3. Main Script: Returned immediately after await suspension");

console.log("\n=== 2. ASYNC WATERFALL VS PROMISE.ALL PARALLEL DISPATCH ===");

const simulateQuery = (name, delayMs) =>
  new Promise((res) => setTimeout(() => res(`${name} Done`), delayMs));

// Parallel execution using Promise.all
const startTime = Date.now();
Promise.all([
  simulateQuery("Fetch Users", 30),
  simulateQuery("Fetch Projects", 40),
  simulateQuery("Fetch Notifications", 25)
]).then((results) => {
  const duration = Date.now() - startTime;
  console.log(`  ⚡ [Parallel Execution Finished in ${duration}ms] (Expected ~40ms):`, results);
});

console.log("\n=== 3. AWAITING NON-PROMISE CONSTANTS ===");

async function awaitPrimitive() {
  const value = await 42; // Lifted into Promise.resolve(42)
  console.log("  📦 [Awaited Primitive Unwrapped]:", value);
}

awaitPrimitive();

console.log("\n=== 4. STANDALONE COROUTINE RUNNER (HOW ASYNC/AWAIT WORKS INTERNALLY) ===");

/**
 * Emulates the TC39 async/await desugaring over ES6 Generator functions
 */
function asyncToGenerator(generatorFn) {
  return function (...args) {
    const iterator = generatorFn.apply(this, args);

    return new Promise((resolve, reject) => {
      function step(verb, arg) {
        let result;
        try {
          result = iterator[verb](arg);
        } catch (err) {
          return reject(err);
        }

        const { value, done } = result;

        if (done) {
          return resolve(value);
        }

        // Lift yielded value into a Promise and attach continuation step
        Promise.resolve(value)
          .then((unwrapped) => step("next", unwrapped))
          .catch((err) => step("throw", err));
      }

      step("next");
    });
  };
}

// Test custom coroutine runner
const loadUserDataCoroutine = asyncToGenerator(function* (userId) {
  console.log(`  ▶️ [Coroutine Started]: Fetching user ${userId}...`);
  const user = yield simulateQuery(`User-${userId}`, 30);
  console.log(`  ▶️ [Coroutine Resumed]: User received (${user}). Fetching permissions...`);
  const perms = yield simulateQuery("Permissions-Admin", 20);
  return { user, perms, timestamp: Date.now() };
});

setTimeout(() => {
  console.log("\nTesting Generator-based Async Coroutine Runner:");
  loadUserDataCoroutine("USR-99")
    .then((finalData) => {
      console.log("  🎉 [Coroutine Workflow Fulfilled]:", finalData);
    })
    .catch((err) => {
      console.error("  ❌ [Coroutine Failed]:", err);
    });
}, 60);
