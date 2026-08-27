/**
 * KPI 05 — Part 05: Constructor Functions, Classes, `new` Binding & Instance Creation
 * Demonstrates:
 * 1. Gotcha: Class Prototype Method Extraction vs Arrow Class Field
 * 2. Prediction 1: Construction Protocol and Prototype Inheritance
 * 3. Prediction 2: Constructor Return Overrides (Object vs Primitive)
 * 4. Prediction 3: new.target Runtime Guard & Abstract Classes
 * 5. Prediction 4: Derived Class 'this' TDZ before super()
 * 6. Practical Architecture: High-Performance Multi-Tenant Cache Manager with Prototype Methods
 */

"use strict";

console.log("=== 1. PREDICTION 1: CONSTRUCTOR RETURN OVERRIDES ===");
function VehicleObjectReturn() {
  this.type = "Car";
  return { type: "Airplane" }; // Explicit object overrides 'this'
}

function VehiclePrimitiveReturn() {
  this.type = "Car";
  return 100; // Primitive return is ignored by 'new'
}

const v1 = new VehicleObjectReturn();
const v2 = new VehiclePrimitiveReturn();

console.log("Object return type:", v1.type); // "Airplane"
console.log("Primitive return type:", v2.type); // "Car"

console.log("\n=== 2. GOTCHA: PROTOTYPE METHOD VS ARROW FIELD ===");
class ServiceController {
  constructor(tag) {
    this.tag = tag;
  }

  // Stored once on ServiceController.prototype
  prototypeMethod() {
    return typeof this !== "undefined" && this ? `[Proto] ${this.tag}` : "[Proto] RECEIVER_LOST";
  }

  // Stored as new closure on EACH created instance
  arrowField = () => {
    return typeof this !== "undefined" && this ? `[Arrow] ${this.tag}` : "[Arrow] RECEIVER_LOST";
  };
}

const s1 = new ServiceController("Billing");
const s2 = new ServiceController("Auth");

console.log("Prototype methods shared?", s1.prototypeMethod === s2.prototypeMethod); // true
console.log("Arrow fields shared?", s1.arrowField === s2.arrowField); // false

// Method extraction test
const extractedProto = s1.prototypeMethod;
const extractedArrow = s1.arrowField;

console.log("Extracted prototype call:", extractedProto()); // "[Proto] RECEIVER_LOST"
console.log("Extracted arrow call:", extractedArrow()); // "[Arrow] Billing"

console.log("\n=== 3. PREDICTION 3: new.target META-PROPERTY GUARD ===");
class AbstractRepository {
  constructor(tableName) {
    if (new.target === AbstractRepository) {
      throw new Error("Cannot instantiate AbstractRepository directly.");
    }
    this.tableName = tableName;
  }
}

class UserRepository extends AbstractRepository {
  constructor() {
    super("users");
  }
}

try {
  new AbstractRepository("forbidden");
} catch (err) {
  console.log("Abstract instantiation caught:", err.message);
}

const userRepo = new UserRepository();
console.log("Subclass instantiation success on table:", userRepo.tableName);

console.log("\n=== 4. PREDICTION 4: DERIVED CLASS THIS TDZ ===");
class BaseEntity {
  constructor(id) {
    this.id = id;
  }
}

class DerivedEntity extends BaseEntity {
  constructor(id, label) {
    // Attempting to access 'this' before super()
    try {
      this.label = label;
    } catch (e) {
      console.log("Accessing 'this' before super() caught:", e.name); // ReferenceError
    }
    super(id);
    this.label = label; // ✅ Valid after super()
  }
}
new DerivedEntity("ent_99", "Metrics");

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-TENANT CACHE MANAGER ===");

class TenantCacheClient {
  constructor(tenantId, ttlMs = 5000) {
    this.tenantId = tenantId;
    this.ttlMs = ttlMs;
    this.store = new Map();

    // Explicit constructor binding maintains prototype sharing while ensuring callback safety
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.clear = this.clear.bind(this);
  }

  // Shared prototype method
  set(key, value) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    console.log(`[Cache:${this.tenantId}] Stored key "${key}"`);
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  clear() {
    this.store.clear();
  }
}

const tenantA = new TenantCacheClient("TENANT_CORP_A");
tenantA.set("CFG_THEME", "DARK_MODE");

// Detached callback execution test
const detachedSetter = tenantA.set;
detachedSetter("CFG_LANG", "EN_US"); // Works cleanly due to constructor .bind()

console.log("Retrieved theme:", tenantA.get("CFG_THEME"));
console.log("Retrieved lang:", tenantA.get("CFG_LANG"));
