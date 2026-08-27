/**
 * KPI 11 — Part 03: Callbacks, Error-First Contracts & Inversion of Control
 * Demonstrates:
 * 1. Gotcha: "Releasing Zalgo" Timing Bug vs queueMicrotask() Normalization
 * 2. Gotcha: Inversion of Control & The Defensive once() Callback Guard
 * 3. Prediction 1: Error-First Callback Sequential Chaining
 * 4. Prediction 2: Manual Parallel Callback Barrier Coordination
 * 5. Practical Architecture: Standalone promisify() Utility
 */

"use strict";

console.log("=== 1. GOTCHA: RELEASING ZALGO VS DEFENSIVE ASYNC NORMALIZATION ===");

const inMemoryCache = new Map([["user-1", { id: "user-1", name: "Alice" }]]);

// ❌ Zalgo: Sync on cache hit, Async on cache miss
function fetchUserZalgo(id, callback) {
  if (inMemoryCache.has(id)) {
    callback(null, inMemoryCache.get(id)); // Synchronous invocation!
  } else {
    setTimeout(() => {
      const user = { id, name: "Bob" };
      inMemoryCache.set(id, user);
      callback(null, user); // Asynchronous invocation!
    }, 20);
  }
}

// ✅ Safe: Always 100% Asynchronous via queueMicrotask
function fetchUserSafe(id, callback) {
  if (inMemoryCache.has(id)) {
    queueMicrotask(() => {
      callback(null, inMemoryCache.get(id));
    });
  } else {
    setTimeout(() => {
      const user = { id, name: "Bob" };
      inMemoryCache.set(id, user);
      callback(null, user);
    }, 20);
  }
}

let isInitialized = false;
fetchUserSafe("user-1", (err, user) => {
  console.log(`  [Safe Normalized]: User ${user.name} loaded. Caller initialized? ${isInitialized}`);
});
isInitialized = true; // Safe because callback is deferred to microtask queue!

console.log("\n=== 2. GOTCHA: INVERSION OF CONTROL & ONCE() DEFENSIVE GUARD ===");

function createOnceCallback(fn) {
  let hasBeenCalled = false;
  return function (...args) {
    if (hasBeenCalled) {
      console.warn("  ⚠️ [Defensive Guard]: Blocked duplicate callback invocation!");
      return;
    }
    hasBeenCalled = true;
    return fn.apply(this, args);
  };
}

// Simulated buggy third-party payment library invoking callback twice
function unreliableThirdPartyBilling(orderId, callback) {
  setTimeout(() => {
    callback(null, { txId: `TX_${orderId}_1`, amount: 100 });
    callback(null, { txId: `TX_${orderId}_DUPLICATE`, amount: 100 }); // 💥 Buggy duplicate invocation
  }, 30);
}

const safePaymentHandler = createOnceCallback((err, receipt) => {
  console.log(`  ✅ Payment processed exactly once: TxID = ${receipt.txId}`);
});

unreliableThirdPartyBilling("ORD-101", safePaymentHandler);

console.log("\n=== 3. MANUAL PARALLEL CALLBACK BARRIER COORDINATION ===");

function asyncParallel(tasks, finalCallback) {
  let completed = 0;
  const results = [];
  let hasFailed = false;

  if (tasks.length === 0) {
    return finalCallback(null, []);
  }

  tasks.forEach((taskFn, index) => {
    taskFn((err, data) => {
      if (hasFailed) return;
      if (err) {
        hasFailed = true;
        return finalCallback(err);
      }
      results[index] = data;
      completed++;
      if (completed === tasks.length) {
        finalCallback(null, results);
      }
    });
  });
}

const taskA = (cb) => setTimeout(() => cb(null, "Result A"), 40);
const taskB = (cb) => setTimeout(() => cb(null, "Result B"), 10);
const taskC = (cb) => setTimeout(() => cb(null, "Result C"), 25);

asyncParallel([taskA, taskB, taskC], (err, allResults) => {
  console.log("  [Parallel Barrier Complete]:", allResults); // [ 'Result A', 'Result B', 'Result C' ]
});

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE PROMISIFY UTILITY ===");

function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      const safeCallback = createOnceCallback((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      fn.call(this, ...args, safeCallback);
    });
  };
}

// Legacy error-first API
function legacyFileRead(path, callback) {
  setTimeout(() => {
    if (path === "valid.json") {
      callback(null, { version: "1.0.0", status: "LOADED" });
    } else {
      callback(new Error(`File not found: ${path}`));
    }
  }, 60);
}

const readFileAsync = promisify(legacyFileRead);

// Execute via modern Promise chain
readFileAsync("valid.json")
  .then((data) => {
    console.log("  [Promisified Async/Promise Result]:", data);
  })
  .catch((err) => {
    console.error("  [Promisified Error]:", err.message);
  });
