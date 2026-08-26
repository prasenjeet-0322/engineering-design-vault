/**
 * KPI 05 — Part 02: Regular Function Invocation, Default `this` & Strict Mode
 * Demonstrates:
 * 1. Gotcha: Strict Mode Plain Function `this === undefined` vs Sloppy Coercion
 * 2. Prediction 1: Nested Regular Function `this` Reset inside Methods
 * 3. Prediction 2: Array Method Callback Context Loss and `thisArg` Solutions
 * 4. Prediction 3: `const self = this` vs Arrow Lexical Capture vs `.bind()`
 * 5. Practical Architecture: Environment-Safe Multi-Runtime Config Injector
 */

"use strict";

console.log("=== 1. GOTCHA: STRICT MODE PLAIN FUNCTION INVOCATION ===");
function getPort() {
  return typeof this !== "undefined" && this ? this.PORT : "UNDEFINED_RECEIVER";
}

console.log("Plain function call result in strict mode:", getPort()); // "UNDEFINED_RECEIVER"

console.log("\n=== 2. PREDICTION 1: NESTED REGULAR FUNCTION THIS RESET ===");
const user = {
  name: "Sunny",
  getGreeting() {
    console.log("Outer method 'this.name':", this.name);

    function innerHelper() {
      // ❌ Inner regular function does NOT inherit outer 'this'
      return typeof this !== "undefined" && this ? this.name : "inner_this_is_undefined";
    }

    return innerHelper();
  }
};

console.log("user.getGreeting():", user.getGreeting()); // "inner_this_is_undefined"

console.log("\n=== 3. PREDICTION 2: ARRAY METHOD CALLBACK CONTEXT LOSS ===");
const prefixLogger = {
  prefix: "[SYS_LOG]: ",
  logWithArrow(messages) {
    // ✅ Solution 1: Arrow function captures outer lexical 'this'
    return messages.map(msg => this.prefix + msg);
  },
  logWithThisArg(messages) {
    // ✅ Solution 2: Explicitly pass 'this' as 2nd argument (thisArg)
    return messages.map(function(msg) {
      return this.prefix + msg;
    }, this);
  }
};

const logs = ["Server Started", "Listening on port 3000"];
console.log("Arrow solution:", prefixLogger.logWithArrow(logs));
console.log("thisArg solution:", prefixLogger.logWithThisArg(logs));

console.log("\n=== 4. PREDICTION 3: LEGACY SELF VS ARROW FUNCTIONS ===");
const legacyService = {
  serviceId: "srv_auth_01",
  process() {
    const self = this; // Legacy pattern before ES6 arrows
    setTimeout(function() {
      console.log("Legacy self access:", self.serviceId);
    }, 10);
  }
};
legacyService.process();

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-RUNTIME CONFIG INJECTOR ===");

/**
 * Portable Environment Resolver
 * Resolves the true global realm without relying on 'this === window'
 */
function resolveGlobalRealm() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  return {};
}

/**
 * Enterprise Config Injector using Dependency Inversion
 * Completely decouples business logic from dynamic/global 'this'
 */
class ConfigurationManager {
  constructor(initialConfig = {}) {
    this.configStore = new Map(Object.entries(initialConfig));
  }

  // Pure functional method: requires explicit argument or store lookup
  get(key, defaultValue = undefined) {
    return this.configStore.has(key) ? this.configStore.get(key) : defaultValue;
  }

  set(key, value) {
    this.configStore.set(key, value);
  }
}

// 1. Instantiate explicit manager
const appConfig = new ConfigurationManager({
  API_URL: "https://api.enterprise.com/v2",
  TIMEOUT_MS: 5000,
  ENABLE_ANALYTICS: true
});

// 2. Pure function with explicit injection (Senior standard over 'this.API_URL')
function createApiClient(config) {
  const baseUrl = config.get("API_URL", "https://fallback.com");
  const timeout = config.get("TIMEOUT_MS", 3000);

  return {
    fetchData: (path) => {
      console.log(`[API Client] Requesting ${baseUrl}${path} with timeout ${timeout}ms`);
    }
  };
}

const client = createApiClient(appConfig);
client.fetchData("/users/profile");

console.log("Global Realm detected:", typeof resolveGlobalRealm());
