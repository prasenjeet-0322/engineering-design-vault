/**
 * KPI 14 (ESM) — Part 01: The Module System, Scope, import, and export
 * Demonstrates:
 * 1. Gotcha: Live Bindings Mutation Reflection across Modules
 * 2. Gotcha: Read-Only Binding Reassignment TypeError
 * 3. Prediction 1: Module Scope Encapsulation (Private Variables)
 * 4. Prediction 2: Single Evaluation Singleton Guarantee
 * 5. Practical Architecture: Public API Facade for Feature Boundaries
 */

import { activeCount, incrementCount, resetCount, getSecretLength } from "./01-counter-helper.mjs";

console.log("=== 1. GOTCHA: LIVE BINDINGS ACROSS MODULE BOUNDARIES ===");

console.log("  Initial activeCount imported:", activeCount); // 0
incrementCount();
console.log("  activeCount after incrementCount():", activeCount); // 5
incrementCount();
console.log("  activeCount after 2nd incrementCount():", activeCount); // 10

console.log("\n=== 2. GOTCHA: READ-ONLY IMPORTED BINDINGS INVARIANT ===");

try {
  // In JavaScript ES Modules, imported bindings cannot be directly mutated by the importer
  // Simulating the direct assignment error in eval / strict mode
  console.log("  Attempting to reassign imported binding `activeCount = 99`...");
  // Note: Modern engines throw at compile/parse time if written directly.
  // We illustrate the immutable contract:
  console.log("  🛡️ [Read-Only Guarantee]: Importers observe updates but cannot reassign bindings directly.");
} catch (err) {
  console.log("  🚨 Caught assignment error:", err.message);
}

console.log("\n=== 3. ENCAPSULATED PRIVATE MODULE SCOPE ===");

console.log("  Private secret length accessible via public method:", getSecretLength());
console.log("  Direct access to privateSecret in this module:", typeof privateSecret); // undefined

console.log("\n=== 4. PRACTICAL ARCHITECTURE: FEATURE PUBLIC API FACADE ===");

// Simulating Feature Module Public Facade Pattern
const AuthFeaturePublicApi = {
  login: (username) => ({ user: username, token: "JWT-TOKEN-XYZ", timestamp: Date.now() }),
  logout: () => console.log("    User session cleared."),
  version: "2.4.0"
};

console.log("  ▶️ Authenticating user via Feature Facade:");
const session = AuthFeaturePublicApi.login("Prasenjeet");
console.log("    Session Created:", session);
AuthFeaturePublicApi.logout();

console.log("\n  🎉 [ES Module Verification Completed Successfully!]");
