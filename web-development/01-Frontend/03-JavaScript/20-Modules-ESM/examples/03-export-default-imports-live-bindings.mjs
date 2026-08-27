/**
 * KPI 20 — Part 03: export default, Import Patterns & Choosing the Right Module API
 * Demonstrates:
 * 1. Gotcha: Default Export Local Renaming Freedom & Renaming Drift
 * 2. Gotcha: Namespace Import (* as) Object Aggregation
 * 3. Prediction 1: Combined Default & Named Import Unpacking
 * 4. Prediction 2: Dynamic Asynchronous Module Loading with Code Splitting Simulation
 * 5. Practical Architecture: Standalone Module System Orchestrating All Import Patterns
 */

console.log("=== 1. GOTCHA: DEFAULT EXPORT LOCAL RENAMING FREEDOM ===");

// Simulating a module with a default export
const DefaultComponentModule = (() => {
  return {
    default: function PrimaryWidget() {
      return "PRIMARY_WIDGET_RENDERED";
    }
  };
})();

// Consumer A imports as `PrimaryWidget`
const PrimaryWidget = DefaultComponentModule.default;

// Consumer B imports as `ArbitraryName` (Renaming drift)
const ArbitraryName = DefaultComponentModule.default;

console.log("  Consumer A Render:", PrimaryWidget());
console.log("  Consumer B Render (Different Local Name, Same Function):", ArbitraryName());
console.log("  Are references identical?", PrimaryWidget === ArbitraryName); // true

console.log("\n=== 2. NAMESPACE IMPORT (* AS) AGGREGATION ===");

// Simulating `import * as MathToolkit from './math.js'`
const MathToolkit = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  VERSION: "1.0.0"
};

console.log("  Namespace Keys:", Object.keys(MathToolkit).sort());
console.log("  Namespace Method Execution:", MathToolkit.add(10, 25));

console.log("\n=== 3. COMBINED DEFAULT + NAMED EXPORT DESTRUCTURING ===");

const SdkModule = {
  default: function createSdkClient() {
    return { initialized: true };
  },
  SDK_VERSION: "3.2.1",
  validateConfig: () => true
};

// Emulating: import createSdkClient, { SDK_VERSION, validateConfig } from './sdk.js'
const defaultClient = SdkModule.default;
const { SDK_VERSION, validateConfig } = SdkModule;

console.log("  Default Client Instance:", defaultClient());
console.log("  Named SDK Version:", SDK_VERSION);
console.log("  Named Validator:", validateConfig());

console.log("\n=== 4. DYNAMIC ON-DEMAND MODULE LOADING SIMULATION ===");

async function loadHeavyPluginOnDemand() {
  console.log("    ⏳ [Dynamic Loading]: Downloading lazy plugin chunk...");
  await new Promise((res) => setTimeout(res, 30)); // Simulating network latency

  const lazyPlugin = {
    renderChart: () => "HEAVY_CHART_SVG_RENDERED",
    chunkSize: "45KB"
  };

  console.log("    ✅ [Dynamic Loading]: Chunk resolved successfully!");
  return lazyPlugin;
}

loadHeavyPluginOnDemand().then((plugin) => {
  console.log("  Rendered from Dynamic Chunk:", plugin.renderChart());
  console.log("  Chunk Metadata:", plugin.chunkSize);
  console.log("\n  🎉 [`export default`, Import Patterns & Dynamic Modules Verification Completed Successfully!]");
});
