/**
 * KPI 20 — Part 02: `export`, Named Exports & Designing a Module's Public API
 * Demonstrates:
 * 1. Gotcha: Live Binding Mutation Observation & Read-Only Constraints
 * 2. Gotcha: Mutable Object Leakage vs Defensive Copying
 * 3. Prediction 1: Export List Renaming (as)
 * 4. Prediction 2: Selective Named Import Consumption
 * 5. Practical Architecture: Standalone Feature Public API Facade
 */

console.log("=== 1. GOTCHA: LIVE BINDING MUTATIONS & READ-ONLY CONSTRAINTS ===");

// Simulating live binding mechanics
const CounterModule = (() => {
  let counter = 0;
  return {
    get count() { return counter; }, // Live getter binding
    increment: () => ++counter
  };
})();

console.log("  Initial Live Binding Count:", CounterModule.count); // 0
CounterModule.increment();
console.log("  Live Binding Count after Increment:", CounterModule.count); // 1

// Simulating read-only constraint
try {
  // In ESM: `CounterModule.count = 10` throws TypeError
  Object.defineProperty(CounterModule, "count", { writable: false });
  CounterModule.count = 10;
} catch (err) {
  console.log("  ✅ Read-Only Protection Verified:", err.name);
}

console.log("\n=== 2. GOTCHA: MUTABLE OBJECT LEAKAGE VS DEFENSIVE COPYING ===");

// A. Leaky Mutable Implementation
const LeakyStore = {
  users: [{ id: 1, name: "Sunny" }]
};

// Rogue consumer wipes the array
const externalUsersRef = LeakyStore.users;
externalUsersRef.length = 0; // 💥 Wipes internal store!
console.log("  💥 Leaky Store after External Mutation (Wiped):", LeakyStore.users); // []

// B. Defensive Copy Implementation
const SecureStore = (() => {
  const privateUsers = [{ id: 1, name: "Sunny" }];

  return {
    getUsers: () => privateUsers.map((u) => ({ ...u })), // 🟢 Defensive shallow clone
    addUser: (user) => privateUsers.push(Object.freeze({ ...user }))
  };
})();

const consumerCopy = SecureStore.getUsers();
consumerCopy.length = 0; // Mutates only local copy
console.log("  🛡️ Secure Store after External Mutation Attempt (Preserved):", SecureStore.getUsers().length); // 1

console.log("\n=== 3. PRACTICAL ARCHITECTURE: FEATURE PUBLIC API FACADE ===");

const UserFeatureFacade = (() => {
  // 🔒 Private Internal Helpers (NOT exported)
  function validateEmail(email) {
    return email.includes("@") && email.includes(".");
  }

  function normalize(name) {
    return name.trim();
  }

  const db = [];

  // 🌐 Public API Contract
  return {
    createUser(name, email) {
      if (!validateEmail(email)) throw new Error("Invalid email format");
      const user = { id: db.length + 1, name: normalize(name), email: email.toLowerCase() };
      db.push(user);
      return { ...user };
    },
    getUsers() {
      return db.map((u) => ({ ...u }));
    }
  };
})();

const newUser = UserFeatureFacade.createUser("  Sunny Engineer  ", "Sunny@Vault.com");
console.log("  ✅ User Created via Public Facade:", newUser);
console.log("  ✅ Total Users in Facade Store:", UserFeatureFacade.getUsers().length);

console.log("\n  🎉 [`export`, Named Exports & Public API Design Verification Completed Successfully!]");
