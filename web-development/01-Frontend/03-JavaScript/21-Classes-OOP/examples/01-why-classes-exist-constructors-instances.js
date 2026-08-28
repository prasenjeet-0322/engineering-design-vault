/**
 * KPI 21 — Part 01: Why Classes Exist, Constructors & Instances
 * Demonstrates:
 * 1. Gotcha: Prototype Method Sharing vs Arrow Function Field Memory Duplication
 * 2. Gotcha: Extracted Method `this` Context Loss in Class Strict Mode
 * 3. Prediction 1: Constructor Return Override Mechanics
 * 4. Prediction 2: Prototype Delegation Chain Verification
 * 5. Practical Architecture: Standalone Stateful Connection Manager Class
 */

"use strict";

console.log("=== 1. GOTCHA: PROTOTYPE METHOD SHARING VS ARROW FUNCTION MEMORY ALLOCATION ===");

class UserAccount {
  constructor(name) {
    this.name = name;
  }

  // 🟢 Prototype Method: Shared across all instances on UserAccount.prototype
  greet() {
    return `Hello, ${this.name}`;
  }

  // 💥 Arrow Function Class Field: Duplicated as an own property for EVERY instance!
  arrowGreet = () => {
    return `Hello, ${this.name}`;
  };
}

const user1 = new UserAccount("Sunny");
const user2 = new UserAccount("Alice");

console.log("  Prototype Method Shared Reference Identity:", user1.greet === user2.greet); // true
console.log("  Arrow Function Field Shared Reference Identity:", user1.arrowGreet === user2.arrowGreet); // false (Duplicated in memory!)

console.log("\n=== 2. GOTCHA: EXTRACTED METHOD THIS CONTEXT LOSS ===");

const extractedGreet = user1.greet;
try {
  extractedGreet();
} catch (err) {
  console.log("  ✅ Extracted method call without receiver threw:", err.name); // TypeError
}

console.log("\n=== 3. PREDICTION: CONSTRUCTOR RETURN OVERRIDE ===");

class OverriddenClass {
  constructor() {
    this.status = "INITIAL";
    return { status: "OVERRIDDEN_OBJECT" }; // Explicit object return
  }
}

const instance = new OverriddenClass();
console.log("  Instance Status:", instance.status);
console.log("  Is instance of OverriddenClass?:", instance instanceof OverriddenClass); // false

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STATEFUL SDK CLIENT CLASS ===");

class WebSocketConnectionManager {
  constructor(url) {
    this.url = url;
    this.status = "DISCONNECTED";
    this.eventListeners = new Set();
  }

  // Prototype methods
  connect() {
    this.status = "CONNECTING";
    console.log(`    🔌 [WS Client]: Connecting to ${this.url}...`);
    this.status = "CONNECTED";
    this.notify();
  }

  disconnect() {
    this.status = "DISCONNECTED";
    console.log(`    🛑 [WS Client]: Disconnected from ${this.url}`);
    this.notify();
  }

  subscribe(listener) {
    this.eventListeners.add(listener);
    listener(this.status);
    return () => this.eventListeners.delete(listener);
  }

  notify() {
    this.eventListeners.forEach((fn) => fn(this.status));
  }
}

const wsClient = new WebSocketConnectionManager("wss://api.vault.com/stream");

const unsubscribe = wsClient.subscribe((status) => {
  console.log("    📢 [Subscriber Notification]: Status is now ->", status);
});

wsClient.connect();
wsClient.disconnect();
unsubscribe();

console.log("\n  🎉 [Why Classes Exist, Constructors & Instances Verification Completed Successfully!]");
