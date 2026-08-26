/**
 * KPI 02 — Part 18: IIFEs, Generators, Iterators & Async Functions
 * Demonstrates:
 * 1. Gotcha: await Microtask Scheduling Order
 * 2. Prediction 1: IIFE Immediate Value Evaluation
 * 3. Prediction 2: Generator Resumption Steps
 * 4. Prediction 4: Sequential Async Waterfall vs Promise.all Parallelization
 * 5. Prediction 5: Independent Generator Instance States
 * 6. Practical Architecture: Async Paginated Streamer with for await...of
 */

console.log("=== 1. GOTCHA & PREDICTION 3: AWAIT MICROTASK ORDER ===");
async function demoAsync() {
  console.log("A");
  await Promise.resolve();
  console.log("B");
}

console.log("1");
demoAsync();
console.log("2");

console.log("\n=== 2. PREDICTION 1: IIFE VALUE EVALUATION ===");
const computedConfig = (() => {
  const baseRate = 1.18;
  const rawPrice = 500;
  return { finalPrice: rawPrice * baseRate };
})();
console.log("computedConfig.finalPrice:", computedConfig.finalPrice); // 590

console.log("\n=== 3. PREDICTION 2: GENERATOR SUSPENSION & RESUMPTION ===");
function* sequenceGenerator() {
  console.log("Gen: Step 1");
  yield 100;
  console.log("Gen: Step 2");
  yield 200;
}
const gen = sequenceGenerator();
console.log("External: Initialized");
console.log("gen.next():", gen.next());
console.log("gen.next():", gen.next());
console.log("gen.next():", gen.next());

console.log("\n=== 4. PREDICTION 5: INDEPENDENT GENERATOR INSTANCES ===");
function* idCounter() {
  let count = 0;
  while (count < 3) yield count++;
}
const genA = idCounter();
const genB = idCounter();
console.log("genA.next():", genA.next().value); // 0
console.log("genA.next():", genA.next().value); // 1
console.log("genB.next():", genB.next().value); // 0

console.log("\n=== 5. PREDICTION 4: WATERFALL VS PROMISE.ALL ===");
const fakeFetch = (name, delay) => new Promise(resolve => setTimeout(() => resolve(name), delay));

async function runPerformanceComparison() {
  // Parallel Fetching
  const start = Date.now();
  const [res1, res2] = await Promise.all([
    fakeFetch("Users", 50),
    fakeFetch("Posts", 50)
  ]);
  const elapsed = Date.now() - start;
  console.log(`Parallel Results: [${res1}, ${res2}] in ~${elapsed}ms (Expected ~50ms)`);
}

console.log("\n=== 6. PRACTICAL ARCHITECTURE: ASYNC PAGINATED STREAMER ===");

// ⚡ Async Generator for Paginated Data Streaming
async function* paginateRecords(totalPages) {
  for (let page = 1; page <= totalPages; page++) {
    await new Promise(r => setTimeout(r, 20)); // Simulating network latency
    yield [
      { id: `rec_${page}_1`, title: `Article ${page}.1` },
      { id: `rec_${page}_2`, title: `Article ${page}.2` }
    ];
  }
}

async function consumeStream() {
  console.log("[Stream] Starting paginated stream consumption...");
  const records = [];
  for await (const pageItems of paginateRecords(3)) {
    console.log(`[Stream] Received page chunk (${pageItems.length} items)`);
    records.push(...pageItems);
  }
  console.log(`[Stream] Stream complete! Total records collected: ${records.length}`);
}

async function main() {
  await runPerformanceComparison();
  await consumeStream();
}

main();
