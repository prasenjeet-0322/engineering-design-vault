/**
 * KPI 12 — Part 01: Why Promises Exist & The Promise State Machine
 * Demonstrates:
 * 1. Gotcha: Synchronous Executor Execution vs Asynchronous .then()
 * 2. Gotcha: Immutable Single-Settlement Invariant
 * 3. Prediction 1: Executor Error Capture & Rejection
 * 4. Prediction 2: Late Handler Attachment to Already-Settled Promise
 * 5. Practical Architecture: Standalone Mini-Promise State Machine (LitePromise)
 */

"use strict";

console.log("=== 1. GOTCHA: SYNCHRONOUS EXECUTOR VS ASYNC .then() ===");

console.log("1. Synchronous Main Script Start");

const p1 = new Promise((resolve) => {
  console.log("2. Inside Executor (Runs Synchronously on Call Stack!)");
  resolve("Resolved Payload");
});

p1.then((val) => {
  console.log("4. Inside .then() Callback (Runs Asynchronously in Microtask!):", val);
});

console.log("3. Synchronous Main Script End");

console.log("\n=== 2. IMMUTABLE SINGLE-SETTLEMENT INVARIANT ===");

const p2 = new Promise((resolve, reject) => {
  resolve("First Resolution (Wins)");
  reject(new Error("Second Call (Silently Ignored)"));
  resolve("Third Call (Silently Ignored)");
});

p2.then((val) => console.log("  ✅ Settled Value:", val))
  .catch((err) => console.error("  ❌ Error:", err.message));

console.log("\n=== 3. EXECUTOR THROWN EXCEPTION CAPTURE ===");

const p3 = new Promise(() => {
  throw new Error("Synchronous Explosion inside Executor");
});

p3.catch((err) => {
  console.log("  🛡️ Automatically Captured Rejection:", err.message);
});

console.log("\n=== 4. LATE HANDLER ATTACHMENT ON PRE-SETTLED PROMISE ===");

const preSettled = Promise.resolve("Instant Pre-computed Data");

// Delay attaching .then() to simulate late subscription
setTimeout(() => {
  console.log("\nAttaching .then() to Promise that settled 50ms ago:");
  preSettled.then((val) => {
    console.log("  📦 Late Consumer Received:", val);
  });
}, 50);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: LITE-PROMISE STATE MACHINE ===");

class LitePromise {
  constructor(executor) {
    this.state = "PENDING"; // "PENDING" | "FULFILLED" | "REJECTED"
    this.result = undefined;
    this.fulfillReactions = [];
    this.rejectReactions = [];

    const resolve = (value) => {
      if (this.state !== "PENDING") return; // 🟢 Single-Settlement Invariant
      this.state = "FULFILLED";
      this.result = value;
      this.notify();
    };

    const reject = (reason) => {
      if (this.state !== "PENDING") return; // 🟢 Single-Settlement Invariant
      this.state = "REJECTED";
      this.result = reason;
      this.notify();
    };

    try {
      // 🟢 Executor runs immediately and synchronously
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  notify() {
    // Defensively defer execution to microtask queue
    queueMicrotask(() => {
      if (this.state === "FULFILLED") {
        this.fulfillReactions.forEach((fn) => fn(this.result));
        this.fulfillReactions = [];
      } else if (this.state === "REJECTED") {
        this.rejectReactions.forEach((fn) => fn(this.result));
        this.rejectReactions = [];
      }
    });
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled === "function") {
      this.fulfillReactions.push(onFulfilled);
    }
    if (typeof onRejected === "function") {
      this.rejectReactions.push(onRejected);
    }

    if (this.state !== "PENDING") {
      this.notify(); // Late attachment notification
    }

    return this;
  }
}

// Test custom LitePromise:
setTimeout(() => {
  console.log("\nTesting Custom LitePromise Implementation:");
  const custom = new LitePromise((resolve, reject) => {
    console.log("  [LitePromise Executor]: Running synchronously!");
    setTimeout(() => resolve("Custom Resolution 100% Verified"), 20);
    // Duplicate call ignored
    setTimeout(() => resolve("Duplicate resolution attempt"), 30);
  });

  custom.then((val) => {
    console.log("  🎉 [LitePromise .then() Consumer Received]:", val);
  });
}, 80);
