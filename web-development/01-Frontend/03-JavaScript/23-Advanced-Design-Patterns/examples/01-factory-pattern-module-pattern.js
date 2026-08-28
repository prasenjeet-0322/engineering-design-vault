/**
 * KPI 23 — Part 01: Factory Pattern & Module Pattern
 * Demonstrates:
 * 1. Gotcha: Closure Variable vs Object Property Desync in Factory Functions
 * 2. Gotcha: Revealing Module Pattern (IIFE) with Private State Protection
 * 3. Prediction 1: Independent Lexical Closure Counters across Factory Instances
 * 4. Prediction 2: Dependency Injection via Service Factory
 * 5. Practical Architecture: Standalone Modular Todo & Analytics Service Factory
 */

"use strict";

console.log("=== 1. GOTCHA: CLOSURE VARIABLE VS OBJECT PROPERTY DESYNC ===");

function createUserWithDesync(initialName) {
  let name = initialName;
  return {
    name, // Own property
    rename(newName) {
      name = newName; // Mutates closure variable
    },
    getName() {
      return name; // Reads closure variable
    }
  };
}

const user = createUserWithDesync("Sunny");
console.log("  Initial user.name property:", user.name); // "Sunny"

user.name = "Alex"; // Mutates object property only
console.log("  After mutating user.name directly:", user.name); // "Alex"
console.log("  Result from user.getName() (Reads closure!):", user.getName()); // "Sunny" (Desynchronized!)

console.log("\n=== 2. GOTCHA: REVEALING MODULE PATTERN (IIFE) ENCAPSULATION ===");

const UserRegistryModule = (() => {
  const users = []; // Private internal array

  function validate(name) {
    return typeof name === "string" && name.trim().length > 0;
  }

  function register(name, role = "USER") {
    if (!validate(name)) throw new Error("Invalid username");
    const userObj = { id: users.length + 1, name, role };
    users.push(userObj);
    return userObj;
  }

  function getAll() {
    return [...users]; // Defensive copy
  }

  // Reveal public API
  return {
    register,
    getAll
  };
})();

UserRegistryModule.register("Sunny", "ADMIN");
UserRegistryModule.register("Alice", "EDITOR");

console.log("  Registered Users:", UserRegistryModule.getAll());
console.log("  Attempting direct access to UserRegistryModule.users:", UserRegistryModule.users); // undefined

console.log("\n=== 3. PREDICTIONS: INDEPENDENT CLOSURES & DEPENDENCY INJECTION ===");

function createCounter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count
  };
}

const c1 = createCounter();
const c2 = createCounter();
c1.inc();
c1.inc();
c2.inc();
console.log("  c1 value (Expected 2):", c1.get());
console.log("  c2 value (Expected 1):", c2.get());

// Dependency Injection Factory
function createDataService(apiClient) {
  return {
    loadUser: (id) => apiClient.get(`/users/${id}`)
  };
}

const mockApiClient = {
  get: (url) => `Mock Response for ${url}`
};
const service = createDataService(mockApiClient);
console.log("  Injected Service Output:", service.loadUser(42));

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE MODULAR SERVICE FACTORY ===");

function createTodoService(storageClient, analyticsClient) {
  const todos = [];

  return {
    async create(title) {
      const item = { id: `todo_${Date.now()}`, title, done: false };
      todos.push(item);

      if (storageClient) await storageClient.save(todos);
      if (analyticsClient) analyticsClient.track("TODO_CREATED", { id: item.id });

      return item;
    },

    list() {
      return [...todos];
    }
  };
}

// Instantiate with Mock Dependencies
const mockStorage = { save: async (data) => console.log("    💾 [Storage Injected]: Saved items:", data.length) };
const mockAnalytics = { track: (evt, payload) => console.log(`    📊 [Analytics Injected]: Event "${evt}"`, payload) };

const todoService = createTodoService(mockStorage, mockAnalytics);

async function runDemo() {
  await todoService.create("Master KPI 23 Design Patterns");
  await todoService.create("Implement Observer and PubSub Architecture");
  console.log("  Final In-Memory Todos:", todoService.list());
  console.log("\n  🎉 [Factory Pattern & Module Pattern Verification Completed Successfully!]");
}

runDemo();
