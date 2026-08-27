/**
 * KPI 10 — Part 01: Error Mental Model, Failure Taxonomy & try / catch / finally
 * Demonstrates:
 * 1. Gotcha: Asynchronous Callback try/catch Disconnect vs Async/Await Fix
 * 2. Gotcha: Finally Return Hijack Overriding Exceptions
 * 3. Prediction 1: Finally Execution Guarantees with Returns
 * 4. Prediction 2: Conditional Error Handling & Upstream Re-throwing
 * 5. Practical Architecture: Enterprise Resilient HTTP Client with Layered Failure Translation
 */

"use strict";

console.log("=== 1. GOTCHA: ASYNC CALLBACK TRY/CATCH DISCONNECT & FIX ===");

// ❌ Why synchronous try/catch fails for callbacks:
function demonstrateAsyncDisconnect() {
  console.log("Scheduling async callback...");
  try {
    // This try/catch completes synchronously and pops off the stack immediately
    setTimeout(() => {
      try {
        // Inner try/catch needed for macrotask callbacks!
        throw new Error("💥 Callback Failure!");
      } catch (innerErr) {
        console.log("Inner callback catch successfully trapped:", innerErr.message);
      }
    }, 10);
  } catch (outerErr) {
    console.log("Outer catch (NEVER REACHED!):", outerErr.message);
  }
}

demonstrateAsyncDisconnect();

// ✅ Modern Senior Solution: Async/Await Promise Boundary
const delayedAsyncFailure = () =>
  new Promise((_, reject) => setTimeout(() => reject(new Error("💥 Async Promise Rejection!")), 20));

async function handleModernAsync() {
  try {
    await delayedAsyncFailure();
  } catch (err) {
    console.log("Async/Await try/catch cleanly trapped:", err.message);
  }
}

setTimeout(handleModernAsync, 30);

console.log("\n=== 2. GOTCHA: FINALLY RETURN HIJACK HAZARD ===");

function dangerousFinallyHijack() {
  try {
    throw new Error("Fatal Database Failure!");
  } catch (err) {
    console.log("Catch caught error, preparing re-throw...");
    throw err; // Intending to bubble fatal error
  } finally {
    console.log("Finally executing return...");
    return "SWALLOWED_OK"; // 💥 Silently suppresses the thrown error!
  }
}

const hijackResult = dangerousFinallyHijack();
console.log("Result of hijack (Error disappeared!):", hijackResult); // SWALLOWED_OK

console.log("\n=== 3. PREDICTION 1: FINALLY EXECUTION GUARANTEE ===");

function testFinallyExecution() {
  try {
    console.log("Step 1: inside try");
    return "TRY_RETURN";
  } catch (err) {
    console.log("Catch block");
  } finally {
    console.log("Step 2: inside finally (Executed before return completes!)");
  }
}

console.log("Step 3: Function return value:", testFinallyExecution());

console.log("\n=== 4. PREDICTION 2: CONDITIONAL RE-THROWING ===");

class NetworkTimeoutError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "NetworkTimeoutError";
  }
}

function processRequest(type) {
  try {
    if (type === "TIMEOUT") throw new NetworkTimeoutError("Gateway Timeout (504)");
    if (type === "UNKNOWN") throw new RangeError("Invalid Buffer Range");
  } catch (err) {
    if (err instanceof NetworkTimeoutError) {
      console.log("Handled locally in service layer:", err.message);
      return { status: "RETRY_SCHEDULED" };
    }
    // Re-throw unhandled error types upstream
    console.log("Unknown error type encountered, re-throwing upstream...");
    throw err;
  }
}

console.log("Testing Timeout:", processRequest("TIMEOUT"));

try {
  processRequest("UNKNOWN");
} catch (upstreamErr) {
  console.log("Upstream boundary trapped re-thrown error:", upstreamErr.name);
}

console.log("\n=== 5. PRACTICAL ARCHITECTURE: RESILIENT HTTP CLIENT ===");

class DomainApiError extends Error {
  constructor(message, statusCode, originalError) {
    super(message);
    this.name = "DomainApiError";
    this.statusCode = statusCode;
    this.cause = originalError;
  }
}

async function resilientHttpClient(endpoint, mockFailure = false) {
  let isExecuting = true;
  console.log(`[HTTP Request Initiated] -> ${endpoint} (Lock acquired)`);

  try {
    if (mockFailure) {
      throw new Error("TCP Connection Reset by Peer");
    }
    return { status: 200, data: { userId: "U-101", name: "Sunny Yadav" } };
  } catch (rawError) {
    // Layered Translation: Technical Error -> Domain Meaning
    console.error(`[Infrastructure Error Logged]: ${rawError.message}`);
    throw new DomainApiError(
      "Service temporarily unavailable. Please retry shortly.",
      503,
      rawError
    );
  } finally {
    // Guaranteed Teardown: Release connection / loading state
    isExecuting = false;
    console.log(`[HTTP Teardown Completed] Lock released (isExecuting: ${isExecuting})`);
  }
}

// Test Successful Call
resilientHttpClient("/api/v1/user", false).then((res) => {
  console.log("Success Response Payload:", res.data);
});

// Test Failure with Layered Translation
resilientHttpClient("/api/v1/user", true).catch((domainErr) => {
  console.log(`User-Facing Error Message: "${domainErr.message}" (Status: ${domainErr.statusCode})`);
  console.log(`Root Cause: ${domainErr.cause.message}`);
});
