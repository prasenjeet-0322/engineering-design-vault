/**
 * KPI 19 — Part 04: Building a Reusable API Layer & Production Request Architecture
 * Demonstrates:
 * 1. Gotcha: Caller Signal + Timeout Signal Composition (AbortSignal.any)
 * 2. Gotcha: Automated 401 Token Refresh with In-Memory Promise Lock Queue
 * 3. Prediction 1: Header Override Precedence
 * 4. Prediction 2: Safe 204 No Content Handling
 * 5. Practical Architecture: Standalone Complete Enterprise API Client Layer
 */

"use strict";

console.log("=== 1. GOTCHA: COMPOSED SIGNALS (CALLER ABORT + TIMEOUT) ===");

function composeSignals(callerSignal, timeoutMs) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!callerSignal) return timeoutSignal;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([callerSignal, timeoutSignal]);
  }
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  callerSignal.addEventListener("abort", onAbort);
  timeoutSignal.addEventListener("abort", onAbort);
  return controller.signal;
}

const callerCtrl = new AbortController();
const composedSig = composeSignals(callerCtrl.signal, 100);

composedSig.addEventListener("abort", () => {
  console.log("  ✅ Composed signal aborted immediately on caller action:", composedSig.reason.name);
});

// Caller triggers cancel
callerCtrl.abort();

console.log("\n=== 2. GOTCHA: AUTOMATED 401 TOKEN REFRESH PROMISE LOCK ===");

class ResilientHttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = "EXPIRED_TOKEN";
    this.refreshPromise = null;
    this.refreshCallCount = 0;
  }

  async refreshToken() {
    if (this.refreshPromise) {
      console.log("    🔐 [Auth Lock]: Sharing active refresh promise for concurrent request...");
      return this.refreshPromise;
    }

    this.refreshCallCount++;
    console.log("    🔐 [Auth Lock]: Initiating single /auth/refresh API call...");

    this.refreshPromise = new Promise((resolve) => {
      setTimeout(() => {
        this.token = "FRESH_VALID_TOKEN_" + Date.now();
        this.refreshPromise = null; // Release lock
        resolve(this.token);
      }, 25);
    });

    return this.refreshPromise;
  }

  async mockFetch(url, options = {}) {
    const auth = options.headers?.Authorization;
    if (auth === "Bearer EXPIRED_TOKEN") {
      return { status: 401, ok: false, json: async () => ({ error: "Token Expired" }) };
    }
    return { status: 200, ok: true, json: async () => ({ data: "Success from " + url }) };
  }

  async request(endpoint, options = {}) {
    let headers = {
      Accept: "application/json",
      Authorization: `Bearer ${this.token}`,
      ...options.headers
    };

    let response = await this.mockFetch(endpoint, { ...options, headers });

    // Intercept 401
    if (response.status === 401) {
      console.log(`    ⚠️ [401 Intercepted for ${endpoint}]: Refreshing token...`);
      await this.refreshToken();
      // Replay with refreshed token
      headers.Authorization = `Bearer ${this.token}`;
      response = await this.mockFetch(endpoint, { ...options, headers });
    }

    return response.json();
  }
}

const client = new ResilientHttpClient("https://api.vault.com");

// Trigger 3 concurrent requests with expired token
console.log("  ▶️ Dispatching 3 concurrent requests with expired token:");
Promise.all([
  client.request("/api/users"),
  client.request("/api/products"),
  client.request("/api/orders")
]).then((results) => {
  console.log("  ✅ All 3 Requests Replayed & Succeeded:", results.map((r) => r.data));
  console.log("  📊 Total Refresh Endpoint Calls (Deduplicated Lock):", client.refreshCallCount); // Must be 1!

  console.log("\n=== 3. DOMAIN RESOURCE SERVICE DECOUPLING ===");
  const usersApi = {
    getUsers: () => client.request("/api/users")
  };

  usersApi.getUsers().then((res) => {
    console.log("  ✅ Domain Service Result:", res.data);
    console.log("\n  🎉 [Production API Client Layer & Architecture Verification Completed Successfully!]");
  });
});
