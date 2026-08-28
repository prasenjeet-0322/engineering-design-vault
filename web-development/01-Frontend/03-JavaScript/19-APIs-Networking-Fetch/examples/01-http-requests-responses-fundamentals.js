/**
 * KPI 19 — Part 01: HTTP, Requests, Responses & API Fundamentals
 * Demonstrates:
 * 1. Gotcha: fetch() response.ok Verification vs False-Success on 404/500
 * 2. Gotcha: Safe HTTP 204 No Content Handling
 * 3. Prediction 1: URLSearchParams Special Character Encoding
 * 4. Prediction 2: Custom APIError Exception Modeling
 * 5. Practical Architecture: Standalone HTTP Client with Status Router
 */

"use strict";

console.log("=== 1. GOTCHA: FETCH RESPONSE.OK VERIFICATION VS 404/500 ===");

class APIError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.payload = payload;
  }
}

// Simulating fetch behavior on 404 and 204
async function mockFetch(url) {
  if (url === "/api/missing") {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      statusText: "Not Found",
      headers: { "Content-Type": "application/json" }
    });
  }
  if (url === "/api/delete/99") {
    return new Response(null, { status: 204, statusText: "No Content" });
  }
  return new Response(JSON.stringify({ id: 1, name: "Sunny" }), { status: 200 });
}

async function safeApiRequest(url) {
  const response = await mockFetch(url);

  // 1. Check response.ok before attempting to read body
  if (!response.ok) {
    let errBody = null;
    try {
      errBody = await response.json();
    } catch {
      // Body not JSON
    }
    throw new APIError(`HTTP Error ${response.status}`, response.status, errBody);
  }

  // 2. Handle 204 No Content safely
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

safeApiRequest("/api/missing").catch((err) => {
  console.log("  ✅ Successfully Caught HTTP 404 via response.ok check:");
  console.log(`    Status: ${err.status} | Payload:`, err.payload);
});

console.log("\n=== 2. GOTCHA: SAFE HTTP 204 NO CONTENT HANDLING ===");

safeApiRequest("/api/delete/99").then((result) => {
  console.log("  ✅ 204 No Content Response Body Parsed Cleanly as:", result);
});

console.log("\n=== 3. URLSEARCHPARAMS AUTOMATED ENCODING ===");

const queryParams = new URLSearchParams({
  search: "react & typescript + node",
  filter: "price > 100",
  page: 1
});

console.log("  Encoded Query String:\n   ", queryParams.toString());

console.log("\n=== 4. PRACTICAL ARCHITECTURE: CENTRALIZED HTTP CLIENT WITH STATUS ROUTER ===");

class CentralizedHttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log(`    🌐 [HTTP Client Dispatch]: ${options.method || "GET"} ${fullUrl}`);

    const response = await mockFetch(endpoint);

    if (!response.ok) {
      this.routeStatusError(response.status);
      throw new APIError(`Failed request: ${response.status}`, response.status);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  routeStatusError(status) {
    if (status === 401) console.log("    🔐 [Status Router 401]: Triggering token refresh flow...");
    if (status === 403) console.log("    🚫 [Status Router 403]: Triggering permission upgrade modal...");
    if (status === 404) console.log("    🔍 [Status Router 404]: Resource missing; rendering 404 state...");
    if (status >= 500) console.log("    🚨 [Status Router 500+]: Server outage detected; logging APM alert...");
  }
}

const client = new CentralizedHttpClient("https://api.vault.com");

setTimeout(() => {
  client.request("/api/missing").catch(() => {
    console.log("\n  🎉 [HTTP, Requests, Responses & API Fundamentals Verification Completed Successfully!]");
  });
}, 40);
