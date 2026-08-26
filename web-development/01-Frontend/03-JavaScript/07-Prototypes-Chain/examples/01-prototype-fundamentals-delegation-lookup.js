/**
 * KPI 07 — Part 01: Prototype Fundamentals, [[Prototype]], Delegation & Property Lookup
 * Demonstrates:
 * 1. Gotcha: Object.hasOwn() vs Inherited Properties & Object.create(null)
 * 2. Prediction 1: Property Lookup Delegation and Object.getPrototypeOf()
 * 3. Prediction 2: Property Shadowing Preserving Base Prototype Values
 * 4. Prediction 3: Prototype Method Invocation with Dynamic Receiver 'this'
 * 5. Prediction 4: The Shared Mutable Prototype Reference Trap
 * 6. Practical Architecture: Secure Plugin Registry with Null-Prototype Dictionaries
 */

"use strict";

console.log("=== 1. PREDICTION 1: PROPERTY LOOKUP & GETPROTOTYPEOF ===");
const baseConfig = { env: "STAGING", port: 3000 };
const appConfig = Object.create(baseConfig);
appConfig.port = 8080; // Own property shadows inherited port

console.log("Inherited env:", appConfig.env); // "STAGING"
console.log("Shadowed port:", appConfig.port); // 8080
console.log("Base prototype port:", baseConfig.port); // 3000

console.log("Object.hasOwn(appConfig, 'env'):", Object.hasOwn(appConfig, "env")); // false
console.log("Object.hasOwn(appConfig, 'port'):", Object.hasOwn(appConfig, "port")); // true
console.log("'env' in appConfig:", "env" in appConfig); // true

console.log("\n=== 2. PREDICTION 2: SHARED MUTABLE PROTOTYPE TRAP ===");
const rolePrototype = {
  permissions: ["READ"]
};

const userA = Object.create(rolePrototype);
const userB = Object.create(rolePrototype);

// ❌ Mutating shared array on prototype
userA.permissions.push("WRITE");

console.log("userB permissions:", userB.permissions); // ["READ", "WRITE"] (Shared mutation!)
console.log("userA has own 'permissions'?", Object.hasOwn(userA, "permissions")); // false

// ✅ Fix: Initialize mutable state as own property
userA.permissions = ["READ", "WRITE", "DELETE"]; // Shadowing creates own property
console.log("userA has own permissions now?", Object.hasOwn(userA, "permissions")); // true

console.log("\n=== 3. PREDICTION 3: PROTOTYPE METHOD WITH DYNAMIC THIS ===");
const entityProto = {
  id: "DEFAULT_ENTITY",
  identify() {
    return `[EntityID]: ${this.id}`;
  }
};

const customEntity = Object.create(entityProto);
customEntity.id = "CUSTOM_NODE_99";

console.log("customEntity.identify():", customEntity.identify()); // "[EntityID]: CUSTOM_NODE_99"
console.log("entityProto.identify():", entityProto.identify());   // "[EntityID]: DEFAULT_ENTITY"

console.log("\n=== 4. GOTCHA: NULL-PROTOTYPE DICTIONARY SAFETY ===");
const nullMap = Object.create(null);
nullMap.apiKey = "secret_key_123";

console.log("nullMap prototype:", Object.getPrototypeOf(nullMap)); // null

try {
  // Calling hasOwnProperty throws because prototype is null
  nullMap.hasOwnProperty("apiKey");
} catch (err) {
  console.log("nullMap.hasOwnProperty caught:", err.name); // TypeError
}

// Object.hasOwn() executes safely on null-prototype objects
console.log("Object.hasOwn(nullMap, 'apiKey'):", Object.hasOwn(nullMap, "apiKey")); // true

console.log("\n=== 5. PRACTICAL ARCHITECTURE: SECURE PLUGIN REGISTRY ===");

class SecurePluginRegistry {
  constructor() {
    // Null-prototype dictionary guarantees zero inherited key collisions
    this.plugins = Object.create(null);
  }

  registerPlugin(id, name, handler) {
    if (id === "__proto__" || id === "prototype" || id === "constructor") {
      throw new Error(`Security Violation: Illegal plugin ID "${id}"`);
    }
    this.plugins[id] = { id, name, handler };
    console.log(`[PluginRegistry] Registered: ${name} (ID: ${id})`);
  }

  execute(id, payload) {
    if (!Object.hasOwn(this.plugins, id)) {
      throw new Error(`Plugin not registered: "${id}"`);
    }
    return this.plugins[id].handler(payload);
  }
}

const registry = new SecurePluginRegistry();
registry.registerPlugin("compressor", "GZIP Compressor", (data) => `Compressed(${data})`);
registry.registerPlugin("encryptor", "AES Encryptor", (data) => `Encrypted(${data})`);

console.log(registry.execute("compressor", "UserPayload_1024"));
console.log(registry.execute("encryptor", "SecretToken_889"));
