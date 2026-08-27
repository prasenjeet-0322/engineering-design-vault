/**
 * KPI 04 — Part 10: Closures, Memory Retention & Lexical Lifetime
 * Demonstrates:
 * 1. Gotcha: Closure Retaining Live Mutable Binding Slot vs Frozen Value Snapshot
 * 2. Prediction 1: Independent Lexical Environments Across Factory Invocations
 * 3. Prediction 2: Asynchronous Closure Accessing Mutated Lexical Binding
 * 4. Prediction 3: React-Style Render Snapshots
 * 5. Prediction 4: WeakMap Key Object Lifecycle Integration
 * 6. Practical Architecture: Leak-Proof Subscription Manager with Explicit Teardown
 */

console.log("=== 1. GOTCHA: CLOSURES RETAIN LIVE MUTABLE BINDINGS ===");
function createAccount(initialBalance) {
  let balance = initialBalance;
  return {
    deposit: (amt) => { balance += amt; return balance; },
    withdraw: (amt) => { balance -= amt; return balance; },
    getBalance: () => balance
  };
}

const accountA = createAccount(100);
const accountB = createAccount(100);

accountA.deposit(50);
accountB.withdraw(30);

console.log("accountA.getBalance():", accountA.getBalance()); // 150
console.log("accountB.getBalance():", accountB.getBalance()); // 70

console.log("\n=== 2. PREDICTION 2: ASYNC CLOSURE ACCESSING MUTATED BINDING ===");
function asyncBindingDemo() {
  let status = "PENDING";
  setTimeout(() => {
    console.log("Async callback evaluates status:", status); // "COMPLETED"
  }, 10);
  status = "COMPLETED";
}
asyncBindingDemo();

console.log("\n=== 3. PREDICTION 3: REACT-STYLE RENDER SNAPSHOTS ===");
function simulateRenderPass(renderId, count) {
  return function eventHandler() {
    return `[Render #${renderId}] Logged count: ${count}`;
  };
}
const render1Handler = simulateRenderPass(1, 0);
const render2Handler = simulateRenderPass(2, 5);

console.log("Render 1 Handler output:", render1Handler()); // 0
console.log("Render 2 Handler output:", render2Handler()); // 5

console.log("\n=== 4. PREDICTION 4: WEAKMAP METADATA LIFECYCLE ===");
const telemetryMetadata = new WeakMap();
let activeSession = { sessionId: "sess_alpha_99" };

telemetryMetadata.set(activeSession, { authLevel: "ADMIN", ip: "192.168.1.1" });
console.log("telemetryMetadata has activeSession:", telemetryMetadata.has(activeSession)); // true

activeSession = null; // Object is now eligible for GC; WeakMap entry auto-reclaimed
console.log("activeSession nullified (GC-eligible)");

console.log("\n=== 5. PRACTICAL ARCHITECTURE: LEAK-PROOF SUBSCRIPTION MANAGER ===");

class LeakProofSubscriptionManager {
  constructor(channelName) {
    this.channelName = channelName;
    this.subscribers = new Map();
    this.nextSubId = 0;
  }

  subscribe(callback) {
    const subId = ++this.nextSubId;
    this.subscribers.set(subId, callback);
    console.log(`[Subscription #${subId}] Registered on channel: ${this.channelName}`);

    // Return explicit teardown closure
    return () => {
      this.subscribers.delete(subId);
      console.log(`[Subscription #${subId}] Cleaned up & Unsubscribed.`);
    };
  }

  broadcast(message) {
    console.log(`[Broadcasting on ${this.channelName}]:`, message);
    this.subscribers.forEach(fn => fn(message));
  }

  get activeSubscriberCount() {
    return this.subscribers.size;
  }
}

const newsChannel = new LeakProofSubscriptionManager("Tech_News");

const unsubAlpha = newsChannel.subscribe((msg) => console.log("Subscriber Alpha received:", msg));
const unsubBeta = newsChannel.subscribe((msg) => console.log("Subscriber Beta received:", msg));

newsChannel.broadcast("New ECMAScript Specification Released!");

console.log("Active subscribers before cleanup:", newsChannel.activeSubscriberCount); // 2
unsubAlpha();
console.log("Active subscribers after unsubscribing Alpha:", newsChannel.activeSubscriberCount); // 1
newsChannel.broadcast("V8 TurboFan JIT Update");
unsubBeta();
console.log("Active subscribers after unsubscribing Beta:", newsChannel.activeSubscriberCount); // 0
