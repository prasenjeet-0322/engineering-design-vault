/**
 * KPI 20 — Part 01: Why Modules Exist, ES Modules & Module Scope
 * Demonstrates:
 * 1. Gotcha: Module-Level State Singleton Evaluation across Importers
 * 2. Gotcha: Private Unexported Variable Scope Isolation
 * 3. Prediction 1: Top-Level `this === undefined` in ESM
 * 4. Prediction 2: Public API Facade with Encapsulated Private Cache
 * 5. Practical Architecture: Standalone Modular Engine with Scope Encapsulation
 */

// Supporting Helper Modules Inline Simulation for Node ESM runner
console.log("=== 1. GOTCHA: MODULE SCOPE ENCAPSULATION & PRIVATE VARIABLES ===");

// Simulating Module A scope via closure
const ModuleA = (() => {
  const privateSecret = "SUPER_SECRET_KEY_999"; // Private (Not exported)

  function publicGetMetadata() {
    return { name: "ModuleA", authorized: true };
  }

  return { publicGetMetadata };
})();

console.log("  Public API Result:", ModuleA.publicGetMetadata());
console.log("  Is privateSecret accessible outside Module A?", "privateSecret" in ModuleA); // false

console.log("\n=== 2. GOTCHA: MODULE-LEVEL SINGLETON STATE EVALUATION ===");

// Simulating a stateful ESM module evaluated once in the graph
const StatefulModule = (() => {
  let hitCount = 0; // Shared module-level state

  return {
    recordHit: () => ++hitCount,
    getHits: () => hitCount
  };
})();

// Consumer 1 interacts
console.log("  Consumer 1 records hit -> New Count:", StatefulModule.recordHit()); // 1

// Consumer 2 interacts with the same module instance
console.log("  Consumer 2 records hit -> New Count:", StatefulModule.recordHit()); // 2
console.log("  Consumer 3 reads count -> Total Hits:", StatefulModule.getHits());    // 2

console.log("\n=== 3. TOP-LEVEL THIS EVALUATION IN ESM ===");
// In ESM, top-level `this` evaluates to `undefined`
const isThisUndefined = typeof this === "undefined";
console.log("  Is top-level `this` strictly undefined in ESM?", isThisUndefined);

console.log("\n=== 4. PRACTICAL ARCHITECTURE: FEATURE SERVICE WITH PRIVATE ENCAPSULATED CACHE ===");

const usersService = (() => {
  // Private In-Memory Cache (NOT exported)
  const userCache = new Map();

  function sanitize(name) {
    return name.trim();
  }

  return {
    getUser(id) {
      if (userCache.has(id)) {
        console.log(`    💾 [Cache Hit]: Returning cached user #${id}`);
        return userCache.get(id);
      }
      console.log(`    🌐 [Cache Miss]: Creating and caching user #${id}`);
      const user = { id, name: sanitize(`  Engineer ${id}  `), role: "DEVELOPER" };
      userCache.set(id, user);
      return user;
    },
    clearCache() {
      userCache.clear();
      console.log("    🧹 [Cache Purged]: Module cache emptied.");
    }
  };
})();

console.log("  Query 1:", usersService.getUser(101));
console.log("  Query 2:", usersService.getUser(101)); // Cache hit!

console.log("\n  🎉 [Why Modules Exist, ES Modules & Module Scope Verification Completed Successfully!]");
