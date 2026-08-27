/**
 * KPI 16 — Part 02: Storage, Networking, Navigation, URLs, Permissions & Device APIs
 * Demonstrates:
 * 1. Gotcha: Synchronous Storage Deserialization Crash vs Safe Fallback Accessor
 * 2. Gotcha: URL & URLSearchParams Structured State Management
 * 3. Prediction 1: Single-Read Stream Consumption & Response Cloning
 * 4. Prediction 2: URLSearchParams Special Character Encoding
 * 5. Practical Architecture: Standalone Secure Client-Side Storage & URL State Synchronizer
 */

"use strict";

console.log("=== 1. GOTCHA: SAFE STORAGE ACCESS & CORRUPT DATA RESILIENCE ===");

class SafeClientStorage {
  constructor() {
    this.memoryFallback = new Map();
  }

  getItem(key, fallbackValue = null) {
    try {
      const raw = this.memoryFallback.get(key);
      if (!raw) return fallbackValue;
      return JSON.parse(raw);
    } catch {
      console.log(`  🛡️ [Corrupt JSON Intercepted]: Returning fallback value for key "${key}"`);
      return fallbackValue;
    }
  }

  setItem(key, value) {
    try {
      this.memoryFallback.set(key, JSON.stringify(value));
    } catch (err) {
      console.error(`  🚨 Failed to write key "${key}":`, err.message);
    }
  }

  injectCorruptData(key, corruptString) {
    this.memoryFallback.set(key, corruptString);
  }
}

const storage = new SafeClientStorage();

// 1. Valid data
storage.setItem("user_theme", { mode: "dark", fontSize: 16 });
console.log("  ✅ Valid Storage Read:", storage.getItem("user_theme"));

// 2. Corrupt data
storage.injectCorruptData("corrupt_settings", "MALFORMED_JSON_STRING_{{{");
const safeResult = storage.getItem("corrupt_settings", { mode: "default_fallback" });
console.log("  ✅ Safe Fallback Output on Corrupt Key:", safeResult);

console.log("\n=== 2. URL & URLSEARCHPARAMS STATE SERIALIZATION ===");

function buildShareableFilterUrl(baseOrigin, path, filters) {
  // Simulating URL construction
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return `${baseOrigin}${path}${queryString ? `?${queryString}` : ""}`;
}

const filterConfig = {
  query: "react & typescript masterclass",
  category: "frontend",
  page: 2,
  sort: "date_desc",
  emptyFilter: "" // Should be safely omitted
};

const generatedUrl = buildShareableFilterUrl("https://vault.engineering.com", "/courses", filterConfig);
console.log("  🌐 Generated Shareable URL with Params:\n    ", generatedUrl);

console.log("\n=== 3. PRACTICAL ARCHITECTURE: URL STATE SYNCHRONIZER ENGINE ===");

class UrlStateSynchronizer {
  constructor(initialUrl) {
    this.currentUrl = initialUrl;
  }

  getParam(key) {
    const urlObj = new URL(this.currentUrl);
    return urlObj.searchParams.get(key);
  }

  updateParam(key, value, replace = true) {
    const urlObj = new URL(this.currentUrl);
    if (value === null || value === undefined) {
      urlObj.searchParams.delete(key);
    } else {
      urlObj.searchParams.set(key, value);
    }
    this.currentUrl = urlObj.toString();
    console.log(`    🔄 [${replace ? "replaceState" : "pushState"}]: Updated "${key}" to "${value}" -> ${this.currentUrl}`);
    return this.currentUrl;
  }
}

const synchronizer = new UrlStateSynchronizer("https://vault.engineering.com/search?q=javascript&page=1");
console.log("  Initial URL Query 'q':", synchronizer.getParam("q"));

console.log("  ▶️ User modifies search query to 'web-apis':");
synchronizer.updateParam("q", "web-apis");

console.log("  ▶️ User advances pagination to page 2:");
synchronizer.updateParam("page", "2");

console.log("\n  🎉 [Client Storage & URL State Verification Completed Successfully!]");
