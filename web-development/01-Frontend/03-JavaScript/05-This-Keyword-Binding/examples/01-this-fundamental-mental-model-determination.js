/**
 * KPI 05 — Part 01: The Fundamental Mental Model: How `this` Is Determined
 * Demonstrates:
 * 1. Gotcha: Method Extraction and Context Loss
 * 2. Prediction 1: Same Function Value Invoked with Different Receivers
 * 3. Prediction 2: Property Assignment Between Objects Does Not Permanently Bind
 * 4. Prediction 3: The Object Literal Arrow Scope Trap
 * 5. Practical Architecture: Enterprise TelemetryBroadcaster with Resilient Receiver Binding
 */

console.log("=== 1. PREDICTION 1: SAME FUNCTION WITH MULTIPLE RECEIVERS ===");
function displayProfile() {
  console.log(`Profile: ${this.username} (Role: ${this.role})`);
}

const userAccount = { username: "Sunny", role: "Frontend Architect", displayProfile };
const adminAccount = { username: "RootAdmin", role: "Superuser", displayProfile };

userAccount.displayProfile();  // Profile: Sunny (Role: Frontend Architect)
adminAccount.displayProfile(); // Profile: RootAdmin (Role: Superuser)

console.log("\n=== 2. GOTCHA: METHOD EXTRACTION AND CONTEXT LOSS ===");
const customer = {
  name: "Enterprise Client",
  getName() {
    return this ? this.name : "Receiver is undefined!";
  }
};

console.log("Direct method invocation:", customer.getName()); // "Enterprise Client"

const extractedFn = customer.getName;
// Calling without receiver
console.log("Detached function invocation:", extractedFn()); // "Receiver is undefined!" or global

console.log("\n=== 3. PREDICTION 3: OBJECT LITERAL ARROW TRAP ===");
const configuration = {
  mode: "PRODUCTION",
  // Arrow function does NOT create a 'this' scope; captures outer/module context
  getModeArrow: () => (typeof this !== "undefined" && this && this.mode ? this.mode : "UNDEFINED_OUTER"),
  getModeRegular() {
    return this.mode;
  }
};

console.log("Arrow method on object literal:", configuration.getModeArrow()); // UNDEFINED_OUTER
console.log("Regular method on object literal:", configuration.getModeRegular()); // PRODUCTION

console.log("\n=== 4. PREDICTION 4: ASYNC TIMER RECEIVER PRESERVATION ===");
class WorkerService {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  executeWork() {
    console.log(`[WorkerService] Executing task for: ${this ? this.serviceName : "UNDEFINED"}`);
  }
}

const worker = new WorkerService("BillingSync");

// ❌ Broken: Method extracted by setTimeout
setTimeout(worker.executeWork, 10);

// ✅ Fixed Option A: Hard binding with .bind()
setTimeout(worker.executeWork.bind(worker), 20);

// ✅ Fixed Option B: Arrow wrapper preserving method invocation
setTimeout(() => worker.executeWork(), 30);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: TELEMETRY BROADCASTER ===");

class TelemetryBroadcaster {
  constructor(endpoint, appName) {
    this.endpoint = endpoint;
    this.appName = appName;
    this.isConnected = false;

    // Guaranteed Auto-Binding Guard for public API callbacks
    this.trackEvent = this.trackEvent.bind(this);
    this.flush = this.flush.bind(this);
  }

  connect() {
    this.isConnected = true;
    console.log(`[TelemetryBroadcaster] Connected to ${this.endpoint} for app: ${this.appName}`);
  }

  trackEvent(topic, data) {
    if (!this.isConnected) {
      console.warn(`[TelemetryBroadcaster] Cannot track "${topic}" — broadcaster not connected!`);
      return;
    }
    const payload = {
      topic,
      data,
      timestamp: Date.now()
    };
    console.log(`[${this.appName}] ✅ Dispatched event "${topic}":`, JSON.stringify(payload.data));
  }

  flush() {
    console.log(`[${this.appName}] Flushed all telemetry buffers.`);
  }
}

const broadcaster = new TelemetryBroadcaster("https://telemetry.enterprise.io/v1", "PortalApp");
broadcaster.connect();

// Pass method as detached callback to external subscriber
const externalDispatcher = broadcaster.trackEvent;
externalDispatcher("USER_LOGIN", { userId: "usr_99", ip: "10.0.0.1" }); // Works seamlessly due to .bind()
