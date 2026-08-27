/**
 * KPI 12 — Part 02: .then(), Promise Handlers & Promise Chaining
 * Demonstrates:
 * 1. Gotcha: The Missing `return` Bug vs Proper Promise Returning
 * 2. Gotcha: Two-argument .then(onFulfilled, onRejected) vs .catch()
 * 3. Prediction 1: Microtask Queue Prioritization over setTimeout Macrotasks
 * 4. Prediction 2: Thenable Object Assimilation & Flattening
 * 5. Practical Architecture: Standalone Chaining & Assimilation Engine
 */

"use strict";

console.log("=== 1. GOTCHA: MISSING RETURN VS PROPER PROMISE RETURNING ===");

function fetchUserData() {
  return Promise.resolve({ id: 101, name: "Alice" });
}

function fetchUserPermissions(userId) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(["READ", "WRITE", "ADMIN"]), 20);
  });
}

// ❌ Bug: Missing return statement produces undefined
fetchUserData()
  .then((user) => {
    fetchUserPermissions(user.id); // 💥 Missing return keyword!
  })
  .then((perms) => {
    console.log("  ❌ [Missing Return Bug]: Permissions received:", perms); // undefined
  });

// ✅ Fix: Explicitly return the Promise
fetchUserData()
  .then((user) => {
    return fetchUserPermissions(user.id); // 🟢 Correctly chained!
  })
  .then((perms) => {
    console.log("  ✅ [Correct Return]: Permissions received:", perms); // ['READ', 'WRITE', 'ADMIN']
  });

console.log("\n=== 2. GOTCHA: .then(onFulfilled, onRejected) VS .catch() ===");

Promise.resolve({ status: "invalid" })
  .then(
    (data) => {
      // 💥 Thrown inside onFulfilled is NOT caught by adjacent onRejected!
      throw new Error("Validation Failed in onFulfilled");
    },
    (err) => {
      console.log("This will NEVER run for onFulfilled errors:", err.message);
    }
  )
  .catch((err) => {
    console.log("  🛡️ Downstream .catch() Successfully Caught Error:", err.message);
  });

console.log("\n=== 3. MICROTASK VS MACROTASK EXECUTION ORDER ===");

console.log("1. Synchronous Start");

setTimeout(() => {
  console.log("4. Macrotask (setTimeout 0ms)");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("2. Microtask Turn 1");
    return Promise.resolve();
  })
  .then(() => {
    console.log("3. Microtask Turn 2");
  });

console.log("1.5. Synchronous End");

console.log("\n=== 4. THENABLE OBJECT ASSIMILATION ===");

const customThenable = {
  then(resolve) {
    resolve("Successfully Assimilated Custom Thenable Object");
  }
};

Promise.resolve(customThenable).then((msg) => {
  console.log("  📦 [Thenable Assimilation]:", msg);
});

console.log("\n=== 5. PRACTICAL ARCHITECTURE: STANDALONE CHAINING ENGINE ===");

class SimplePromiseChain {
  constructor(executor) {
    this.callbacks = [];

    const resolve = (val) => {
      queueMicrotask(() => {
        let currentVal = val;
        for (const cb of this.callbacks) {
          if (currentVal && typeof currentVal.then === "function") {
            // Thenable assimilation: pause and wait
            currentVal.then((unwrapped) => {
              currentVal = cb(unwrapped);
            });
            return;
          } else {
            currentVal = cb(currentVal);
          }
        }
      });
    };

    executor(resolve);
  }

  then(cb) {
    this.callbacks.push(cb);
    return this;
  }
}

setTimeout(() => {
  console.log("\nTesting Standalone SimplePromiseChain:");
  new SimplePromiseChain((resolve) => {
    resolve(10);
  })
    .then((n) => n * 2)
    .then((n) => n + 5)
    .then((result) => {
      console.log("  🎉 [Chaining Engine Result]:", result); // 25
    });
}, 80);
