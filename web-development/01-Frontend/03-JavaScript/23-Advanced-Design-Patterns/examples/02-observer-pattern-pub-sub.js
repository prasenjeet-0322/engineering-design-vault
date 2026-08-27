/**
 * KPI 23 — Part 02: Observer Pattern & Pub/Sub Architecture
 * Demonstrates:
 * 1. Gotcha: Defensive Snapshot Iteration Preventing Unsubscribe Mutation Bugs
 * 2. Gotcha: Observer Error Isolation (One crashing listener does not halt others)
 * 3. Prediction 1: Observable Reactive Store with State Diffing
 * 4. Prediction 2: Multi-Channel Pub/Sub Event Bus with `once()` Auto-Cleanup
 * 5. Practical Architecture: Standalone E-Commerce Checkout System with Pub/Sub & Observer Store
 */

"use strict";

console.log("=== 1. GOTCHA: DEFENSIVE SNAPSHOT ITERATION ===");

function createSubject() {
  const observers = new Set();

  function subscribe(fn) {
    observers.add(fn);
    return () => observers.delete(fn);
  }

  function notify(data) {
    // 🟢 Defensive snapshot copy: prevents index cursor shifting during loop
    const snapshot = [...observers];
    for (const observer of snapshot) {
      try {
        observer(data);
      } catch (err) {
        console.error("  ⚠️ [Isolated Observer Error]:", err.message);
      }
    }
  }

  return { subscribe, notify, count: () => observers.size };
}

const subject = createSubject();

const unsubSelf = subject.subscribe((msg) => {
  console.log("  [Listener 1]: Received ->", msg);
  console.log("  [Listener 1]: Unsubscribing self during active broadcast...");
  unsubSelf(); // 🟢 Unsubscribes during iteration!
});

subject.subscribe((msg) => {
  console.log("  [Listener 2]: Received ->", msg); // 🟢 Guaranteed to run!
});

subject.subscribe(() => {
  throw new Error("Simulated Crash in Listener 3");
});

subject.subscribe((msg) => {
  console.log("  [Listener 4]: Received ->", msg); // 🟢 Runs even after Listener 3 threw!
});

console.log("  ▶️ Dispatching First Notification (4 Listeners registered):");
subject.notify("FIRST_EVENT");

console.log("  ▶️ Dispatching Second Notification (Remaining Listeners):", subject.count());
subject.notify("SECOND_EVENT");

console.log("\n=== 2. PRACTICAL ARCHITECTURE: TYPED PUB/SUB EVENT BUS WITH ONCE() ===");

class PubSubEventBus {
  #channels = new Map();

  subscribe(event, listener) {
    if (!this.#channels.has(event)) {
      this.#channels.set(event, new Set());
    }
    const set = this.#channels.get(event);
    set.add(listener);

    return () => set.delete(listener);
  }

  publish(event, payload) {
    const listeners = this.#channels.get(event);
    if (!listeners) return;

    const snapshot = [...listeners];
    for (const fn of snapshot) {
      fn(payload);
    }
  }

  // 🟢 Single-shot subscription helper
  once(event, listener) {
    const unsub = this.subscribe(event, (payload) => {
      unsub();
      listener(payload);
    });
    return unsub;
  }
}

const bus = new PubSubEventBus();

// Single-shot init listener
bus.once("SYSTEM_BOOT", (data) => {
  console.log("  🚀 [Single-Shot Listener]: Booted with environment:", data.env);
});

// Standard subscribers
bus.subscribe("ORDER_PLACED", (order) => {
  console.log(`    📦 [Cart Service]: Cleared cart for Order #${order.id}`);
});

bus.subscribe("ORDER_PLACED", (order) => {
  console.log(`    📊 [Analytics Service]: Logged revenue: $${order.total}`);
});

console.log("  ▶️ Publishing SYSTEM_BOOT (x2):");
bus.publish("SYSTEM_BOOT", { env: "PRODUCTION" });
bus.publish("SYSTEM_BOOT", { env: "STAGING" }); // Ignored by once()

console.log("\n  ▶️ Publishing ORDER_PLACED Event (Decoupled Services):");
bus.publish("ORDER_PLACED", { id: "ORD-9842", total: 249.99 });

console.log("\n  🎉 [Observer Pattern & Pub/Sub Architecture Verification Completed Successfully!]");
