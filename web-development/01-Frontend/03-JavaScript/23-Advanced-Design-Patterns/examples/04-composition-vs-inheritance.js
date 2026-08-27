/**
 * KPI 23 — Part 04: Composition vs Inheritance Architecture
 * Demonstrates:
 * 1. Gotcha: Fragile Base Class Regression vs Explicit Composed Services
 * 2. Gotcha: Mixin Collision / Overwrite Hazards
 * 3. Prediction 1: Left-to-Right Functional Data Transformation Pipeline via `pipe()`
 * 4. Prediction 2: Multi-Capability Object Assembly via Dependency Injection
 * 5. Practical Architecture: Standalone Composable User & Audit Engine
 */

"use strict";

console.log("=== 1. GOTCHA: FRAGILE BASE CLASS VS COMPOSED SERVICES ===");

// Fragile Base Class simulation
class BaseDataStore {
  save(data) {
    console.log("  [BaseDataStore]: Step 1 - Generic DB Save");
    this.afterSave(data); // Expects child override
  }
  afterSave(data) {
    console.log("  [BaseDataStore]: Step 2 - Default AfterSave No-op");
  }
}

class AuditStore extends BaseDataStore {
  afterSave(data) {
    console.log("  [AuditStore]: Step 2 - Audit Log Created for ID:", data.id);
  }
}

const audit = new AuditStore();
console.log("  ▶️ Invoking Inherited Save:");
audit.save({ id: 101 });

// Solution: Explicit Composed Service with Dependency Injection
function createComposedAuditStore(dbClient, auditLogger) {
  return {
    async save(data) {
      console.log("  [ComposedStore]: Explicit step-by-step composition:");
      await dbClient.write(data);
      await auditLogger.record("DATA_SAVED", data);
    }
  };
}

const mockDb = { write: async (d) => console.log("    💾 [Composed DB]: Data persisted:", d.id) };
const mockAudit = { record: async (evt, d) => console.log(`    📜 [Composed Audit]: Event "${evt}" logged for:`, d.id) };
const composedStore = createComposedAuditStore(mockDb, mockAudit);
console.log("\n  ▶️ Invoking Composed Save:");
composedStore.save({ id: 202 });

console.log("\n=== 2. GOTCHA: MIXIN NAME COLLISION & OVERWRITE ===");

const withLogger = () => ({
  process: (val) => console.log("  [withLogger]: Processed log:", val)
});

const withTransformer = () => ({
  process: (val) => val.toUpperCase() // Same property name 'process'!
});

const composedMixin = {
  ...withLogger(),
  ...withTransformer() // 💥 Silently overwrites withLogger.process!
};

console.log("  Output of composedMixin.process('hello') (Overwritten!):", composedMixin.process("hello"));

console.log("\n=== 3. PREDICTIONS: FUNCTIONAL PIPELINE WITH PIPE() ===");

const pipe = (...fns) => (initialValue) => fns.reduce((acc, fn) => fn(acc), initialValue);

const trim = (str) => str.trim();
const toLower = (str) => str.toLowerCase();
const sanitize = (str) => str.replace(/[^a-z0-9_]/g, "");
const addPrefix = (str) => `usr_${str}`;

const formatUsername = pipe(trim, toLower, sanitize, addPrefix);

console.log("  Formatted Username Output:", formatUsername("  Sunny_Yadav!123  ")); // "usr_sunny_yadav123"

console.log("\n=== 4. PRACTICAL ARCHITECTURE: COMPOSED USER & CAPABILITY ENGINE ===");

// Independent Capability Factories
const createAuthCapability = (role) => ({
  role,
  hasPermission: (perm) => (role === "ADMIN" ? true : perm === "READ")
});

const createAnalyticsCapability = (tracker) => ({
  trackEvent: (event, payload) => tracker.log(`[ANALYTICS] ${event}`, payload)
});

const createNotificationCapability = (sender) => ({
  notify: (msg) => sender.send(`[NOTIFY] ${msg}`)
});

// Assembled Domain User Model
function createSystemUser(name, role, tracker, sender) {
  return {
    name,
    ...createAuthCapability(role),
    ...createAnalyticsCapability(tracker),
    ...createNotificationCapability(sender),
    getProfileSummary() {
      return `User: ${name} | Role: ${role}`;
    }
  };
}

const mockTracker = { log: (e, p) => console.log("    📊", e, p) };
const mockSender = { send: (m) => console.log("    🔔", m) };

const user = createSystemUser("Sunny Yadav", "ADMIN", mockTracker, mockSender);

console.log("  ▶️ User Profile:", user.getProfileSummary());
console.log("  ▶️ Check Permission 'DELETE_DB':", user.hasPermission("DELETE_DB"));
user.trackEvent("LOGIN_SUCCESS", { timestamp: Date.now() });
user.notify("Welcome to Senior Architecture Masterclass!");

console.log("\n  🎉 [Composition vs Inheritance Architecture Verification Completed Successfully!]");
