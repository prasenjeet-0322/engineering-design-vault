/**
 * KPI 23 — Part 06: Memoization, Pattern Selection & Production Tradeoffs
 * Demonstrates:
 * 1. Gotcha: Key Serialization Hazards (`JSON.stringify` Key Order Divergence)
 * 2. Gotcha: Bounded LRU Cache Eviction Policy
 * 3. Prediction 1: Pure Function Memoization Cache Hits vs Misses
 * 4. Prediction 2: Composite Multi-Pattern Architecture (Factory + Strategy + Observer)
 * 5. Practical Architecture: Standalone LRU Memoized Function Engine
 */

"use strict";

console.log("=== 1. GOTCHA: KEY SERIALIZATION HAZARDS IN OBJECT MEMOIZE ===");

function naiveJsonMemoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args); // 💥 Key order dependent!
    if (cache.has(key)) return { result: cache.get(key), cached: true };
    const res = fn(...args);
    cache.set(key, res);
    return { result: res, cached: false };
  };
}

const computeUser = naiveJsonMemoize((user) => `User: ${user.name} (ID: ${user.id})`);

const obj1 = { name: "Sunny", id: 1 };
const obj2 = { id: 1, name: "Sunny" }; // Same logical values, DIFFERENT property order!

console.log("  Call with obj1 {name, id}:", computeUser(obj1)); // cached: false
console.log("  Call with obj2 {id, name} (False Cache Miss!):", computeUser(obj2)); // cached: false (💥 False miss!)

console.log("\n=== 2. PRODUCTION LRU CACHE WITH CAPACITY EVICTION ===");

class LRUCache {
  #capacity;
  #cache = new Map();

  constructor(capacity = 3) {
    this.#capacity = capacity;
  }

  get(key) {
    if (!this.#cache.has(key)) return undefined;
    const value = this.#cache.get(key);
    // Refresh access order (delete and re-insert)
    this.#cache.delete(key);
    this.#cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    } else if (this.#cache.size >= this.#capacity) {
      // Evict oldest (first key in map iterator)
      const oldestKey = this.#cache.keys().next().value;
      console.log(`    🗑️ [LRU Eviction]: Evicting oldest key "${oldestKey}"`);
      this.#cache.delete(oldestKey);
    }
    this.#cache.set(key, value);
  }

  get keys() {
    return [...this.#cache.keys()];
  }
}

const lru = new LRUCache(2);
lru.set("a", 100);
lru.set("b", 200);
console.log("  Cache keys after adding A, B:", lru.keys);

lru.get("a"); // Refreshes A
console.log("  Refreshed key 'a'. Inserting 'c' (Should evict 'b'):");
lru.set("c", 300);
console.log("  Cache keys after adding C:", lru.keys);
console.log("  Lookup 'b' (Expected undefined):", lru.get("b"));

console.log("\n=== 3. PREDICTIONS: DETERMINISTIC MEMOIZATION HITS & MISSES ===");

function createMemoizer(fn) {
  const cache = new Map();
  return (n) => {
    if (cache.has(n)) return { val: cache.get(n), hit: true };
    const res = fn(n);
    cache.set(n, res);
    return { val: res, hit: false };
  };
}

const fib = createMemoizer((n) => (n <= 1 ? n : n * 2));

console.log("  fib(10) Call 1:", fib(10)); // hit: false
console.log("  fib(10) Call 2:", fib(10)); // hit: true
console.log("  fib(20) Call 1:", fib(20)); // hit: false
console.log("  fib(10) Call 3:", fib(10)); // hit: true

console.log("\n=== 4. PRACTICAL ARCHITECTURE: COMPOSITE MULTI-PATTERN WORKFLOW ===");

// 1. Factory Pattern: Service Creator
function createOrderWorkflow(paymentStrategy, notificationBus) {
  // 2. Composition: Assembling Strategy & Observer dependencies
  return {
    async process(order) {
      console.log(`  ▶️ [Workflow]: Processing Order #${order.id} for $${order.total}`);
      // 3. Strategy Pattern: Execute chosen algorithm
      const paymentResult = await paymentStrategy(order);
      // 4. Observer Pattern / PubSub: Broadcast event
      notificationBus.publish("ORDER_COMPLETED", { orderId: order.id, status: paymentResult.status });
      return paymentResult;
    }
  };
}

// Mock Dependencies
const stripeStrategy = async (o) => ({ status: "SUCCESS", tx: "tx_123" });
const mockBus = { publish: (evt, d) => console.log(`    📢 [PubSub Event]: "${evt}"`, d) };

const workflow = createOrderWorkflow(stripeStrategy, mockBus);

async function runDemo() {
  await workflow.process({ id: "ORD-900", total: 199.99 });
  console.log("\n  🎉 [Memoization, Pattern Selection & Production Tradeoffs Verification Completed Successfully!]");
}

runDemo();
