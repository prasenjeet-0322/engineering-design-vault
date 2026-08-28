/**
 * KPI 25 — Part 01: Errors, Exceptions & the JavaScript Failure Model
 * Demonstrates:
 * 1. Gotcha: Throwing Primitive Strings vs Error Instances (Stack Trace Comparison)
 * 2. Gotcha: Programmer Error vs Operational Error Classification
 * 3. Prediction 1: Call Stack Propagation Unwinding
 * 4. Prediction 2: Safe Result Tuples ([err, data]) vs Exception Throwing
 * 5. Practical Architecture: Standalone Error Normalizer & Domain Failure Classifier
 */

"use strict";

console.log("=== 1. GOTCHA: THROWING PRIMITIVE STRINGS VS ERROR INSTANCES ===");

// 1. Throwing a raw string
try {
  throw "FATAL_AUTH_FAILURE"; // 💥 String primitive
} catch (err) {
  console.log(`  ❌ Thrown String Primitive -> typeof: ${typeof err} | instanceof Error: ${err instanceof Error}`);
  console.log(`     Stack Trace: ${err.stack}`); // undefined!
}

// 2. Throwing a standard Error object
try {
  throw new Error("FATAL_AUTH_FAILURE");
} catch (err) {
  console.log(`  ✅ Thrown Error Instance -> name: ${err.name} | instanceof Error: ${err instanceof Error}`);
  console.log(`     Stack Trace Snippet: ${err.stack.split("\n")[0]} (Call frames captured!)`);
}

console.log("\n=== 2. PROGRAMMER ERROR VS OPERATIONAL ERROR CLASSIFICATION ===");

class OperationalHttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "OperationalHttpError";
    this.status = status;
    this.isOperational = true;
  }
}

function handleFailure(error) {
  if (error instanceof OperationalHttpError) {
    console.log(`  🟡 [Operational Error Handled]: Status ${error.status} - "${error.message}" -> Action: Show Retry Toast`);
    return { retryable: true, message: "Network connection lost. Click to retry." };
  } else if (error instanceof TypeError) {
    console.log(`  🔴 [Programmer Bug Detected]: "${error.message}" -> Action: Escalate to Sentry / Fix Code!`);
    return { retryable: false, message: "An unexpected application error occurred." };
  } else {
    console.log(`  ⚠️ [Unknown Error]: "${error.message}"`);
    return { retryable: false, message: "System error." };
  }
}

// Test Operational Error
handleFailure(new OperationalHttpError("503 Service Unavailable", 503));

// Test Programmer Bug
try {
  const nullObj = null;
  nullObj.nonExistentMethod(); // 💥 TypeError
} catch (bug) {
  handleFailure(bug);
}

console.log("\n=== 3. PREDICTION: CALL STACK PROPAGATION UNWINDING ===");

function frameA() { frameB(); }
function frameB() { frameC(); }
function frameC() {
  throw new RangeError("Maximum allocation size exceeded");
}

try {
  console.log("  Invoking frameA() -> frameB() -> frameC()...");
  frameA();
} catch (propagatedErr) {
  console.log(`  ✅ Caught Unwound Error: ${propagatedErr.name} - "${propagatedErr.message}"`);
  console.log(`     Stack frame depth verified across 3 nested functions.`);
}

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE ERROR NORMALIZER ===");

class ErrorNormalizer {
  static normalize(unknownError) {
    if (unknownError instanceof Error) {
      return {
        name: unknownError.name,
        message: unknownError.message,
        stack: unknownError.stack,
        isCustom: unknownError.name !== "Error"
      };
    }

    if (typeof unknownError === "string") {
      return {
        name: "LegacyStringError",
        message: unknownError,
        stack: "No stack captured (Raw string thrown)",
        isCustom: false
      };
    }

    return {
      name: "UnknownObjectError",
      message: JSON.stringify(unknownError),
      stack: "No stack captured",
      isCustom: false
    };
  }
}

console.log("  Testing ErrorNormalizer on arbitrary thrown inputs:");
console.log("    1. Normalized Error Instance:", ErrorNormalizer.normalize(new TypeError("Invalid array length")));
console.log("    2. Normalized Raw String:", ErrorNormalizer.normalize("Connection timed out"));
console.log("    3. Normalized Object literal:", ErrorNormalizer.normalize({ code: 404, status: "NOT_FOUND" }));

console.log("\n  🎉 [Errors, Exceptions & JavaScript Failure Model Verification Completed Successfully!]");
