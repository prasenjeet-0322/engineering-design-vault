/**
 * KPI 12 — Part 04: Promise Creation, Static Methods, Thenables & Constructor Anti-Patterns
 * Demonstrates:
 * 1. Gotcha: The Dangerous `async` Executor Anti-Pattern
 * 2. Gotcha: Executor Return Value Ignored vs Explicit resolve()
 * 3. Prediction 1: Promise.resolve() Identity Preservation
 * 4. Prediction 2: Thenable Assimilation Procedure
 * 5. Practical Architecture: Generic Promisifier & Timeout Bridge Adapter
 */

"use strict";

console.log("=== 1. GOTCHA: THE ASYNC EXECUTOR TRAP ===");

// Simulating why `new Promise(async ...)` hangs outer Promise on exception
function createBuggyAsyncPromise() {
  return new Promise(async (resolve, reject) => {
    // Simulate async work throwing an exception
    await new Promise((r) => setTimeout(r, 10));
    throw new Error("Internal Async Explosion"); // 💥 Rejects hidden inner Promise!
    resolve("Will never run");
  });
}

const buggyPromise = createBuggyAsyncPromise();
console.log("  ⚠️ [Buggy Promise Created]: It will remain PENDING on the outside handle!");

// Listen to unhandled rejection to catch the leaked error
process.once("unhandledRejection", (err) => {
  console.log("  🚨 [Process Level Intercept]: Unhandled rejection from async executor:", err.message);
});

console.log("\n=== 2. GOTCHA: EXECUTOR RETURN IGNORED VS RESOLVE ===");

const ignoredReturnPromise = new Promise((resolve) => {
  return "Direct Return String"; // 💥 Ignored!
});

// Check status after short delay
setTimeout(() => {
  console.log("  [Ignored Return Check]: Promise still pending (did not resolve with string).");
}, 20);

console.log("\n=== 3. PROMISE.RESOLVE() IDENTITY PRESERVATION ===");

const nativePromise = Promise.resolve("Original Payload");
const resolvedAgain = Promise.resolve(nativePromise);

console.log("  [Identity Match]: original === Promise.resolve(original):", nativePromise === resolvedAgain);

console.log("\n=== 4. THENABLE OBJECT ASSIMILATION ===");

const duckTypedThenable = {
  then(onFulfilled, onRejected) {
    onFulfilled("Assimilated from Duck-Typed Object");
  }
};

Promise.resolve(duckTypedThenable).then((data) => {
  console.log("  📦 [Thenable Result]:", data);
});

console.log("\n=== 5. PRACTICAL ARCHITECTURE: STANDALONE PROMISIFIER & TIMEOUT BRIDGE ===");

/**
 * Generic Promisifier for Node.js error-first callback APIs
 */
function promisify(callbackFn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      callbackFn.call(this, ...args, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };
}

// Legacy callback API
function legacyFileLoader(filename, callback) {
  setTimeout(() => {
    if (filename.endsWith(".json")) {
      callback(null, { status: "OK", file: filename });
    } else {
      callback(new Error(`Unsupported file extension for: ${filename}`));
    }
  }, 40);
}

const loadFileAsync = promisify(legacyFileLoader);

setTimeout(() => {
  console.log("\nTesting Promisified Legacy Function:");
  loadFileAsync("config.json")
    .then((res) => {
      console.log("  ✅ [Promisified Success]:", res);
    })
    .catch((err) => {
      console.error("  ❌ [Promisified Error]:", err.message);
    });

  loadFileAsync("document.txt")
    .then((res) => console.log("Will not run"))
    .catch((err) => {
      console.log("  🛡️ [Promisified Rejection Caught]:", err.message);
    });
}, 50);
