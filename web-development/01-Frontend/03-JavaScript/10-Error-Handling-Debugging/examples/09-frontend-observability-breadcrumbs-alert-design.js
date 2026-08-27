/**
 * KPI 10 — Part 09: Frontend Observability & Signal-to-Noise
 * Demonstrates:
 * 1. Gotcha: Breadcrumb Ring Buffer Bounded Eviction (Zero Memory Leak)
 * 2. Prediction 1: P95 Percentile Latency Distribution vs Averages
 * 3. Prediction 2: Deterministic Error Fingerprinting & Deduplication
 * 4. Prediction 3: Dynamic Sampling (100% Errors vs 10% Benign Events)
 * 5. Practical Architecture: Standalone Enterprise RUM & Telemetry Engine
 */

"use strict";

console.log("=== 1. BREADCRUMB RING BUFFER WITH BOUNDED EVICTION ===");

class BreadcrumbRingBuffer {
  constructor(limit = 3) {
    this.limit = limit;
    this.buffer = [];
  }

  add(crumb) {
    if (this.buffer.length >= this.limit) {
      const evicted = this.buffer.shift(); // Evict oldest
      console.log(`[RingBuffer Evicted Oldest]: "${evicted.message}"`);
    }
    this.buffer.push({ ...crumb, timestamp: new Date().toISOString() });
  }

  getSnapshot() {
    return [...this.buffer];
  }
}

const ring = new BreadcrumbRingBuffer(3);
ring.add({ category: "ui.click", message: "User clicked 'Products'" });
ring.add({ category: "navigation", message: "Navigated to /products/item-98" });
ring.add({ category: "ui.click", message: "User clicked 'Add to Cart'" });
ring.add({ category: "network", message: "POST /api/cart failed with 500" });

console.log("Final Bounded Breadcrumbs (Max 3):");
console.dir(ring.getSnapshot(), { depth: null });

console.log("\n=== 2. P95 PERCENTILE LATENCY DISTRIBUTION VS AVERAGE ===");

function calculatePercentile(latencies, percentile) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

// 20 API requests: 19 fast (50-120ms), 1 severe outlier (4500ms)
const sampleLatencies = [55, 60, 52, 70, 65, 80, 58, 62, 75, 90, 85, 95, 100, 110, 105, 120, 115, 98, 102, 4500];

const average = sampleLatencies.reduce((a, b) => a + b, 0) / sampleLatencies.length;
const p50 = calculatePercentile(sampleLatencies, 50);
const p95 = calculatePercentile(sampleLatencies, 95);
const p99 = calculatePercentile(sampleLatencies, 99);

console.log(`Average Latency: ${average.toFixed(1)}ms (Masks the outlier!)`);
console.log(`P50 (Median):    ${p50}ms`);
console.log(`P95 Latency:     ${p95}ms`);
console.log(`P99 (Worst-case): ${p99}ms (Exposes the true 4.5s latency spike!)`);

console.log("\n=== 3. DETERMINISTIC ERROR FINGERPRINTING ===");

function computeFingerprint(error) {
  // Normalize variable values (e.g. IDs) to collapse identical issues
  const normalizedMessage = error.message.replace(/id=\w+/g, "id=:id");
  return `${error.name}::${normalizedMessage}`;
}

const err1 = new TypeError("Failed to load user id=9812 from cache");
const err2 = new TypeError("Failed to load user id=1045 from cache");
const err3 = new RangeError("Invalid array buffer allocation");

console.log("Fingerprint 1:", computeFingerprint(err1));
console.log("Fingerprint 2:", computeFingerprint(err2));
console.log("Collapses to Same Group?:", computeFingerprint(err1) === computeFingerprint(err2)); // true
console.log("Fingerprint 3 (Distinct):", computeFingerprint(err3));

console.log("\n=== 4. DYNAMIC TELEMETRY SAMPLING ===");

class TelemetrySampler {
  constructor(sampleRate = 0.2) {
    this.sampleRate = sampleRate; // 20% for standard events
  }

  shouldRecord(isCriticalError) {
    // 🟢 Invariant: Always record 100% of critical errors
    if (isCriticalError) return true;
    return Math.random() < this.sampleRate;
  }
}

const sampler = new TelemetrySampler(0.2);
let criticalSampled = 0;
let routineSampled = 0;

for (let i = 0; i < 100; i++) {
  if (sampler.shouldRecord(true)) criticalSampled++;
  if (sampler.shouldRecord(false)) routineSampled++;
}

console.log(`Critical Errors Sampled (100 expected): ${criticalSampled}`);
console.log(`Routine Events Sampled (~20 expected):  ${routineSampled}`);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: REAL-USER MONITORING PIPELINE ===");

class RealUserMonitoringEngine {
  constructor(releaseVersion, environment) {
    this.releaseVersion = releaseVersion;
    this.environment = environment;
    this.breadcrumbs = new BreadcrumbRingBuffer(20);
    this.dispatchedReports = [];
  }

  trackUserAction(category, message) {
    this.breadcrumbs.add({ category, message });
  }

  reportError(error, extraContext = {}) {
    const payload = {
      timestamp: new Date().toISOString(),
      release: this.releaseVersion,
      environment: this.environment,
      fingerprint: computeFingerprint(error),
      error: { name: error.name, message: error.message, stack: error.stack },
      breadcrumbs: this.breadcrumbs.getSnapshot(),
      context: extraContext
    };

    this.dispatchedReports.push(payload);
    console.log(`[RUM DISPATCHED] -> Fingerprint: "${payload.fingerprint}", Release: "${payload.release}"`);
    return payload;
  }
}

const rum = new RealUserMonitoringEngine("v4.2.0-prod", "production");
rum.trackUserAction("navigation", "Loaded Checkout Page");
rum.trackUserAction("ui.click", "Clicked Submit Order Button");

const report = rum.reportError(new TypeError("Failed to load user id=7781 from cache"), {
  orderId: "ORD-991",
  cartTotal: 199.99
});

console.log("\nGenerated Production Telemetry Report Summary:");
console.dir(
  {
    Release: report.release,
    Fingerprint: report.fingerprint,
    BreadcrumbCount: report.breadcrumbs.length,
    Context: report.context
  },
  { depth: null }
);
