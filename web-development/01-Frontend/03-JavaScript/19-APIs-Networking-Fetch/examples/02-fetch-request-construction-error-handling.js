/**
 * KPI 19 — Part 02: Fetch API, Request Construction & Error Handling
 * Demonstrates:
 * 1. Gotcha: Content-Type Sniffing (JSON vs HTML Proxy Error 502)
 * 2. Gotcha: Safe Query Parameter Builder with URLSearchParams
 * 3. Prediction 1: Error Chaining with Error.cause
 * 4. Prediction 2: Safe 204 No Content Handling
 * 5. Practical Architecture: Standalone Unified request() Pipeline with Domain Services
 */

"use strict";

console.log("=== 1. GOTCHA: DEFENSIVE CONTENT-TYPE SNIFFING (JSON VS HTML 502) ===");

class APIError extends Error {
  constructor(message, status, data = null, options = {}) {
    super(message, options);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

// Simulating proxy returning HTML 502 Bad Gateway
async function mockFetchWithHtmlError(url) {
  if (url === "/api/failing-proxy") {
    return new Response("<html><body>502 Bad Gateway: Nginx Down</body></html>", {
      status: 502,
      statusText: "Bad Gateway",
      headers: { "Content-Type": "text/html" }
    });
  }
  return new Response(JSON.stringify({ id: 101, name: "Sunny" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

async function safeBodySniffingRequest(url) {
  const response = await mockFetchWithHtmlError(url);

  let parsedData = null;
  const contentType = response.headers.get("content-type") || "";

  if (response.status !== 204) {
    if (contentType.includes("application/json")) {
      try {
        parsedData = await response.json();
      } catch {
        parsedData = null;
      }
    } else {
      // 🟢 Safely parses HTML/Text without throwing SyntaxError
      parsedData = await response.text();
    }
  }

  if (!response.ok) {
    throw new APIError(`HTTP Error ${response.status}`, response.status, parsedData);
  }

  return parsedData;
}

safeBodySniffingRequest("/api/failing-proxy").catch((err) => {
  console.log("  ✅ Safely Handled HTML 502 without SyntaxError Crash:");
  console.log(`    Status: ${err.status} | Body Content: "${err.data}"`);
});

console.log("\n=== 2. OPTIONAL QUERY PARAMETER URL BUILDER ===");

function buildEndpointUrl(baseUrl, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, String(val));
    }
  });
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

const cleanUrl = buildEndpointUrl("/api/products", {
  search: "laptop",
  category: null,
  minPrice: 500,
  tag: undefined
});

console.log("  Clean Dynamic URL with Filter Pruning:\n   ", cleanUrl);

console.log("\n=== 3. PRACTICAL ARCHITECTURE: UNIFIED REQUEST PIPELINE & DOMAIN SERVICE ===");

// 1. Unified HTTP Client Pipeline
async function unifiedRequest(url, config = {}) {
  const { params, headers, ...customOptions } = config;
  const fullUrl = buildEndpointUrl(url, params);

  console.log(`    🌐 [Pipeline Request]: ${customOptions.method || "GET"} ${fullUrl}`);

  const response = await mockFetchWithHtmlError(url);

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (response.status !== 204) {
    data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  }

  if (!response.ok) {
    throw new APIError(`Request failed: ${response.status}`, response.status, data);
  }

  return data;
}

// 2. Resource Domain Service
const productsApi = {
  getProducts: (filters) => unifiedRequest("/api/products", { params: filters }),
  createProduct: (product) =>
    unifiedRequest("/api/products", {
      method: "POST",
      body: JSON.stringify(product)
    })
};

setTimeout(async () => {
  const product = await productsApi.getProducts({ page: 1 });
  console.log("  ✅ Domain Service Result:", product);
  console.log("\n  🎉 [Fetch API, Request Construction & Error Handling Verification Completed Successfully!]");
}, 30);
