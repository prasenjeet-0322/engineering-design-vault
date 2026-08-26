/**
 * KPI 03 — Part 05: Execution Contexts, Call Stack & JavaScript Code Execution
 * Demonstrates:
 * 1. Gotcha: Single-Threaded Call Stack vs Async Task Queues
 * 2. Prediction 1: Call Stack LIFO Order
 * 3. Prediction 2: Independent Execution Contexts per Invocation
 * 4. Prediction 3: Closure Survival after Stack Frame Pop
 * 5. Prediction 4: Recursive Call Stack Execution
 * 6. Practical Architecture: Non-Blocking Task Batch Scheduler with Chunked Yielding
 */

console.log("=== 1. PREDICTION 1: CALL STACK LIFO EXECUTION ORDER ===");
function first() {
  console.log("first-start");
  second();
  console.log("first-end");
}
function second() {
  console.log("second-start");
  third();
  console.log("second-end");
}
function third() {
  console.log("third execution");
}
first();

console.log("\n=== 2. PREDICTION 2: INDEPENDENT INVOCATIONS ===");
function addOne(val) {
  return ++val;
}
const a = addOne(5);
const b = addOne(10);
console.log("addOne(5):", a, "| addOne(10):", b); // 6 | 11

console.log("\n=== 3. PREDICTION 3: CLOSURE SURVIVAL AFTER CONTEXT POP ===");
function createMultiplier(multiplier) {
  // Context popped, but 'multiplier' lifted to Heap Context
  return function multiply(value) {
    return value * multiplier;
  };
}
const double = createMultiplier(2);
console.log("double(10):", double(10)); // 20

console.log("\n=== 4. PREDICTION 4: RECURSIVE CALL STACK EXPANSION ===");
function sum(n) {
  if (n === 1) return 1;
  return n + sum(n - 1);
}
console.log("sum(4):", sum(4)); // 10

console.log("\n=== 5. PRACTICAL ARCHITECTURE: NON-BLOCKING TASK SCHEDULER ===");

async function processDatasetNonBlocking(items, chunkSize = 100) {
  const total = items.length;
  let processedCount = 0;
  console.log(`[Scheduler] Starting non-blocking process of ${total} records...`);

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    // Process synchronous chunk
    for (const item of chunk) {
      item.transformed = item.val * 2;
      processedCount++;
    }

    // ⚡ Yield execution context back to Event Loop every chunk
    await new Promise(resolve => setTimeout(resolve, 10));
    console.log(`[Scheduler] Processed ${processedCount}/${total} items (Yielded Call Stack).`);
  }

  console.log(`[Scheduler] Complete. All ${total} records processed without UI thread lockup.`);
}

const mockRecords = Array.from({ length: 300 }, (_, i) => ({ id: i, val: i + 1 }));
processDatasetNonBlocking(mockRecords, 100);
