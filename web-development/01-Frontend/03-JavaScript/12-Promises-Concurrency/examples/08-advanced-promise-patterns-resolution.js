/**
 * KPI 12 — Part 08: Advanced Promise Patterns, Thenables, Promise Resolution & Production Design
 * Demonstrates:
 * 1. Gotcha: Missing `return` In Chained Tasks Causing Undefined & Orphaned Work
 * 2. Gotcha: ES2024 Promise.withResolvers() / Deferred Pattern
 * 3. Prediction 1: Multi-Level Promise Flattening & State Adoption
 * 4. Prediction 2: Duck-Typed Thenable Assimilation
 * 5. Practical Architecture: Standalone Deferred Task Queue Manager
 */

"use strict";

console.log("=== 1. GOTCHA: MISSING RETURN VS RETURNING PROMISE ===");

// ❌ Bug: Missing return
Promise.resolve({ id: "USR-101" })
  .then((user) => {
    // Omitting return causes inner async task to be orphaned!
    Promise.resolve(`Avatar-${user.id}.png`);
  })
  .then((avatar) => {
    console.log("  ❌ [Downstream Missing Return Bug]: avatar is =", avatar); // undefined
  });

// ✅ Fix: Return the inner promise
Promise.resolve({ id: "USR-102" })
  .then((user) => {
    return Promise.resolve(`Avatar-${user.id}.png`); // 🟢 Explicit return
  })
  .then((avatar) => {
    console.log("  ✅ [Downstream Success]: Properly unboxed avatar =", avatar);
  });

console.log("\n=== 2. ES2024 PROMISE.WITHRESOLVERS() / DEFERRED PATTERN ===");

function createDeferredResolvers() {
  if (typeof Promise.withResolvers === "function") {
    return Promise.withResolvers();
  }
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const { promise: deferredPromise, resolve: triggerResolve } = createDeferredResolvers();

deferredPromise.then((msg) => {
  console.log("  🎯 [Deferred Promise Settled Externally]:", msg);
});

// Settle from outside executor
setTimeout(() => {
  triggerResolve("External Event Fired!");
}, 20);

console.log("\n=== 3. MULTI-LEVEL PROMISE FLATTENING ===");

Promise.resolve(
  Promise.resolve(
    Promise.resolve("Deeply Nested Flattened String")
  )
).then((unwrapped) => {
  console.log("  📦 [Automatically Flattened Payload]:", unwrapped);
});

console.log("\n=== 4. DUCK-TYPED THENABLE ASSIMILATION ===");

const duckThenable = {
  then(onFulfilled, onRejected) {
    onFulfilled("Payload from Duck-Typed Thenable Method");
  }
};

Promise.resolve(duckThenable).then((data) => {
  console.log("  🦆 [Assimilated Thenable Result]:", data);
});

console.log("\n=== 5. PRACTICAL ARCHITECTURE: DEFERRED TASK QUEUE MANAGER ===");

class DeferredTaskQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(taskName) {
    const resolvers = createDeferredResolvers();
    this.queue.push({ name: taskName, resolvers });
    console.log(`  📥 [Task Enqueued]: "${taskName}" (Pending queue length = ${this.queue.length})`);
    return resolvers.promise;
  }

  dispatchNext(result) {
    const item = this.queue.shift();
    if (!item) return false;
    console.log(`  ⚙️ [Dispatching Task]: "${item.name}" -> Resolving...`);
    item.resolvers.resolve(result);
    return true;
  }
}

setTimeout(() => {
  console.log("\nTesting DeferredTaskQueue:");
  const taskQueue = new DeferredTaskQueue();

  taskQueue.enqueue("Sync User Profile").then((res) => {
    console.log("  🎉 [Task 1 Finished]:", res);
  });

  taskQueue.enqueue("Export CSV Report").then((res) => {
    console.log("  🎉 [Task 2 Finished]:", res);
  });

  setTimeout(() => {
    taskQueue.dispatchNext("Profile Sync Complete (HTTP 200)");
    taskQueue.dispatchNext("CSV Export Complete (1,048 rows)");
  }, 40);
}, 60);
