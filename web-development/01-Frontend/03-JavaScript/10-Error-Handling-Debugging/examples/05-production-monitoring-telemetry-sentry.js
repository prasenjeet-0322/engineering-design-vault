/**
 * KPI 10 — Part 05: Production Error Architecture & Telemetry
 * Demonstrates:
 * 1. Gotcha: Non-Recursive Telemetry Dispatcher Protection
 * 2. Gotcha: PII Metadata Sanitization Engine
 * 3. Prediction 1: Client-Side Error Fingerprinting & Deduplication
 * 4. Prediction 2: Circuit Breaker State Machine (Closed -> Open -> Half-Open)
 * 5. Practical Architecture: Centralized Production Telemetry Engine
 */

"use strict";

console.log("=== 1. GOTCHA: NON-RECURSIVE TELEMETRY DISPATCHER ===");

class CentralizedTelemetry {
  constructor() {
    this.isReporting = false;
    this.reportedCount = 0;
  }

  report(error, context = {}) {
    if (this.isReporting) {
      console.warn("⚠️ [RECURSION BLOCKED]: Recursive telemetry dispatch averted!");
      return;
    }

    this.isReporting = true;
    try {
      this.reportedCount++;
      // Simulate telemetry serialization and transmission
      console.log(`[Telemetry Dispatched #${this.reportedCount}]:`, error.message);

      // Simulate a buggy inner logger throwing an error
      if (context.simulateCrash) {
        throw new Error("💥 Logger internal serialization crash!");
      }
    } catch (telemetryErr) {
      console.error("[Fallback Passive Logger]:", telemetryErr.message);
      // Attempting to report here is blocked by isReporting guard
      this.report(telemetryErr);
    } finally {
      this.isReporting = false;
    }
  }
}

const telemetry = new CentralizedTelemetry();
telemetry.report(new Error("Primary Application Error"), { simulateCrash: true });

console.log("\n=== 2. GOTCHA: PII METADATA SANITIZER ===");

function sanitizeTelemetryMetadata(metadata) {
  const sensitiveKeys = new Set(["password", "token", "auth", "secret", "creditcard", "ssn"]);
  const sanitized = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeTelemetryMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const rawPayload = {
  userId: "U-1092",
  sessionToken: "eyJhbGciOi...",
  userPrefs: { theme: "dark", password: "MySuperSecretPassword" }
};

console.log("Sanitized Payload Dump:");
console.dir(sanitizeTelemetryMetadata(rawPayload), { depth: null });

console.log("\n=== 3. PREDICTION 1: ERROR FINGERPRINTING & DEDUPLICATION ===");

class DeduplicationEngine {
  constructor() {
    this.seenFingerprints = new Set();
  }

  generateFingerprint(error) {
    // Generate deterministic hash from name + message
    return `${error.name}|${error.message}`;
  }

  shouldReport(error) {
    const fp = this.generateFingerprint(error);
    if (this.seenFingerprints.has(fp)) {
      return false; // Suppress duplicate
    }
    this.seenFingerprints.add(fp);
    return true; // First time seen
  }
}

const dedup = new DeduplicationEngine();
const errA = new TypeError("Cannot read properties of null");
const errB = new TypeError("Cannot read properties of null");
const errC = new RangeError("Invalid array length");

console.log("Err A (First occurrence):", dedup.shouldReport(errA)); // true
console.log("Err B (Duplicate occurrence):", dedup.shouldReport(errB)); // false (Suppressed!)
console.log("Err C (New occurrence):", dedup.shouldReport(errC)); // true

console.log("\n=== 4. PREDICTION 2: CIRCUIT BREAKER STATE MACHINE ===");

class CircuitBreaker {
  constructor(threshold = 2, cooldownMs = 100) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.failures = 0;
    this.state = "CLOSED"; // CLOSED -> OPEN -> HALF_OPEN
    this.nextAttempt = 0;
  }

  async execute(fn, fallback) {
    const now = Date.now();

    if (this.state === "OPEN") {
      if (now > this.nextAttempt) {
        this.state = "HALF_OPEN";
        console.log("Circuit Breaker -> Transitioned to HALF-OPEN (Testing service recovery)");
      } else {
        console.log("Circuit Breaker -> OPEN! Fast-failing with fallback.");
        return fallback;
      }
    }

    try {
      const result = await fn();
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failures = 0;
        console.log("Circuit Breaker -> Service recovered! Transitioned to CLOSED.");
      }
      return result;
    } catch (err) {
      this.failures++;
      console.log(`Execution Failed (Failure #${this.failures}): ${err.message}`);
      if (this.failures >= this.threshold) {
        this.state = "OPEN";
        this.nextAttempt = now + this.cooldownMs;
        console.log(`Circuit Breaker -> TRIPPED TO OPEN! Cooldown: ${this.cooldownMs}ms`);
      }
      return fallback;
    }
  }
}

async function testCircuitBreakerFlow() {
  const breaker = new CircuitBreaker(2, 50);
  const failingService = async () => { throw new Error("HTTP 503 Service Unavailable"); };
  const healthyService = async () => "Operational Data";

  console.log("Call 1:", await breaker.execute(failingService, "Fallback-1"));
  console.log("Call 2 (Trips Breaker):", await breaker.execute(failingService, "Fallback-2"));
  console.log("Call 3 (Fast-Fails Immediately):", await breaker.execute(failingService, "Fallback-3"));

  // Wait for cooldown to test HALF-OPEN recovery
  await new Promise((r) => setTimeout(r, 60));
  console.log("Call 4 (After Cooldown):", await breaker.execute(healthyService, "Fallback-4"));
}

testCircuitBreakerFlow();
