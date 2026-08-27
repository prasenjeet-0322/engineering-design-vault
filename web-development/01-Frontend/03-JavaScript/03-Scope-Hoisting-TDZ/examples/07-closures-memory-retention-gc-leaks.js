/**
 * KPI 03 — Part 07: Closures, Memory Retention, Garbage Collection & Memory Leak Patterns
 * Demonstrates:
 * 1. Gotcha: Shared Lexical Context Retention
 * 2. Prediction 1: Independent Factory Closure Environments
 * 3. Prediction 2: Shared Multi-Method Closure State (Bank Account Pattern)
 * 4. Prediction 4: Anonymous Event Listener Identity Failure Simulation
 * 5. Prediction 5: Map (Strong Retention) vs WeakMap (Ephemeral Associations)
 * 6. Practical Architecture: Auto-Invalidating WeakMap Cache with Abortable Lifecycle
 */

console.log("=== 1. PREDICTION 1: INDEPENDENT FACTORY CLOSURES ===");
function createCounter() {
  let count = 0;
  return () => ++count;
}
const a = createCounter();
const b = createCounter();
console.log("a():", a(), a()); // 1, 2
console.log("b():", b());      // 1
console.log("a():", a());      // 3

console.log("\n=== 2. PREDICTION 2: SHARED CLOSURE STATE (BANK ACCOUNT) ===");
function createAccount(initialBalance) {
  let balance = initialBalance;
  return {
    deposit(amt) { balance += amt; },
    withdraw(amt) { balance -= amt; },
    getBalance() { return balance; }
  };
}
const acc = createAccount(100);
acc.deposit(50);
acc.withdraw(30);
console.log("Final balance:", acc.getBalance()); // 120

console.log("\n=== 3. PREDICTION 4: EVENT LISTENER REFERENCE EQUALITY ===");
class MockEventTarget {
  constructor() {
    this.listeners = [];
  }
  addEventListener(fn) {
    this.listeners.push(fn);
  }
  removeEventListener(fn) {
    const idx = this.listeners.indexOf(fn);
    if (idx !== -1) {
      this.listeners.splice(idx, 1);
      return true;
    }
    return false;
  }
  get activeCount() {
    return this.listeners.length;
  }
}

const target = new MockEventTarget();
// Attempting to remove with anonymous function fails:
target.addEventListener(() => console.log("click"));
const removedWithAnon = target.removeEventListener(() => console.log("click"));
console.log("Removed with anonymous function?", removedWithAnon, "| Active listeners:", target.activeCount); // false | 1

// Fixed with cached function pointer:
const cachedHandler = () => console.log("click");
target.addEventListener(cachedHandler);
const removedWithRef = target.removeEventListener(cachedHandler);
console.log("Removed with cached reference?", removedWithRef, "| Active listeners:", target.activeCount); // true | 1

console.log("\n=== 4. PREDICTION 5: MAP (STRONG) VS WEAKMAP (EPHEMERAL) ===");
const strongMap = new Map();
const weakMap = new WeakMap();

let userObj = { id: "usr_99", name: "Sunny" };

strongMap.set(userObj, "Strongly Held Metadata");
weakMap.set(userObj, "Weakly Held Metadata");

console.log("WeakMap has userObj?", weakMap.has(userObj)); // true
console.log("StrongMap has userObj?", strongMap.has(userObj)); // true

// When userObj is set to null, WeakMap allows GC without pinning userObj in memory!

console.log("\n=== 5. PRACTICAL ARCHITECTURE: ABORTABLE CACHE MANAGER ===");

class ManagedSessionStream {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.abortController = new AbortController();
    this.metadataStore = new WeakMap();
  }

  startSession(targetDomElement) {
    this.metadataStore.set(targetDomElement, { connectedAt: Date.now() });
    const signal = this.abortController.signal;

    console.log(`[Stream] Connected to ${this.endpoint}. Weak metadata attached.`);

    const timer = setInterval(() => {
      if (signal.aborted) {
        clearInterval(timer);
        console.log(`[Stream] Inactive timer cleared via AbortSignal.`);
        return;
      }
      console.log(`[Stream Tick] Heartbeat active for ${this.endpoint}`);
    }, 40);

    // Auto cleanup after 100ms
    setTimeout(() => {
      this.close();
    }, 100);
  }

  close() {
    this.abortController.abort();
    console.log(`[Stream] Session terminated. Zero dangling closures.`);
  }
}

const mockElement = {}; // Simulated DOM node
const stream = new ManagedSessionStream("wss://gateway.enterprise.io/v2");
stream.startSession(mockElement);
