/**
 * KPI 25 — Part 03: Error Propagation, Custom Errors & Error Taxonomy
 * Demonstrates:
 * 1. Gotcha: Premature Catch Information Loss vs Causal Error Propagation
 * 2. Gotcha: Stable Machine Error Codes vs Fragile Human Message Matching
 * 3. Prediction 1: Multi-Level Call Stack Error Translation with { cause }
 * 4. Prediction 2: Custom Error Prototype Inheritance & instanceof Hierarchy
 * 5. Practical Architecture: Standalone Enterprise Error Taxonomy & Normalization Engine
 */

"use strict";

console.log("=== 1. GOTCHA: PREMATURE CATCH INFORMATION LOSS VS PROPAGATION ===");

// 1. Anti-Pattern: Premature catch destroys error type
async function badFetchUserData(id) {
  try {
    if (id === 0) throw new Error("HTTP 401 Unauthorized");
    if (id === -1) throw new Error("HTTP 404 Not Found");
    return { id, name: "Alice" };
  } catch (err) {
    // 💥 Swallowed! Information lost!
    return null;
  }
}

// 2. Senior Pattern: Propagate and preserve context
async function goodFetchUserData(id) {
  if (id === 0) throw new Error("HTTP 401 Unauthorized");
  if (id === -1) throw new Error("HTTP 404 Not Found");
  return { id, name: "Alice" };
}

(async () => {
  const badRes = await badFetchUserData(0);
  console.log(`  ❌ Bad fetch result: ${badRes} (Did server crash or was user unauthorized? Unknown!)`);

  try {
    await goodFetchUserData(0);
  } catch (goodErr) {
    console.log(`  ✅ Good fetch caught error: "${goodErr.message}" (Preserved for recovery decision!)`);
  }
})();

console.log("\n=== 2. GOTCHA: STABLE MACHINE ERROR CODES VS FRAGILE STRINGS ===");

class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
  }
}

const failure = new PaymentError("Your credit card expired on 04/26", "CARD_EXPIRED");

// Fragile String Check:
const isFragileMatch = failure.message === "Card expired"; // false!
// Robust Machine Code Check:
const isRobustMatch = failure.code === "CARD_EXPIRED"; // true!

console.log(`  Fragile String Matching Result: ${isFragileMatch} (Silently fails when copy changes!)`);
console.log(`  Robust Machine Code Matching: ${isRobustMatch} (100% reliable across locales!)`);

console.log("\n=== 3. PREDICTION: MULTI-LEVEL CALL STACK ERROR TRANSLATION ===");

class AppError extends Error {
  constructor(message, code, options) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class ProductNotFoundError extends AppError {
  constructor(message, options) {
    super(message, "PRODUCT_NOT_FOUND", options);
  }
}

function lowLevelDb(id) {
  throw new Error(`Row [id: ${id}] does not exist in PostgreSQL`);
}

function serviceLayer(id) {
  try {
    lowLevelDb(id);
  } catch (dbErr) {
    throw new ProductNotFoundError(`Product #${id} could not be found`, { cause: dbErr });
  }
}

try {
  serviceLayer(9001);
} catch (topErr) {
  console.log(`  Top Level Caught: [${topErr.name}] Code: "${topErr.code}" - "${topErr.message}"`);
  console.log(`  Root Causal Exception: "${topErr.cause.message}"`);
  console.log(`  instanceof AppError: ${topErr instanceof AppError} | instanceof ProductNotFoundError: ${topErr instanceof ProductNotFoundError}`);
}

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE ERROR TAXONOMY NORMALIZER ===");

class ErrorTaxonomyNormalizer {
  static normalize(error) {
    if (error instanceof AppError) return error;

    if (error instanceof TypeError) {
      return new AppError("Network connection interrupted or offline", "NETWORK_ERROR", { cause: error });
    }

    if (error instanceof Error) {
      return new AppError(error.message, "UNEXPECTED_SYSTEM_ERROR", { cause: error });
    }

    return new AppError(String(error), "LEGACY_UNKNOWN_ERROR");
  }
}

console.log("  Testing Taxonomy Normalizer on various error shapes:");
const err1 = ErrorTaxonomyNormalizer.normalize(new TypeError("Failed to fetch"));
console.log(`    1. Normalized TypeError -> Code: "${err1.code}" | Message: "${err1.message}"`);

const err2 = ErrorTaxonomyNormalizer.normalize("Legacy raw string throw");
console.log(`    2. Normalized String -> Code: "${err2.code}" | Message: "${err2.message}"`);

console.log("\n  🎉 [Error Propagation, Custom Errors & Error Taxonomy Verification Completed Successfully!]");
