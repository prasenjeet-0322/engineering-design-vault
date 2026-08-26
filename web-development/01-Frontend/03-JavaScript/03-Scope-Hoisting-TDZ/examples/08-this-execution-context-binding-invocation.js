/**
 * KPI 03 — Part 08: `this`, Execution Context Binding & Function Invocation
 * Demonstrates:
 * 1. Gotcha: Method Extraction & Context Loss
 * 2. Prediction 1: Plain Call in Strict/Module Environment
 * 3. Prediction 2: Arrow Function in Object Literal Anti-Pattern
 * 4. Prediction 3: Hard Binding with bind() Immutability
 * 5. Prediction 4: Class Method Callback Loss & Arrow Wrapper Fix
 * 6. Practical Architecture: Multi-Channel Broadcast Controller with Bound Dispatchers
 */

console.log("=== 1. GOTCHA & PREDICTION 1: METHOD EXTRACTION & CONTEXT LOSS ===");
const user = {
  name: "Sunny",
  greet() {
    return this ? this.name : "undefined_receiver";
  }
};

console.log("Direct method invocation:", user.greet()); // "Sunny"
const extractedGreet = user.greet;
console.log("Extracted invocation (plain call):", extractedGreet()); // "undefined_receiver"

console.log("\n=== 2. PREDICTION 2: ARROW FUNCTION IN OBJECT LITERAL ===");
const literalConfig = {
  name: "Sunny",
  regular() { return this ? this.name : "unbound"; },
  arrow: () => {
    // @ts-ignore
    return typeof this !== "undefined" && this ? this.name : "outer_module_this";
  }
};
console.log("regular() method:", literalConfig.regular()); // "Sunny"
console.log("arrow() method:", literalConfig.arrow());     // "outer_module_this"

console.log("\n=== 3. PREDICTION 3: BIND() RECEIVER IMMUTABILITY ===");
function showIdentity() {
  return this.name;
}
const userA = { name: "User_Alpha" };
const userB = { name: "User_Beta" };

const boundA = showIdentity.bind(userA);
console.log("boundA():", boundA()); // "User_Alpha"
console.log("boundA.call(userB):", boundA.call(userB)); // "User_Alpha" (Immutable bound this!)

console.log("\n=== 4. PREDICTION 4: CLASS METHOD CALLBACK LOSS & ARROW FIX ===");
class OrderProcessor {
  constructor(orderId) {
    this.orderId = orderId;
  }

  process() {
    return `Processing ${this.orderId}`;
  }
}

const order = new OrderProcessor("ORD_8801");

function executeOrderCallback(callback) {
  try {
    return callback();
  } catch (err) {
    return `Error caught: ${err.message}`;
  }
}

// Extraction causes context loss:
console.log("Extracted raw callback:", executeOrderCallback(order.process));
// Fixed via arrow wrapper:
console.log("Arrow wrapper callback:", executeOrderCallback(() => order.process()));

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-CHANNEL BROADCASTER ===");

class BroadcastChannelController {
  constructor(channelName) {
    this.channelName = channelName;
    this.eventCount = 0;
    // Autobind broadcast dispatcher
    this.emit = this.emit.bind(this);
  }

  emit(payload) {
    this.eventCount++;
    const packet = {
      channel: this.channelName,
      seq: this.eventCount,
      payload,
      timestamp: Date.now()
    };
    console.log(`[${this.channelName}] Packet #${packet.seq} Dispatched:`, packet.payload);
    return packet;
  }
}

const broadcaster = new BroadcastChannelController("Notifications");

// Safely passing extracted dispatcher to external event handlers
function simulateExternalTrigger(dispatchFn) {
  dispatchFn({ type: "ALERT", message: "High Memory Utilization" });
}

simulateExternalTrigger(broadcaster.emit);
