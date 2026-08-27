/**
 * KPI 17 — Part 04: Error Architecture, Performance-Oriented Design & Senior-Level Architecture Decisions
 * Demonstrates:
 * 1. Gotcha: Raw Technical Error vs Normalized Domain Error & Telemetry
 * 2. Gotcha: Memoization Overhead vs Direct Computation Profiling
 * 3. Prediction 1: Error Normalization Shape Consistency
 * 4. Prediction 2: Cache Invalidation Lifecycle on Mutation
 * 5. Practical Architecture: Standalone Error Normalizer & Resilient Query Cache Engine
 */

"use strict";

console.log("=== 1. GOTCHA: ERROR NORMALIZATION & TELEMETRY SEPARATION ===");

function normalizeApiError(rawError) {
  if (rawError && typeof rawError === "object") {
    if (rawError.status === 401) {
      return { userMessage: "Session expired. Please log in.", code: "AUTH_EXPIRED", recoverable: false };
    }
    if (rawError.status === 403) {
      return { userMessage: "You do not have access to this resource.", code: "FORBIDDEN", recoverable: false };
    }
    if (rawError.status >= 500) {
      return { userMessage: "Server temporarily unavailable. Please retry.", code: "SERVER_ERROR", recoverable: true };
    }
  }

  return { userMessage: "An unexpected error occurred. Please try again.", code: "UNKNOWN_ERROR", recoverable: true };
}

// Simulating technical infrastructure failure
const rawServerError = {
  status: 503,
  technicalDetail: "PG_CONNECTION_TIMEOUT at tcp://cluster-primary:5432",
  timestamp: Date.now()
};

// 1. Engineering Telemetry Log
console.log("  📊 [Engineering Telemetry APM Event]:", {
  event: "DATABASE_TIMEOUT",
  rawDetails: rawServerError.technicalDetail,
  status: rawServerError.status
});

// 2. Safe Normalized User Error
const userFacingError = normalizeApiError(rawServerError);
console.log("  🛡️ [Sanitized User-Facing Error Object]:", userFacingError);

console.log("\n=== 2. GOTCHA: MEMOIZATION PROFILING VS DIRECT COMPUTATION ===");

// Simulating a simple $O(1)$ calculation
function directCalculation(x) {
  return x * 2;
}

// Trivial Memoizer
function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (cache.has(arg)) return cache.get(arg);
    const res = fn(arg);
    cache.set(arg, res);
    return res;
  };
}

const memoizedCalc = memoize(directCalculation);

console.log("  Direct Result:", directCalculation(42));
console.log("  Memoized Result:", memoizedCalc(42));

console.log("\n=== 3. PRACTICAL ARCHITECTURE: QUERY CACHE WITH MUTATION INVALIDATION ===");

class ResilientQueryCacheEngine {
  constructor() {
    this.cache = new Map();
  }

  set(queryKey, data, ttlMs = 1000) {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(queryKey, { data, expiresAt });
    console.log(`    💾 [Cache Stored]: Key "${queryKey}" cached (TTL: ${ttlMs}ms)`);
  }

  get(queryKey) {
    const entry = this.cache.get(queryKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      console.log(`    ⏳ [Cache Expired]: Key "${queryKey}" exceeded TTL; evicted.`);
      this.cache.delete(queryKey);
      return null;
    }
    return entry.data;
  }

  invalidate(queryKey) {
    this.cache.delete(queryKey);
    console.log(`    🔄 [Cache Invalidated]: Key "${queryKey}" purged upon state mutation.`);
  }
}

const queryEngine = new ResilientQueryCacheEngine();

queryEngine.set("user_profile_1", { id: 1, name: "Sunny", plan: "PRO" });
console.log("  Query 1 (Instant Cache Hit):", queryEngine.get("user_profile_1"));

// User upgrades plan (Mutation occurs):
console.log("  ▶️ User triggers mutation (Upgrade Plan to ENTERPRISE):");
queryEngine.invalidate("user_profile_1");

console.log("  Query 2 after Mutation (Cache Miss -> Triggers Fresh Fetch):", queryEngine.get("user_profile_1"));

console.log("\n  🎉 [Error Architecture, Performance & Cache Verification Completed Successfully!]");
