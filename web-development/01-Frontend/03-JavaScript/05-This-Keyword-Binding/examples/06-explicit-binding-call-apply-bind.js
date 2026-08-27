/**
 * KPI 05 — Part 06: call(), apply(), bind(), Explicit this Control & Function Identity
 * Demonstrates:
 * 1. Gotcha: Function Identity Disconnect in Event Listener Removal
 * 2. Prediction 1: Immediate Execution of call() vs Delayed Bound Callable of bind()
 * 3. Prediction 2: Immutability of Hard Binding in Chained .bind() Calls
 * 4. Prediction 3: new Operator Overriding Bound this Precedence
 * 5. Prediction 4: Partial Application with Preset Arguments
 * 6. Practical Architecture: Leak-Proof Event Subscription Manager with Stable References
 */

"use strict";

console.log("=== 1. PREDICTION 1: call() VS bind() TIMING ===");
function calculate(factor) {
  return (this ? this.base : 1) * factor;
}
const context = { base: 10 };

// call() executes immediately
const immediateResult = calculate.call(context, 5);
// bind() returns a new function
const boundCallable = calculate.bind(context, 5);

console.log("Immediate result type:", typeof immediateResult, "| Value:", immediateResult); // number | 50
console.log("Bound callable type:", typeof boundCallable, "| Invoked:", boundCallable()); // function | 50

console.log("\n=== 2. GOTCHA: FUNCTION IDENTITY DISCONNECT ===");
function onScrollEvent() {}
const listenerA = onScrollEvent.bind(context);
const listenerB = onScrollEvent.bind(context);

console.log("listenerA === listenerB:", listenerA === listenerB); // false
console.log("listenerA === onScrollEvent:", listenerA === onScrollEvent); // false

console.log("\n=== 3. PREDICTION 2: CHAINED .bind() IMMUTABILITY ===");
function getSystemTag() {
  return this.tag;
}
const primaryBound = getSystemTag.bind({ tag: "PRIMARY_ALPHA" });
const secondaryBound = primaryBound.bind({ tag: "SECONDARY_BETA" });

console.log("Chained bind result:", secondaryBound()); // "PRIMARY_ALPHA"

console.log("\n=== 4. PREDICTION 3: new OPERATOR OVERRIDING BOUND THIS ===");
function UserProfile(username) {
  this.username = username;
}
const hardcodedBoundUser = UserProfile.bind({ username: "SYSTEM_ROOT" });
const newInstance = new hardcodedBoundUser("Sunny");

console.log("Instance username created with new:", newInstance.username); // "Sunny"

console.log("\n=== 5. PREDICTION 4: PARTIAL APPLICATION (CURRYING) ===");
function formatEndpoint(protocol, host, port, path) {
  return `${protocol}://${host}:${port}/${path}`;
}

const createApiUrl = formatEndpoint.bind(null, "https", "api.enterprise.io", 443);
console.log("Generated API URL:", createApiUrl("v2/users")); // "https://api.enterprise.io:443/v2/users"

console.log("\n=== 6. PRACTICAL ARCHITECTURE: LEAK-PROOF EVENT SUBSCRIPTION HUB ===");

class EventSubscriptionHub {
  constructor() {
    this.topics = new Map();

    // Stable hard-binding of methods ensures consumer destructuring safety
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.publish = this.publish.bind(this);
  }

  subscribe(topic, callback) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
    }
    const topicSet = this.topics.get(topic);
    topicSet.add(callback);
    console.log(`[EventHub] Registered listener on "${topic}". Active count: ${topicSet.size}`);

    // Return deterministic teardown function
    return () => this.unsubscribe(topic, callback);
  }

  unsubscribe(topic, callback) {
    const topicSet = this.topics.get(topic);
    if (!topicSet) return false;
    const removed = topicSet.delete(callback);
    console.log(`[EventHub] Unregistered listener on "${topic}". Removed: ${removed}, Remaining: ${topicSet.size}`);
    return removed;
  }

  publish(topic, payload) {
    const topicSet = this.topics.get(topic);
    if (!topicSet) return;
    topicSet.forEach(cb => cb(payload));
  }
}

const hub = new EventSubscriptionHub();

// Handler with stable reference identity
const handleTelemetry = (data) => {
  console.log(`[Telemetry Receiver] Processing: ${JSON.stringify(data)}`);
};

// 1. Subscribe using stable reference
const unsubscribe = hub.subscribe("METRICS_STREAM", handleTelemetry);

// 2. Publish event
hub.publish("METRICS_STREAM", { metric: "CPU_LOAD", value: "42%" });

// 3. Unsubscribe deterministically
unsubscribe();

// 4. Verification: publishing after unsubscribe does nothing
hub.publish("METRICS_STREAM", { metric: "CPU_LOAD", value: "99%" });
