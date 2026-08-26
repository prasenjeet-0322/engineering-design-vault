/**
 * KPI 04 — Part 04: `this` Binding — Call-Site Semantics, Arrow Functions, Classes & React Patterns
 * Demonstrates:
 * 1. Gotcha: Destructuring Method Extraction & Loss of Receiver
 * 2. Prediction 1: Plain Function Extraction in Strict Mode
 * 3. Prediction 2: Class Method Extraction in Callbacks (setTimeout)
 * 4. Prediction 3: Same Function Object with Different Call-Site Receivers
 * 5. Prediction 4: Arrow Function Inside Object Literal Trap
 * 6. Prediction 5: bind() Unique Function Identity Comparison
 * 7. Practical Architecture: Resilient Event Broadcaster with Receiver Protection
 */

console.log("=== 1. GOTCHA & PREDICTION 1: DESTRUCTURING METHOD EXTRACTION ===");
const bankAccount = {
  balance: 250,
  withdraw(amount) {
    this.balance -= amount;
    return this.balance;
  }
};
console.log("Method invocation output:", bankAccount.withdraw(50)); // 200

let extractionCaught = false;
try {
  const extractedWithdraw = bankAccount.withdraw;
  extractedWithdraw(50); // Plain call without receiver in strict mode -> this is undefined
} catch (err) {
  extractionCaught = true;
  console.log("Extracted method call caught:", err.message);
}

console.log("\n=== 2. PREDICTION 2: CLASS METHOD EXTRACTION ===");
class TelemetryTracker {
  constructor() {
    this.eventsCount = 0;
  }
  track() {
    this.eventsCount += 1;
    return this.eventsCount;
  }
}
const tracker = new TelemetryTracker();
const plainTrack = tracker.track;
let classExtractionCaught = false;
try {
  plainTrack(); // Class methods execute in strict mode by default
} catch (err) {
  classExtractionCaught = true;
  console.log("Class method extracted call caught:", err.message);
}

console.log("\n=== 3. PREDICTION 3: SAME FUNCTION WITH DIFFERENT RECEIVERS ===");
function getFormattedName() {
  return `User: ${this.name}`;
}
const profileAlpha = { name: "Alpha", getFormattedName };
const profileBeta = { name: "Beta", getFormattedName };
console.log("profileAlpha.getFormattedName():", profileAlpha.getFormattedName()); // "User: Alpha"
console.log("profileBeta.getFormattedName():", profileBeta.getFormattedName());   // "User: Beta"

console.log("\n=== 4. PREDICTION 4: ARROW FUNCTION IN OBJECT LITERAL ===");
const literalUser = {
  name: "Sunny",
  getName: () => {
    // @ts-ignore
    return typeof this !== "undefined" ? this.name : undefined;
  }
};
console.log("literalUser.getName() output:", literalUser.getName()); // undefined (lexical capture from module scope)

console.log("\n=== 5. PREDICTION 5: BIND() UNIQUE IDENTITY ===");
function sampleLogger() {
  return this.tag;
}
const targetCtx = { tag: "SERVICE_TAG" };
const boundA = sampleLogger.bind(targetCtx);
const boundB = sampleLogger.bind(targetCtx);
console.log("boundA === boundB?", boundA === boundB); // false

console.log("\n=== 6. PRACTICAL ARCHITECTURE: EVENT BROADCASTER WITH RECEIVER PROTECTION ===");

class ResilientEventBroadcaster {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.listeners = new Set();

    // Auto-bind public API methods to guarantee receiver stability upon destructuring
    this.publish = this.publish.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  subscribe(listenerFn) {
    this.listeners.add(listenerFn);
    return () => this.listeners.delete(listenerFn);
  }

  publish(eventName, eventPayload = {}) {
    const fullEvent = {
      service: this.serviceName,
      event: eventName,
      payload: eventPayload,
      timestamp: Date.now()
    };
    this.listeners.forEach(fn => fn(fullEvent));
    return fullEvent;
  }
}

const broadcaster = new ResilientEventBroadcaster("Order_Service");

// Destructure methods safely
const { publish, subscribe } = broadcaster;

const unsubscribe = subscribe((event) => {
  console.log(`[Event Received: ${event.service}] ${event.event}:`, event.payload);
});

publish("ORDER_CREATED", { orderId: "ORD_7719", amount: 120.00 });
unsubscribe();
