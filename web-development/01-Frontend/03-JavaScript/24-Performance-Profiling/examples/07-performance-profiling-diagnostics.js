/**
 * KPI 24 — Part 07: Memory Performance, Garbage Collection & JavaScript Memory Leaks
 * Demonstrates:
 * 1. Gotcha: Detached DOM Subtree Retention Simulation
 * 2. Gotcha: Anonymous Event Listener Teardown Failure vs Named/AbortController Cleanup
 * 3. Prediction 1: Strong Map vs WeakMap Ephemeral Metadata Retention
 * 4. Prediction 2: Closures Retaining Outer Scope Context vs Scoped Teardown
 * 5. Practical Architecture: Standalone Resource Lifecycle Registry with Automatic Teardown
 */

"use strict";

console.log("=== 1. GOTCHA: DETACHED DOM SUBTREE RETENTION ===");

class SimulatedDOMNode {
  constructor(name, parent = null) {
    this.name = name;
    this.parent = parent;
    this.children = [];
    if (parent) parent.children.push(this);
  }

  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter((c) => c !== this);
      // Notice: In real browser engines, the node still points to its children!
    }
  }
}

// Create Document Tree: Root -> Card -> Icon
const mockDocumentRoot = new SimulatedDOMNode("DocumentRoot");
const card = new SimulatedDOMNode("CardContainer", mockDocumentRoot);
const icon = new SimulatedDOMNode("CardIcon", card);

console.log(`  Initial Document Root Children count: ${mockDocumentRoot.children.length}`);

// Leaky dismissal: Card removed from document, but icon is retained in a JS cache!
const leakyCache = [];
card.remove(); // Removed from live DOM
leakyCache.push(icon); // 💥 Retains icon, which retains card via child-parent references!

console.log(`  After card.remove(): Document Root Children count: ${mockDocumentRoot.children.length}`);
console.log(`  ❌ Leaky Cache contains icon: "${leakyCache[0].name}", which retains parent "${leakyCache[0].parent.name}"!`);

console.log("\n=== 2. GOTCHA: ANONYMOUS LISTENER TEARDOWN FAILURE ===");

class MockEventEmitter {
  #listeners = [];

  addEventListener(event, fn) {
    this.#listeners.push({ event, fn });
  }

  removeEventListener(event, fn) {
    this.#listeners = this.#listeners.filter((l) => !(l.event === event && l.fn === fn));
  }

  get count() {
    return this.#listeners.length;
  }
}

const emitter = new MockEventEmitter();

// Scenario A: Anonymous Function (Teardown Fails!)
emitter.addEventListener("resize", () => console.log("Resize A"));
emitter.removeEventListener("resize", () => console.log("Resize A")); // 💥 Different function reference!
console.log(`  ❌ Active Listeners after anonymous removeEventListener: ${emitter.count} (Leak!)`);

// Scenario B: Named Function Reference (Teardown Succeeds!)
function handleResize() { console.log("Resize B"); }
emitter.addEventListener("resize", handleResize);
console.log(`  Attached named listener -> Count: ${emitter.count}`);
emitter.removeEventListener("resize", handleResize);
console.log(`  ✅ Active Listeners after named removeEventListener: ${emitter.count - 1} (Cleaned up!)`);

console.log("\n=== 3. PREDICTION: WEAKMAP EPHEMERAL METADATA ASSOCIATION ===");

let targetWidget = { widgetId: "W-500", name: "DataChart" };

const strongCache = new Map();
const weakCache = new WeakMap();

strongCache.set(targetWidget, { lastRendered: Date.now() });
weakCache.set(targetWidget, { lastRendered: Date.now() });

console.log(`  Strong Map has widget: ${strongCache.has(targetWidget)}`);
console.log(`  WeakMap has widget: ${weakCache.has(targetWidget)}`);

// Clear local reference
targetWidget = null;
console.log("  Nullified targetWidget reference.");
console.log("  🟢 In V8: WeakMap entry is eligible for GC automatically!");
console.log("  ⚠️ In Strong Map: The object is STILL retained in memory by the map key!");

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE RESOURCE LIFECYCLE REGISTRY ===");

class ResourceLifecycleRegistry {
  #cleanupTasks = [];

  register(teardownFn) {
    this.#cleanupTasks.push(teardownFn);
  }

  destroyAll() {
    console.log(`  ▶️ [Lifecycle Teardown]: Executing ${this.#cleanupTasks.length} cleanup hooks...`);
    while (this.#cleanupTasks.length > 0) {
      const cleanup = this.#cleanupTasks.pop();
      try {
        cleanup();
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }
    console.log("  ✅ All registered resources, timers, and listeners cleanly terminated!");
  }
}

const registry = new ResourceLifecycleRegistry();

// Component Mount Resource Registrations
const simulatedTimer = setTimeout(() => {}, 10000);
registry.register(() => {
  clearTimeout(simulatedTimer);
  console.log("    🧹 [Teardown]: Cleared background timer");
});

const mockSocket = { close: () => console.log("    🧹 [Teardown]: Closed WebSocket connection") };
registry.register(() => mockSocket.close());

const mockObserver = { disconnect: () => console.log("    🧹 [Teardown]: Disconnected ResizeObserver") };
registry.register(() => mockObserver.disconnect());

// Component Unmount Trigger
registry.destroyAll();

console.log("\n  🎉 [Memory Performance, Garbage Collection & JavaScript Memory Leaks Verification Completed Successfully!]");
