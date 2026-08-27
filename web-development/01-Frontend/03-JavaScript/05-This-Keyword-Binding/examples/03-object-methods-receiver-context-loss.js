/**
 * KPI 05 — Part 03: Object Methods, Receiver Evaluation & Production Context Loss
 * Demonstrates:
 * 1. Gotcha: Destructuring Method Extraction Trap
 * 2. Prediction 1: Nested Property Receiver Resolution
 * 3. Prediction 2: Method Reassignment Across Distinct Objects
 * 4. Prediction 3: Comma Operator (0, obj.fn)() Stripping Reference Records
 * 5. Practical Architecture: Resilient Notification Stream Client with Callback Guards
 */

"use strict";

console.log("=== 1. PREDICTION 1: NESTED PROPERTY RECEIVER RESOLUTION ===");
const enterpriseApp = {
  name: "EnterpriseApp_Root",
  subsystem: {
    name: "AuthSubsystem_Child",
    identify() {
      return this.name;
    }
  }
};

// Evaluates with subsystem as immediate receiver, not enterpriseApp
console.log("enterpriseApp.subsystem.identify():", enterpriseApp.subsystem.identify()); // "AuthSubsystem_Child"

console.log("\n=== 2. GOTCHA: DESTRUCTURING METHOD EXTRACTION ===");
const databaseClient = {
  dbHost: "postgres.internal:5432",
  query() {
    return typeof this !== "undefined" && this ? `Connected to ${this.dbHost}` : "FATAL_RECEIVER_LOST";
  }
};

console.log("Direct method call:", databaseClient.query()); // "Connected to postgres.internal:5432"

const { query } = databaseClient;
console.log("Destructured function call:", query()); // "FATAL_RECEIVER_LOST"

console.log("\n=== 3. PREDICTION 2: METHOD REASSIGNMENT ACROSS OBJECTS ===");
const originalOwner = {
  id: "OWNER_001",
  getId() { return this.id; }
};

const borrowedOwner = {
  id: "BORROWED_002",
  getId: originalOwner.getId
};

console.log("borrowedOwner.getId():", borrowedOwner.getId()); // "BORROWED_002"

console.log("\n=== 4. PREDICTION 3: COMMA OPERATOR STRIPPING RECEIVERS ===");
const tokenService = {
  secret: "shh_jwt_key",
  getSecret() {
    return typeof this !== "undefined" && this ? this.secret : "RECEIVER_STRIPPED";
  }
};

console.log("Grouping expression (tokenService.getSecret)():", (tokenService.getSecret)()); // "shh_jwt_key"
console.log("Comma operator (0, tokenService.getSecret)():", (0, tokenService.getSecret)()); // "RECEIVER_STRIPPED"

console.log("\n=== 5. PRACTICAL ARCHITECTURE: RESILIENT NOTIFICATION STREAMER ===");

class NotificationStreamClient {
  constructor(serviceTag) {
    this.serviceTag = serviceTag;
    this.streamBuffer = [];

    // Explicit constructor binding protects public methods against callback detachment
    this.emitNotification = this.emitNotification.bind(this);
    this.flushBuffer = this.flushBuffer.bind(this);
  }

  emitNotification(message, level = "INFO") {
    if (!this || !this.serviceTag) {
      throw new Error("Receiver lost! NotificationStreamClient requires valid instance binding.");
    }
    const entry = {
      id: `evt_${Date.now()}`,
      tag: this.serviceTag,
      message,
      level
    };
    this.streamBuffer.push(entry);
    console.log(`[${this.serviceTag}] [${level}] ${message}`);
    return entry;
  }

  flushBuffer() {
    const count = this.streamBuffer.length;
    this.streamBuffer = [];
    console.log(`[${this.serviceTag}] Flushed ${count} events from buffer.`);
  }
}

const auditStream = new NotificationStreamClient("SECURITY_AUDIT");

// 1. Passing bound method directly as an async Promise callback (Safe due to constructor .bind())
Promise.resolve("Admin authenticated from IP 192.168.1.50")
  .then(auditStream.emitNotification);

// 2. Passing with an arrow wrapper (Safe and recommended)
Promise.resolve("Database migration completed successfully")
  .then((msg) => auditStream.emitNotification(msg, "SUCCESS"));

setTimeout(() => {
  auditStream.flushBuffer();
}, 20);
