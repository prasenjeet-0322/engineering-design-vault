/**
 * KPI 14 (ESM) — Part 02: Dynamic import(), Code Splitting, Lazy Loading & Tree Shaking
 * Demonstrates:
 * 1. Gotcha: Dynamic Import Waterfall vs Parallelized Promise.all Execution
 * 2. Gotcha: Named vs Default Export Extraction from Dynamic Namespace Object
 * 3. Prediction 1: Module Namespace Object Inspection
 * 4. Prediction 2: Interaction-Triggered Lazy Module Loading with In-Memory Caching
 * 5. Practical Architecture: Standalone Dynamic Plugin Loader with Parallel Prefetching
 */

console.log("=== 1. GOTCHA: NAMED & DEFAULT EXTRACTION FROM DYNAMIC IMPORT ===");

async function testDynamicImport() {
  // Dynamically load the plugin module at runtime
  const pluginModule = await import("./02-lazy-math-plugin.mjs");

  console.log("  📦 [Module Namespace Object Loaded]:");
  console.log("    - Named Export `PLUGIN_VERSION`:", pluginModule.PLUGIN_VERSION);
  console.log("    - Named Export `computeMetrics([10, 20, 30])`:", pluginModule.computeMetrics([10, 20, 30]));
  console.log("    - Default Export `renderPluginWidget()`:", pluginModule.default());
}

testDynamicImport().then(async () => {
  console.log("\n=== 2. GOTCHA: DYNAMIC IMPORT WATERFALL VS PARALLEL DISPATCH ===");

  const fakeChunkFetch = (name, delayMs) =>
    new Promise((resolve) => setTimeout(() => resolve(`Chunk [${name}]`), delayMs));

  // Sequential Waterfall
  const t0 = Date.now();
  await fakeChunkFetch("AnalyticsModal", 30);
  await fakeChunkFetch("D3Engine", 40);
  await fakeChunkFetch("StatsPlugin", 25);
  const waterfallDuration = Date.now() - t0;
  console.log(`  ❌ [Sequential Dynamic Waterfall Finished]: ${waterfallDuration}ms (Expected ~95ms)`);

  // Parallel Dispatch with Promise.all
  const t1 = Date.now();
  const chunks = await Promise.all([
    fakeChunkFetch("AnalyticsModal", 30),
    fakeChunkFetch("D3Engine", 40),
    fakeChunkFetch("StatsPlugin", 25)
  ]);
  const parallelDuration = Date.now() - t1;
  console.log(`  ⚡ [Parallel Dynamic Imports Finished]: ${parallelDuration}ms (Expected ~40ms):`, chunks);

  console.log("\n=== 3. PRACTICAL ARCHITECTURE: DYNAMIC PLUGIN LOADER WITH PREFETCH CACHE ===");

  class DynamicPluginLoader {
    constructor() {
      this.cache = new Map();
    }

    // Predictive prefetch (e.g. on mouse hover)
    prefetch(path) {
      if (this.cache.has(path)) return this.cache.get(path);
      console.log(`    🌐 [Prefetch Triggered]: Loading chunk "${path}" in background...`);
      const promise = import(path);
      this.cache.set(path, promise);
      return promise;
    }

    // Execute plugin load
    async load(path) {
      if (this.cache.has(path)) {
        console.log(`    📦 [Cache Hit]: Reusing prefetched module for "${path}"`);
        return this.cache.get(path);
      }
      return this.prefetch(path);
    }
  }

  const loader = new DynamicPluginLoader();

  // User hovers over button
  console.log("  ▶️ 1. User hovers over 'Analytics' button:");
  loader.prefetch("./02-lazy-math-plugin.mjs");

  // User clicks button 20ms later
  setTimeout(async () => {
    console.log("\n  ▶️ 2. User clicks 'Analytics' button:");
    const module = await loader.load("./02-lazy-math-plugin.mjs");
    console.log("    🎉 Plugin rendered successfully:", module.default());
  }, 20);
});
