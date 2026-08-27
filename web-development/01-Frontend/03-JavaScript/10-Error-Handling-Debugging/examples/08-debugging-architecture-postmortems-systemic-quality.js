/**
 * KPI 10 — Part 08: Debugging Architecture & Production Postmortems
 * Demonstrates:
 * 1. Gotcha: Structured Telemetry Serialization & PII Scrubbing
 * 2. Gotcha: Fail-Fast Invariant Assertions at System Boundaries
 * 3. Prediction 1: Error Code Machine Classification
 * 4. Prediction 2: State Machine Deterministic Transition Rules
 * 5. Practical Architecture: Enterprise Diagnostic Logging & Trace Engine
 */

"use strict";

console.log("=== 1. STRUCTURED JSON TELEMETRY & PII SCRUBBING ===");

class DiagnosticLogger {
  constructor() {
    this.correlationId = "corr_tx_9011";
  }

  log(level, event, metadata = {}) {
    const record = {
      timestamp: new Date().toISOString(),
      level,
      event,
      correlationId: this.correlationId,
      metadata: this.sanitize(metadata)
    };
    console.log(`[APM LOG]: ${JSON.stringify(record)}`);
  }

  sanitize(obj) {
    const sensitiveWords = ["token", "password", "card", "secret", "auth"];
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      const isSensitive = sensitiveWords.some((word) => k.toLowerCase().includes(word));
      if (isSensitive) {
        clean[k] = "[REDACTED]";
      } else if (typeof v === "object" && v !== null) {
        clean[k] = this.sanitize(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }
}

const logger = new DiagnosticLogger();
logger.log("INFO", "CHECKOUT_INITIATED", {
  orderId: "ORD-991",
  amount: 250.0,
  userToken: "bearer_secret_12345"
});

console.log("\n=== 2. FAIL-FAST INVARIANT ASSERTIONS ===");

class InvariantViolationError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = "InvariantViolationError";
    this.context = context;
  }
}

function assertInvariant(condition, message, context = {}) {
  if (!condition) {
    logger.log("ERROR", "INVARIANT_VIOLATION", { message, ...context });
    throw new InvariantViolationError(`[Invariant Failure]: ${message}`, context);
  }
}

function processPaymentOrder(order) {
  // Enforce boundary invariants
  assertInvariant(order.amount > 0, "Payment amount must be positive non-zero", { order });
  assertInvariant(typeof order.orderId === "string", "Order ID required", { order });
  return `Processed Order ${order.orderId} for $${order.amount}`;
}

// Test A: Valid Order
console.log("Valid Order Result:", processPaymentOrder({ orderId: "ORD-1", amount: 100 }));

// Test B: Invariant Violation
try {
  processPaymentOrder({ orderId: "ORD-2", amount: -50 });
} catch (err) {
  console.log("Caught Invariant Failure:", err.message);
}

console.log("\n=== 3. ERROR CODE MACHINE CLASSIFICATION ===");

class DomainError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
  }
}

const errors = [
  new DomainError("Session timed out", "AUTH_EXPIRED", 401),
  new DomainError("Item out of stock", "PRODUCT_UNAVAILABLE", 404),
  new DomainError("Token invalid", "AUTH_EXPIRED", 401)
];

// Machine-readable grouping by code:
const groupedByCode = errors.reduce((acc, err) => {
  acc[err.code] = (acc[err.code] || 0) + 1;
  return acc;
}, {});

console.log("Machine Grouped Error Codes Summary:", groupedByCode);

console.log("\n=== 4. FINITE STATE MACHINE TRANSITION ENGINE ===");

class CheckoutStateMachine {
  constructor() {
    this.state = "IDLE";
    this.transitions = {
      IDLE: ["VALIDATING"],
      VALIDATING: ["PROCESSING", "ERROR"],
      PROCESSING: ["COMPLETED", "ERROR"],
      ERROR: ["VALIDATING", "IDLE"],
      COMPLETED: ["IDLE"]
    };
  }

  transition(nextState) {
    const allowed = this.transitions[this.state];
    if (!allowed || !allowed.includes(nextState)) {
      throw new Error(`Illegal State Transition: ${this.state} -> ${nextState}`);
    }
    const previous = this.state;
    this.state = nextState;
    console.log(`[FSM Transition]: ${previous} -> ${this.state}`);
  }
}

const fsm = new CheckoutStateMachine();
fsm.transition("VALIDATING");
fsm.transition("PROCESSING");
fsm.transition("COMPLETED");

try {
  // Illegal jump: COMPLETED -> PROCESSING
  fsm.transition("PROCESSING");
} catch (err) {
  console.log("Rejected Illegal Transition:", err.message);
}

console.log("\n=== 5. 5-WHYS ROOT CAUSE AUDIT SIMULATION ===");

const fiveWhysAudit = [
  { Step: "1. Problem", Why: "Checkout page crashed on submit for 10% of users" },
  { Step: "2. Why?", Why: "Unhandled rejection occurred during payment tokenization" },
  { Step: "3. Why?", Why: "Third-party Stripe SDK was called directly without try/catch wrapper" },
  { Step: "4. Why?", Why: "No centralized PaymentAdapter abstraction existed in the codebase" },
  { Step: "5. Root Cause", Why: "Lack of architectural rule requiring adapters for third-party SDKs" }
];

console.log("Blameless Postmortem 5-Whys Audit Matrix:");
console.table(fiveWhysAudit);
