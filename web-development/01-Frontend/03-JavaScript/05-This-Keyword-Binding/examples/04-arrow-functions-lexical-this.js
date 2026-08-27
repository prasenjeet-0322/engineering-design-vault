/**
 * KPI 05 — Part 04: Arrow Functions, Lexical `this` & Closure Boundaries
 * Demonstrates:
 * 1. Gotcha: .call() / .bind() Inability to Rebind Arrow Functions
 * 2. Prediction 1: Arrow Functions inside Methods Preserving Outer Receiver
 * 3. Prediction 2: The Object Literal Arrow Trap
 * 4. Prediction 3: Nested Arrow Chains Resolving Root Receiver
 * 5. Prediction 4: Lack of Constructor [[Construct]] and .prototype
 * 6. Practical Architecture: Enterprise Metrics Auto-Poller with Class Field Arrows
 */

"use strict";

console.log("=== 1. GOTCHA: .call() / .bind() IMMUNITY ===");
const teamAlpha = { name: "Team Alpha" };
const teamBeta = { name: "Team Beta" };

function createReporter() {
  return () => `Active Team: ${this.name}`;
}

const reportAlpha = createReporter.call(teamAlpha);
console.log("Initial report:", reportAlpha()); // "Active Team: Team Alpha"

// Attempting to override arrow 'this' via .call() -> Silently ignored!
console.log("Re-bound with .call(teamBeta):", reportAlpha.call(teamBeta)); // "Active Team: Team Alpha"

console.log("\n=== 2. PREDICTION 1: ARROW INSIDE METHOD ===");
const taskManager = {
  taskCount: 5,
  processBatch() {
    // Arrow function lexically captures 'this' from processBatch()
    const execute = () => `Processing ${this.taskCount} tasks...`;
    return execute();
  }
};
console.log(taskManager.processBatch()); // "Processing 5 tasks..."

console.log("\n=== 3. PREDICTION 2: OBJECT LITERAL ARROW TRAP ===");
const serverConfig = {
  environment: "STAGING",
  // ❌ Arrow in object literal does NOT point to serverConfig!
  getEnvArrow: () => (typeof this !== "undefined" && this ? this.environment : "LEXICAL_OUTER_UNDEFINED"),
  getEnvMethod() {
    return this.environment;
  }
};
console.log("Object literal arrow method:", serverConfig.getEnvArrow()); // "LEXICAL_OUTER_UNDEFINED"
console.log("Object literal regular method:", serverConfig.getEnvMethod()); // "STAGING"

console.log("\n=== 4. PREDICTION 3: NESTED ARROW CHAIN ===");
const analyticsPipeline = {
  pipelineId: "pipe_v9",
  createStage() {
    return (stageName) => (action) => `[${this.pipelineId}] Stage: ${stageName} -> Action: ${action}`;
  }
};
const stageHandler = analyticsPipeline.createStage()("INGESTION");
console.log(stageHandler("PARSE_JSON")); // "[pipe_v9] Stage: INGESTION -> Action: PARSE_JSON"

console.log("\n=== 5. PREDICTION 4: NON-CONSTRUCTABILITY ===");
const arrowConstructor = () => {};
console.log("Arrow prototype:", arrowConstructor.prototype); // undefined
try {
  new arrowConstructor();
} catch (err) {
  console.log("Calling new on arrow caught:", err.name); // TypeError
}

console.log("\n=== 6. PRACTICAL ARCHITECTURE: METRICS AUTO-POLLER ===");

class MetricsPollerEngine {
  constructor(endpoint, pollIntervalMs = 20) {
    this.endpoint = endpoint;
    this.pollIntervalMs = pollIntervalMs;
    this.timer = null;
    this.pollCount = 0;
  }

  // ✅ Class Field Arrow: Permanently bound to the instance at construction time
  start = (callback) => {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.pollCount++;
      const metric = {
        endpoint: this.endpoint,
        count: this.pollCount,
        timestamp: Date.now()
      };
      callback(metric);

      if (this.pollCount >= 3) {
        this.stop();
      }
    }, this.pollIntervalMs);

    console.log(`[Poller] Started polling ${this.endpoint}`);
  };

  stop = () => {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log(`[Poller] Stopped polling ${this.endpoint}`);
    }
  };
}

const poller = new MetricsPollerEngine("https://metrics.internal.io/cpu");

// Extract method and pass as standalone callback (Safe due to Class Field Arrow)
const detachedStarter = poller.start;
detachedStarter((metric) => {
  console.log(`Metric Received #${metric.count} from ${metric.endpoint}`);
});
