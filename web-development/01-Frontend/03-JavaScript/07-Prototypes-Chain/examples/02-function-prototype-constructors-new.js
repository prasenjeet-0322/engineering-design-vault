/**
 * KPI 07 — Part 02: Function .prototype, Constructor Functions, new & Instance-Prototype Linking
 * Demonstrates:
 * 1. Gotcha: instanceof Returning false After Prototype Object Reassignment
 * 2. Prediction 1: Shared Prototype Method Reference Equality
 * 3. Prediction 2: Instance-Prototype Linkage Before and After Reassignment
 * 4. Prediction 3: Constructor Return Overrides (Object vs Primitive)
 * 5. Prediction 4: Cross-Realm Array Verification (Array.isArray vs instanceof)
 * 6. Practical Architecture: Memory-Optimized Session Entity Manager with Prototype Methods
 */

"use strict";

console.log("=== 1. PREDICTION 1: SHARED PROTOTYPE METHOD EQUALITY ===");
function UserAccount(id, name) {
  this.id = id;
  this.name = name;
}
UserAccount.prototype.getName = function() {
  return this.name;
};

const userA = new UserAccount("usr_01", "Sunny");
const userB = new UserAccount("usr_02", "Alex");

console.log("Shared function pointer equality:", userA.getName === userB.getName); // true
console.log("userA.getName():", userA.getName()); // "Sunny"
console.log("userB.getName():", userB.getName()); // "Alex"

console.log("\n=== 2. GOTCHA: instanceof AFTER PROTOTYPE REASSIGNMENT ===");
function ClientDevice(deviceId) {
  this.deviceId = deviceId;
}

const device1 = new ClientDevice("DEV_ALPHA");

// Reassigning prototype object
ClientDevice.prototype = {
  ping() { return "PONG"; }
};

const device2 = new ClientDevice("DEV_BETA");

console.log("device1 instanceof ClientDevice:", device1 instanceof ClientDevice); // false (Gotcha!)
console.log("device2 instanceof ClientDevice:", device2 instanceof ClientDevice); // true
console.log("device1 can call ping?", typeof device1.ping); // undefined
console.log("device2 can call ping?", typeof device2.ping); // function

console.log("\n=== 3. PREDICTION 3: CONSTRUCTOR RETURN OVERRIDE ===");
function CustomTokenService() {
  this.token = "DEFAULT_TOKEN";
  return { token: "OVERRIDDEN_CUSTOM_TOKEN" }; // Overrides 'this'
}

const tokenInstance = new CustomTokenService();
console.log("tokenInstance.token:", tokenInstance.token); // "OVERRIDDEN_CUSTOM_TOKEN"
console.log("tokenInstance instanceof CustomTokenService:", tokenInstance instanceof CustomTokenService); // false

console.log("\n=== 4. PREDICTION 4: CROSS-REALM ARRAY CHECKING ===");
const simulatedForeignArray = Object.create(Array.prototype);
console.log("simulatedForeignArray instanceof Array:", simulatedForeignArray instanceof Array); // true
console.log("Array.isArray(simulatedForeignArray):", Array.isArray(simulatedForeignArray)); // false (Safe check!)

console.log("\n=== 5. PRACTICAL ARCHITECTURE: SESSION ENTITY MANAGER ===");

class UserSessionEntity {
  constructor(dto) {
    this.sessionId = dto.sessionId;
    this.userId = dto.userId;
    this.permissions = [...dto.permissions]; // Own property
    this.expiresAt = dto.expiresAt;
  }

  // Prototype method shared across all instances
  isExpired() {
    return Date.now() > this.expiresAt;
  }

  hasPermission(perm) {
    return this.permissions.includes(perm);
  }

  toDTO() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      permissions: [...this.permissions],
      expiresAt: this.expiresAt
    };
  }
}

// 1. Simulate 1,000 active user sessions sharing 1 set of prototype methods
const sessionDTO = {
  sessionId: "sess_9981",
  userId: "usr_sunny",
  permissions: ["READ", "WRITE", "ADMIN"],
  expiresAt: Date.now() + 60000
};

const session = new UserSessionEntity(sessionDTO);

console.log("Session Expired?", session.isExpired()); // false
console.log("Has Admin?", session.hasPermission("ADMIN")); // true

// 2. Serialize for network / React state boundary
const serializedDTO = session.toDTO();
console.log("Serialized DTO keys (Prototype methods stripped for wire):", Object.keys(serializedDTO));
