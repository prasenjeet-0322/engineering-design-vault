/**
 * KPI 04 — Part 06: The Global Object, Global Scope & Top-Level Bindings
 * Demonstrates:
 * 1. Gotcha: Global Declarative Record (let/const) vs Object Record (var) vs globalThis
 * 2. Prediction 1: GlobalThis Property Inspection
 * 3. Prediction 2: Module Top-Level Variable Isolation vs Global Object
 * 4. Prediction 3: Shared Mutable Module State Across Invocations
 * 5. Practical Architecture: Bounded LRU Cache & External Store Synchronizer
 */

console.log("=== 1. GOTCHA & PREDICTION 1: GLOBAL DECLARATIVE VS OBJECT RECORD ===");
// Attaching explicit property to globalThis (simulating classic global object record)
globalThis.__GLOBAL_VAR_TEST__ = "accessible_on_global_object";

// Module lexical variable (lives in ModuleEnvironmentRecord)
const moduleLexicalConst = "isolated_in_module";

console.log("globalThis.__GLOBAL_VAR_TEST__:", globalThis.__GLOBAL_VAR_TEST__); // "accessible_on_global_object"
console.log("globalThis.moduleLexicalConst:", globalThis.moduleLexicalConst);     // undefined

console.log("\n=== 2. PREDICTION 2: MODULE TOP-LEVEL ISOLATION ===");
const moduleLevelConfig = { env: "production", apiVersion: "v2" };
console.log("moduleLevelConfig accessible directly:", moduleLevelConfig.env);
console.log("globalThis.moduleLevelConfig:", globalThis.moduleLevelConfig); // undefined

console.log("\n=== 3. PREDICTION 3: SHARED MUTABLE MODULE STATE ===");
// Module-level singleton state
let sharedModuleCounter = 0;
function incrementModuleCounter() {
  sharedModuleCounter += 1;
  return sharedModuleCounter;
}

console.log("First consumer increment:", incrementModuleCounter());  // 1
console.log("Second consumer increment:", incrementModuleCounter()); // 2
console.log("Direct read of sharedModuleCounter:", sharedModuleCounter); // 2

console.log("\n=== 4. PRACTICAL ARCHITECTURE: BOUNDED LRU MODULE CACHE ===");

class BoundedLRUCache {
  constructor(maxCapacity = 3) {
    this.maxCapacity = maxCapacity;
    this.cacheMap = new Map();
  }

  get(key) {
    if (!this.cacheMap.has(key)) return null;
    // Re-insert to update LRU position
    const value = this.cacheMap.get(key);
    this.cacheMap.delete(key);
    this.cacheMap.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cacheMap.has(key)) {
      this.cacheMap.delete(key);
    } else if (this.cacheMap.size >= this.maxCapacity) {
      // Evict least recently used (first inserted key)
      const oldestKey = this.cacheMap.keys().next().value;
      console.log(`[Cache Eviction] Evicting oldest entry: ${oldestKey}`);
      this.cacheMap.delete(oldestKey);
    }
    this.cacheMap.set(key, value);
  }

  get size() {
    return this.cacheMap.size;
  }
}

const safeModuleCache = new BoundedLRUCache(3);
safeModuleCache.set("user_01", { name: "Alpha" });
safeModuleCache.set("user_02", { name: "Beta" });
safeModuleCache.set("user_03", { name: "Gamma" });
console.log("Cache capacity reached (3 items)");

// Inserting 4th item triggers eviction of user_01
safeModuleCache.set("user_04", { name: "Delta" });
console.log("user_01 retrieved after eviction:", safeModuleCache.get("user_01")); // null
console.log("user_04 retrieved (newest):", safeModuleCache.get("user_04").name);   // "Delta"

console.log("\n=== 5. PRACTICAL ARCHITECTURE: EXTERNAL STORE SYNCHRONIZER ===");

class ExternalStoreSynchronizer {
  constructor(initialState) {
    this.state = Object.freeze(initialState);
    this.subscribers = new Set();
  }

  getSnapshot = () => {
    return this.state;
  };

  subscribe = (callback) => {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  };

  setState = (nextState) => {
    this.state = Object.freeze({ ...this.state, ...nextState });
    this.subscribers.forEach(fn => fn());
  };
}

const appStore = new ExternalStoreSynchronizer({ theme: "dark", activeTab: "DASHBOARD" });

const unsubscribe = appStore.subscribe(() => {
  console.log("[Store Notification] State Updated:", appStore.getSnapshot());
});

appStore.setState({ theme: "light" });
appStore.setState({ activeTab: "SETTINGS" });
unsubscribe();
