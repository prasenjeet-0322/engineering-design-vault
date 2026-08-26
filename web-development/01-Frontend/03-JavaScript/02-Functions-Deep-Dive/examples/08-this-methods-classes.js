/**
 * KPI 02 — Part 8: this, Method Binding, Constructors & Class Semantics
 * Demonstrates:
 * 1. Gotcha: Method Extraction & Lost Receiver Context
 * 2. Explicit Binding: call(), apply(), and bind()
 * 3. Prediction 2: Hard Binding Immutability
 * 4. Prediction 4: Arrow Function in Object Literal vs Lexical Method
 * 5. Prototype Methods vs Instance Arrow Fields
 * 6. Practical Architecture: Analytics SDK with Bound Handler Teardown
 */

"use strict";

console.log("=== 1. GOTCHA: METHOD EXTRACTION & LOST RECEIVER ===");
const account = {
  owner: "Sunny",
  balance: 1000,
  getBalance() {
    return `${this.owner} has ₹${this.balance}`;
  }
};

console.log("Implicit invocation:", account.getBalance()); // Works!

const extractedGetBalance = account.getBalance;
try {
  extractedGetBalance(); // Invoked without receiver in strict mode!
} catch (err) {
  console.log(`❌ Extracted invocation caught: ${err.name} - ${err.message}`);
}

console.log("\n=== 2. EXPLICIT BINDING: CALL, APPLY, BIND ===");
function formatTransaction(currency, fee) {
  return `${this.owner} paid ${currency}${this.balance + fee}`;
}

console.log("call(): ", formatTransaction.call(account, "₹", 50));
console.log("apply():", formatTransaction.apply(account, ["₹", 50]));

const boundTransaction = formatTransaction.bind(account, "₹");
console.log("bind(): ", boundTransaction(100));

console.log("\n=== 3. PREDICTION 2: BIND IMMUTABILITY ===");
const user = { name: "Sunny" };
function identify() { return this.name; }
const boundIdentify = identify.bind(user);

console.log("Bound to Sunny:", boundIdentify());
console.log("Attempting .call() with Hacker:", boundIdentify.call({ name: "Hacker" })); // Still "Sunny"!

console.log("\n=== 4. ARROW FUNCTION IN OBJECT LITERAL TRAP ===");
const profile = {
  name: "Sunny",
  regularMethod() { return this.name; },
  arrowMethod: () => {
    // Arrow inherits this from outer module scope, NOT profile object!
    return typeof this !== "undefined" ? this.name : undefined;
  }
};

console.log("profile.regularMethod():", profile.regularMethod()); // "Sunny"
console.log("profile.arrowMethod():  ", profile.arrowMethod());   // undefined

console.log("\n=== 5. PROTOTYPE METHODS VS INSTANCE ARROW FIELDS ===");
class PrototypeUser {
  constructor(name) { this.name = name; }
  greet() { return `Hello ${this.name}`; }
}

class ArrowFieldUser {
  constructor(name) { this.name = name; }
  greet = () => `Hello ${this.name}`;
}

const p1 = new PrototypeUser("Sunny");
const p2 = new PrototypeUser("Alex");
console.log("Prototype methods share identical function pointer:", p1.greet === p2.greet); // true ✅

const a1 = new ArrowFieldUser("Sunny");
const a2 = new ArrowFieldUser("Alex");
console.log("Arrow fields create new function pointer per instance:", a1.greet === a2.greet); // false ❌

console.log("\n=== 6. PRACTICAL ARCHITECTURE: ANALYTICS SDK TEARDOWN ===");

class MockDomDispatcher {
  constructor() { this.handlers = []; }
  addEventListener(event, fn) { this.handlers.push({ event, fn }); }
  removeEventListener(event, fn) {
    this.handlers = this.handlers.filter(h => h.fn !== fn);
  }
  dispatch(event) {
    console.log(`Dispatching '${event}' to ${this.handlers.length} listener(s)...`);
    this.handlers.forEach(h => h.fn({ event }));
  }
}

const mockWindow = new MockDomDispatcher();

class AnalyticsTracker {
  constructor(endpoint) {
    this.endpoint = endpoint;
    // Bound once in constructor: Preserves prototype methods while ensuring stable identity
    this.handleGlobalClick = this.handleGlobalClick.bind(this);
  }

  handleGlobalClick(e) {
    console.log(`[Analytics -> ${this.endpoint}] Tracked event:`, e.event);
  }

  register() {
    mockWindow.addEventListener("click", this.handleGlobalClick);
  }

  unregister() {
    mockWindow.removeEventListener("click", this.handleGlobalClick);
  }
}

const tracker = new AnalyticsTracker("https://telemetry.corp.internal");
tracker.register();
mockWindow.dispatch("click");

tracker.unregister();
console.log("After unregistering tracker:");
mockWindow.dispatch("click"); // 0 listeners!
