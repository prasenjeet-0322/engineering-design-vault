/**
 * KPI 07 — Part 03: Object.create(), Null-Prototypes, getPrototypeOf(), setPrototypeOf() & Manipulation
 * Demonstrates:
 * 1. Gotcha: Null-Prototype Objects throwing on .hasOwnProperty() vs Object.hasOwn()
 * 2. Prediction 1: Object.create(proto, descriptors) and default property attributes
 * 3. Prediction 2: Dynamic Prototype Mutation with Object.setPrototypeOf()
 * 4. Prediction 3: Non-writable Prototype Property Shadowing Restrictions in Strict Mode
 * 5. Practical Architecture: Enterprise Hierarchical Scoped Configuration Manager
 */

"use strict";

console.log("=== 1. GOTCHA: NULL-PROTOTYPE DICTIONARY SAFETY ===");
const pureDictionary = Object.create(null);
pureDictionary.apiKey = "SK_PROD_9981";

console.log("pureDictionary prototype:", Object.getPrototypeOf(pureDictionary)); // null
console.log("pureDictionary.toString:", pureDictionary.toString); // undefined

try {
  pureDictionary.hasOwnProperty("apiKey");
} catch (err) {
  console.log("Calling .hasOwnProperty() caught:", err.name); // TypeError
}

// ✅ Safe inspection using Object.hasOwn()
console.log("Object.hasOwn(pureDictionary, 'apiKey'):", Object.hasOwn(pureDictionary, "apiKey")); // true

console.log("\n=== 2. PREDICTION 1: PROPERTY DESCRIPTORS IN OBJECT.CREATE ===");
const protoBase = { baseVal: 100 };
const childObj = Object.create(protoBase, {
  ownData: { value: 200 } // Default attributes: writable=false, enumerable=false, configurable=false
});

console.log("childObj.ownData:", childObj.ownData); // 200
console.log("Object.keys(childObj):", Object.keys(childObj)); // [] (non-enumerable by default!)
console.log("Object.hasOwn(childObj, 'ownData'):", Object.hasOwn(childObj, "ownData")); // true

console.log("\n=== 3. PREDICTION 2: DYNAMIC PROTOTYPE MUTATION ===");
const protoA = { label: "Source A" };
const protoB = { label: "Source B" };

const entity = Object.create(protoA);
console.log("Initial entity.label:", entity.label); // "Source A"

Object.setPrototypeOf(entity, protoB);
console.log("Mutated entity.label:", entity.label); // "Source B"
console.log("Prototype matches protoB?", Object.getPrototypeOf(entity) === protoB); // true

console.log("\n=== 4. PREDICTION 3: NON-WRITABLE PROTO SHADOWING RESTRICTION ===");
const frozenProto = Object.freeze({
  immutableVersion: "1.0.0"
});

const instance = Object.create(frozenProto);

try {
  instance.immutableVersion = "2.0.0"; // Strict mode prevents shadowing non-writable prototype property
} catch (err) {
  console.log("Shadowing frozen prototype property caught:", err.name); // TypeError
}

// Can only shadow via explicit defineProperty
Object.defineProperty(instance, "immutableVersion", {
  value: "2.0.0",
  writable: true
});
console.log("Explicitly shadowed immutableVersion:", instance.immutableVersion); // "2.0.0"

console.log("\n=== 5. PRACTICAL ARCHITECTURE: SCOPED CONFIG MANAGER ===");

class ScopedConfigManager {
  constructor(defaults) {
    this.baseConfig = { ...defaults };
    this.tenantConfig = Object.create(this.baseConfig);
    this.userConfig = Object.create(this.tenantConfig);
  }

  setTenantOverride(key, value) {
    this.tenantConfig[key] = value;
  }

  setUserOverride(key, value) {
    this.userConfig[key] = value;
  }

  get(key) {
    return this.userConfig[key];
  }

  isUserOverridden(key) {
    return Object.hasOwn(this.userConfig, key);
  }

  isTenantOverridden(key) {
    return Object.hasOwn(this.tenantConfig, key);
  }
}

const configMgr = new ScopedConfigManager({
  theme: "light",
  apiEndpoint: "https://api.cloud.io/v1",
  timeoutMs: 3000
});

// Tenant overrides theme
configMgr.setTenantOverride("theme", "dark");
configMgr.setTenantOverride("timeoutMs", 6000);

// User overrides only timeout
configMgr.setUserOverride("timeoutMs", 10000);

console.log("Effective theme (Tenant fallback):", configMgr.get("theme")); // "dark"
console.log("Effective timeout (User override):", configMgr.get("timeoutMs")); // 10000
console.log("Effective apiEndpoint (Base fallback):", configMgr.get("apiEndpoint")); // "https://api.cloud.io/v1"

console.log("Is theme overridden by user?", configMgr.isUserOverridden("theme")); // false
console.log("Is theme overridden by tenant?", configMgr.isTenantOverridden("theme")); // true
