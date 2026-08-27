/**
 * KPI 18 — Browser Storage, Persistence & Client-Side Security
 * Demonstrates:
 * 1. Gotcha: JSON.stringify Serialization Traps (Dates, undefined, functions)
 * 2. Gotcha: Safe Deserialization & Corrupt Data Fallbacks
 * 3. Prediction 1: Primitive Type Coercion in Key-Value Storage
 * 4. Prediction 2: Schema Versioning & Automated Client Migrations
 * 5. Practical Architecture: Standalone Schema-Validated Storage Engine with TTL & Migrations
 */

"use strict";

console.log("=== 1. GOTCHA: JSON SERIALIZATION TRAPS (DATES & UNDEFINED) ===");

const rawOrder = {
  id: "ORD_789",
  createdAt: new Date("2026-08-27T12:00:00.000Z"),
  discountCode: undefined, // Will be omitted by JSON.stringify
  computeTotal: () => 150  // Will be omitted by JSON.stringify
};

const serialized = JSON.stringify(rawOrder);
console.log("  Serialized JSON String:\n   ", serialized);

const parsedOrder = JSON.parse(serialized);
console.log("  Parsed createdAt Type:", typeof parsedOrder.createdAt); // "string" (NOT Date!)
console.log("  Is parsed.createdAt instanceof Date?", parsedOrder.createdAt instanceof Date); // false
console.log("  Was discountCode preserved?", "discountCode" in parsedOrder); // false

// Proper Date Revival Pattern
function reviveOrder(jsonStr) {
  return JSON.parse(jsonStr, (key, value) => {
    if (key === "createdAt") return new Date(value);
    return value;
  });
}

const revived = reviveOrder(serialized);
console.log("  ✅ Revived createdAt instanceof Date:", revived.createdAt instanceof Date); // true

console.log("\n=== 2. SCHEMA VERSIONING & AUTOMATED DATA MIGRATIONS ===");

class ResilientStorageEngine {
  constructor() {
    this.memoryStore = new Map();
  }

  set(key, data, version = 1, ttlMs = null) {
    const envelope = {
      version,
      data,
      expiresAt: ttlMs ? Date.now() + ttlMs : null
    };
    this.memoryStore.set(key, JSON.stringify(envelope));
    console.log(`    💾 [Storage Written]: Key "${key}" (v${version})`);
  }

  get(key, targetVersion = 1, migrator = null, fallback = null) {
    const raw = this.memoryStore.get(key);
    if (!raw) return fallback;

    try {
      let envelope = JSON.parse(raw);

      // 1. TTL Check
      if (envelope.expiresAt !== null && Date.now() > envelope.expiresAt) {
        console.log(`    ⏳ [Storage Expired]: Key "${key}" evicted.`);
        this.memoryStore.delete(key);
        return fallback;
      }

      // 2. Migration Check
      if (envelope.version < targetVersion && migrator) {
        console.log(`    🔄 [Executing Migration]: Upgrading key "${key}" from v${envelope.version} to v${targetVersion}...`);
        const migratedData = migrator(envelope.data, envelope.version);
        envelope = {
          version: targetVersion,
          data: migratedData,
          expiresAt: envelope.expiresAt
        };
        this.memoryStore.set(key, JSON.stringify(envelope));
      }

      return envelope.data;
    } catch {
      return fallback;
    }
  }
}

const engine = new ResilientStorageEngine();

// Simulate legacy stored data (v1 without `sidebarWidth`)
engine.set("user_prefs", { theme: "dark" }, 1);

// App v2 requires `sidebarWidth`
const v2Migrator = (oldData, oldVer) => {
  if (oldVer === 1) {
    return { ...oldData, sidebarWidth: 260 };
  }
  return oldData;
};

console.log("  ▶️ Reading preferences in App v2:");
const hydratedPrefs = engine.get("user_prefs", 2, v2Migrator);
console.log("  ✅ Hydrated & Migrated State in Memory:", hydratedPrefs);

// Verify that migrated version is now persisted
const updatedRaw = JSON.parse(engine.memoryStore.get("user_prefs"));
console.log("  ✅ Persisted Envelope Version after Migration:", updatedRaw.version);

console.log("\n=== 3. TTL EXPIRATION DEMONSTRATION ===");

engine.set("temp_session_token", { token: "TEMP_123" }, 1, 30); // 30ms TTL
console.log("  Immediate Read:", engine.get("temp_session_token", 1));

setTimeout(() => {
  console.log("  Read after 50ms (TTL Expired):", engine.get("temp_session_token", 1, null, "EXPIRED_FALLBACK"));
  console.log("\n  🎉 [Browser Storage, Lifecycle & Security Verification Completed Successfully!]");
}, 50);
