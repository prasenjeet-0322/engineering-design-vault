/**
 * KPI 03 — Part 06: `this` Binding, Execution Context Receivers & Function Invocation Patterns
 * Demonstrates:
 * 1. Gotcha: Method Extraction & Receiver Loss
 * 2. Prediction 2: Arrow Function in Object Literal Trap
 * 3. Prediction 3: Hard Binding with bind() vs Overriding call()
 * 4. Prediction 4: Constructor Invocation with new
 * 5. Prediction 5: Callback Receiver Loss & Arrow Wrapper Fix
 * 6. Prediction 6: Lexical Arrow Capture in Constructor
 * 7. Practical Architecture: Telemetry Event Broadcaster with Bound Dispatchers
 */

console.log("=== 1. GOTCHA: METHOD EXTRACTION & RECEIVER LOSS ===");
const user = {
  name: "Sunny",
  greet() {
    return this ? this.name : "undefined_receiver";
  }
};

console.log("Direct method invocation:", user.greet()); // "Sunny"
const extractedGreet = user.greet;
console.log("Extracted invocation (plain call):", extractedGreet()); // "undefined_receiver" (in strict/module mode)

console.log("\n=== 2. PREDICTION 2: ARROW FUNCTION IN OBJECT LITERAL ===");
const arrowUser = {
  name: "Sunny",
  greet: () => {
    // @ts-ignore
    return typeof this !== "undefined" && this ? this.name : "outer_lexical_this";
  }
};
console.log("Arrow in object literal output:", arrowUser.greet()); // "outer_lexical_this"

console.log("\n=== 3. PREDICTION 3: HARD BINDING WITH BIND() ===");
const baseUser = { name: "Sunny" };
function getProfile() {
  return this.name;
}
const boundProfile = getProfile.bind(baseUser);
console.log("boundProfile():", boundProfile()); // "Sunny"
console.log("boundProfile.call({ name: 'Alex' }):", boundProfile.call({ name: "Alex" })); // "Sunny" (Cannot be overridden!)

console.log("\n=== 4. PREDICTION 4: CONSTRUCTOR INVOCATION WITH NEW ===");
function Account(id) {
  this.id = id;
}
const acc = new Account("acc_1001");
console.log("Constructed Account ID:", acc.id); // "acc_1001"

console.log("\n=== 5. PREDICTIONS 5 & 6: CALLBACK LOSS & LEXICAL ARROW IN CONSTRUCTOR ===");
function SafeUser(name) {
  this.name = name;
  // Lexically captures instance 'this' at construction time
  this.safeGreet = () => {
    return `Hello, ${this.name}`;
  };
}

const safeUserInstance = new SafeUser("Prasenjeet");
const extractedSafe = safeUserInstance.safeGreet;
console.log("Extracted safe arrow method output:", extractedSafe()); // "Hello, Prasenjeet"

console.log("\n=== 6. PRACTICAL ARCHITECTURE: TELEMETRY EVENT BROADCASTER ===");

class TelemetryBroadcaster {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.eventLog = [];
    // Autobind broadcast method for safe decoupling
    this.broadcast = this.broadcast.bind(this);
  }

  broadcast(eventName, payload = {}) {
    const entry = {
      service: this.serviceName,
      eventName,
      payload,
      timestamp: Date.now()
    };
    this.eventLog.push(entry);
    console.log(`[${this.serviceName}] Event '${eventName}' logged. Total events: ${this.eventLog.length}`);
    return entry;
  }
}

const broadcaster = new TelemetryBroadcaster("PaymentGateway");

// Method extracted and passed as raw callback
function simulateExternalTrigger(dispatchCallback) {
  dispatchCallback("PAYMENT_SUCCESS", { amount: 500 });
}

simulateExternalTrigger(broadcaster.broadcast);
