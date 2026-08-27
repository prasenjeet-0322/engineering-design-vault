/**
 * KPI 10 — Part 02: Custom Errors, Error Taxonomy, Error Wrapping, cause & Rethrowing
 * Demonstrates:
 * 1. Gotcha: Prototype Chain Restoration & V8 Stack Trimming
 * 2. Gotcha: Causal Severance vs ES2022 Error.cause Chaining
 * 3. Prediction 1: Multi-Level instanceof Polymorphism
 * 4. Prediction 2: Error Serialization with toJSON() for Telemetry
 * 5. Practical Architecture: Enterprise Multi-Tier Domain Error Engine
 */

"use strict";

console.log("=== 1. ENTERPRISE BASE APPERROR & PROTOTYPE RESTORATION ===");

class AppError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code ?? "INTERNAL_APPLICATION_ERROR";
    this.metadata = options.metadata ?? {};

    // 1. Prototype Chain Restoration across transpilation boundaries
    Object.setPrototypeOf(this, new.target.prototype);

    // 2. V8 Stack Frame Trimming
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      stack: this.stack,
      cause: this.cause instanceof Error
        ? (typeof this.cause.toJSON === "function" ? this.cause.toJSON() : { name: this.cause.name, message: this.cause.message })
        : this.cause
    };
  }
}

class ValidationError extends AppError {
  constructor(message, fieldErrors = {}, options = {}) {
    super(message, { ...options, code: "VALIDATION_ERROR" });
    this.fieldErrors = fieldErrors;
  }
}

class NetworkError extends AppError {
  constructor(message, statusCode, options = {}) {
    super(message, { ...options, code: "NETWORK_ERROR" });
    this.statusCode = statusCode;
  }
}

const testValErr = new ValidationError("Form validation failed", { email: "Invalid format" });
console.log("Is ValidationError?:", testValErr instanceof ValidationError); // true
console.log("Is AppError?:", testValErr instanceof AppError); // true
console.log("Is Error?:", testValErr instanceof Error); // true
console.log("Error Name:", testValErr.name); // ValidationError
console.log("Error Code:", testValErr.code); // VALIDATION_ERROR

console.log("\n=== 2. GOTCHA: CAUSAL SEVERANCE VS ERROR.CAUSE CHAINING ===");

function lowLevelDbOperation() {
  throw new Error("💥 Low-level socket timeout on port 5432");
}

function dataAccessLayer() {
  try {
    lowLevelDbOperation();
  } catch (err) {
    // Wrap low-level technical failure into domain-level exception with cause
    throw new AppError("Failed to query user profile from repository", {
      code: "REPOSITORY_QUERY_FAILED",
      cause: err,
      metadata: { targetEntity: "User", operation: "FIND_BY_ID" }
    });
  }
}

try {
  dataAccessLayer();
} catch (wrappedErr) {
  console.log("Top-Level Domain Message:", wrappedErr.message);
  console.log("Top-Level Domain Code:", wrappedErr.code);
  console.log("Preserved Root Cause Message:", wrappedErr.cause.message);
}

console.log("\n=== 3. PREDICTION 1: MULTI-LEVEL INSTANCEOF POLYMORPHISM ===");

class PaymentGatewayError extends NetworkError {}

const gatewayErr = new PaymentGatewayError("Stripe charge declined", 402);

console.log("Is PaymentGatewayError?:", gatewayErr instanceof PaymentGatewayError); // true
console.log("Is NetworkError?:", gatewayErr instanceof NetworkError); // true
console.log("Is AppError?:", gatewayErr instanceof AppError); // true
console.log("Is Error?:", gatewayErr instanceof Error); // true

console.log("\n=== 4. PREDICTION 2: ERROR SERIALIZATION FOR TELEMETRY ===");

const rawNativeErr = new Error("Native error message");
console.log("Native Error JSON.stringify (Vanishes!):", JSON.stringify(rawNativeErr)); // {}

const richAppErr = new AppError("Order checkout failed", {
  code: "CHECKOUT_FAILED",
  metadata: { orderId: "ORD-9982", amount: 199.99 },
  cause: new NetworkError("Payment gateway timed out", 504)
});

console.log("Custom AppError toJSON() Telemetry Output:");
console.dir(richAppErr.toJSON(), { depth: null });

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-TIER DOMAIN ERROR ENGINE ===");

async function mockApiRegister(payload) {
  if (!payload.email.includes("@")) {
    throw new ValidationError("Invalid email supplied", { email: "Must contain @" });
  }
  if (payload.simulateNetworkFail) {
    throw new NetworkError("DNS resolution failed", 503);
  }
  return { status: "SUCCESS", userId: "U-772" };
}

async function handleUserRegistration(formPayload) {
  try {
    const res = await mockApiRegister(formPayload);
    console.log("Registration succeeded:", res);
    return res;
  } catch (err) {
    // 🟢 Polymorphic Error Routing
    if (err instanceof ValidationError) {
      console.log("Handled locally: Rendering Field Errors ->", err.fieldErrors);
      return { ok: false, errorType: "VALIDATION", fields: err.fieldErrors };
    }

    if (err instanceof NetworkError) {
      console.log(`Handled locally: Scheduling retry banner (HTTP ${err.statusCode}) ->`, err.message);
      return { ok: false, errorType: "NETWORK_RETRY", message: err.message };
    }

    console.error("[Telemetry Dispatch - Fatal Exception]", err instanceof AppError ? err.toJSON() : err);
    throw err; // Re-throw unhandled errors
  }
}

// Test A: Validation Failure
handleUserRegistration({ email: "invalid-email" });

// Test B: Network Failure
handleUserRegistration({ email: "test@domain.com", simulateNetworkFail: true });
