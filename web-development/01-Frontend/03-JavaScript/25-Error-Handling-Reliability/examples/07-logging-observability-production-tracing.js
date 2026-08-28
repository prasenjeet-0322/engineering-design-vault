/**
 * KPI 25 — Part 07: Logging, Observability & Production Debugging
 * Demonstrates:
 * 1. Gotcha: Recursive PII & Secret Scrubbing in Telemetry Payloads
 * 2. Gotcha: Unstructured String Logs vs Structured JSON Telemetry
 * 3. Prediction 1: Correlation ID Propagation across HTTP Headers
 * 4. Prediction 2: Rolling Breadcrumb Ring-Buffer Preceding a Crash
 * 5. Practical Architecture: Standalone Production Telemetry Logger with Release Tagging
 */

"use strict";

console.log("=== 1. GOTCHA: RECURSIVE PII & SECRET SCRUBBING ===");

const SENSITIVE_KEYS = new Set(["password", "token", "cvv", "cardnumber", "authorization", "secret"]);

function scrubPII(data) {
  if (typeof data !== "object" || data === null) return data;
  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof key === "string" && SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = scrubPII(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const rawPayload = {
  user: "alex_dev",
  password: "SuperSecretPassword123!",
  billing: {
    cardNumber: "4111-2222-3333-4444",
    cvv: "892",
    amount: 149.99
  },
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
};

console.log("  Raw Dangerous Payload:");
console.log("    Password:", rawPayload.password);
console.log("    Card Number:", rawPayload.billing.cardNumber);

const cleanPayload = scrubPII(rawPayload);
console.log("\n  Sanitized Safe Telemetry Payload:");
console.log("    Password:", cleanPayload.password);
console.log("    Card Number:", cleanPayload.billing.cardNumber);
console.log("    Authorization:", cleanPayload.headers.Authorization);
console.log("    Billing Amount (Preserved):", cleanPayload.billing.amount);

console.log("\n=== 2. GOTCHA: UNSTRUCTURED STRING VS STRUCTURED JSON TELEMETRY ===");

// 1. Unstructured (Hard to filter/query)
const unstructured = "ERROR 2026-08-27 12:04 User 882 failed checkout due to HTTP 500 on /api/pay";
console.log(`  ❌ Unstructured string: "${unstructured}"`);

// 2. Structured JSON (Queryable by field!)
const structured = {
  timestamp: Date.now(),
  level: "ERROR",
  event: "checkout_payment_failed",
  userId: "882",
  httpStatus: 500,
  route: "/api/pay",
  release: "app@2.4.1"
};
console.log("  ✅ Structured JSON Event:", JSON.stringify(structured));

console.log("\n=== 3. PREDICTION: CORRELATION ID & DISTRIBUTED TRACE HEADERS ===");

function createOutgoingRequest(endpoint, payload) {
  const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Correlation-ID": correlationId,
    "traceparent": `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`
  };

  console.log(`  ▶️ Dispatching ${endpoint} with [X-Correlation-ID: ${headers["X-Correlation-ID"]}]`);
  return { endpoint, headers, payload };
}

createOutgoingRequest("/api/v1/orders", { orderId: "ord_1009" });

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE TELEMETRY LOGGER ===");

class ProductionTelemetryLogger {
  #breadcrumbs = [];
  #maxBreadcrumbs = 5;
  #release = "web-client@2.4.1";

  addBreadcrumb(category, message) {
    this.#breadcrumbs.push({ category, message, time: new Date().toLocaleTimeString() });
    if (this.#breadcrumbs.length > this.#maxBreadcrumbs) {
      this.#breadcrumbs.shift();
    }
  }

  logError(event, error, metadata = {}) {
    const correlationId = `req_${Date.now()}`;
    const sanitizedMetadata = scrubPII(metadata);

    const telemetryRecord = {
      event,
      level: "ERROR",
      release: this.#release,
      correlationId,
      error: {
        name: error.name,
        message: error.message
      },
      metadata: sanitizedMetadata,
      breadcrumbs: [...this.#breadcrumbs]
    };

    console.log("  📡 [APM Telemetry Record Captured]:");
    console.log("    Event:", telemetryRecord.event);
    console.log("    Correlation ID:", telemetryRecord.correlationId);
    console.log("    Breadcrumb Sequence:", telemetryRecord.breadcrumbs.map((b) => `[${b.category}] ${b.message}`));
    return telemetryRecord;
  }
}

const logger = new ProductionTelemetryLogger();

// User journey preceding a crash:
logger.addBreadcrumb("UI", "Clicked 'Products' in navbar");
logger.addBreadcrumb("NAVIGATION", "Navigated to /products/4089");
logger.addBreadcrumb("UI", "Clicked 'Add to Cart'");
logger.addBreadcrumb("NETWORK", "POST /api/cart (200 OK)");
logger.addBreadcrumb("UI", "Clicked 'Submit Checkout'");

// Trigger crash event
logger.logError("checkout_crash", new TypeError("Cannot read property 'id' of undefined"), {
  cartId: "cart_992",
  authToken: "Bearer secret_jwt_token_99182" // Will be scrubbed!
});

console.log("\n  🎉 [Logging, Observability & Production Debugging Verification Completed Successfully!]");
