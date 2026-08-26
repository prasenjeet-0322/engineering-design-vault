/**
 * KPI 09 — Part 05: reduce() — Accumulation, Grouping, Indexing & Anti-Patterns
 * Demonstrates:
 * 1. Gotcha: O(N^2) Object Spread in Reducer vs O(N) Local In-Place Mutation
 * 2. Prediction 1: Missing Return Statement Fallback to NaN
 * 3. Prediction 2: Empty Array Error Without Initial Value
 * 4. Prediction 3: Function Pipeline Composition via reduce()
 * 5. Practical Architecture: Enterprise Multi-Field Cart Aggregator & Stats Engine
 */

"use strict";

console.log("=== 1. GOTCHA: O(N^2) SPREAD VS O(N) LOCAL MUTATION BENCHMARK ===");

const TEST_SIZE = 3000;
const testItems = Array.from({ length: TEST_SIZE }, (_, i) => ({
  id: `ID_${i}`,
  val: i
}));

// A. O(N^2) Quadratic Spread (Slow & memory heavy)
const startSpread = performance.now();
const spreadIndex = testItems.reduce((acc, item) => ({
  ...acc,
  [item.id]: item.val
}), {});
const timeSpread = performance.now() - startSpread;
console.log(`[Spread Indexing] ${TEST_SIZE} items took: ${timeSpread.toFixed(2)}ms`);

// B. O(N) Linear Local Mutation (Blazing fast & pure to outside)
const startMutate = performance.now();
const mutateIndex = testItems.reduce((acc, item) => {
  acc[item.id] = item.val;
  return acc;
}, {});
const timeMutate = performance.now() - startMutate;
console.log(`[Local Mutation Indexing] ${TEST_SIZE} items took: ${timeMutate.toFixed(2)}ms`);
console.log(`⚡ Speedup Factor: ${(timeSpread / timeMutate).toFixed(1)}x faster!`);

console.log("\n=== 2. PREDICTION 1: FORGOTTEN RETURN TRAP ===");
const numbers = [10, 20, 30];
const brokenSum = numbers.reduce((acc, num) => {
  acc += num; // Missing return acc!
}, 0);
console.log("Broken Sum (Missing return evaluates to):", brokenSum); // NaN

console.log("\n=== 3. PREDICTION 2: EMPTY ARRAY REDUCTION ===");
try {
  [].reduce((acc, x) => acc + x);
} catch (err) {
  console.log("Empty reduce without initial value threw:", err.name, `(${err.message})`);
}

const safeEmptySum = [].reduce((acc, x) => acc + x, 0);
console.log("Safe empty reduce with initial value 0:", safeEmptySum); // 0

console.log("\n=== 4. PREDICTION 3: FUNCTION PIPELINE VIA REDUCE ===");
const double = (x) => x * 2;
const addTen = (x) => x + 10;
const square = (x) => x * x;

const pipeline = [double, addTen, square];
const pipeResult = pipeline.reduce((accValue, currentFn) => currentFn(accValue), 5);
console.log("Pipeline Output for input 5 ( (5*2 + 10)^2 ):", pipeResult); // 400

console.log("\n=== 5. PRACTICAL ARCHITECTURE: CART AGGREGATION ENGINE ===");

const cartItems = [
  { id: "C1", name: "4K Gaming Monitor", category: "ELECTRONICS", unitPrice: 400, quantity: 1, isTaxExempt: false },
  { id: "C2", name: "Ergonomic Chair", category: "FURNITURE", unitPrice: 250, quantity: 2, isTaxExempt: false },
  { id: "C3", name: "Developer Hoodie", category: "APPAREL", unitPrice: 60, quantity: 1, isTaxExempt: true }
];

function calculateCartSummary(items, taxRate = 0.08) {
  return items.reduce(
    (acc, item) => {
      const lineTotal = item.unitPrice * item.quantity;
      acc.subtotal += lineTotal;
      acc.totalUnits += item.quantity;

      if (!item.isTaxExempt) {
        acc.taxableSubtotal += lineTotal;
        acc.totalTax += lineTotal * taxRate;
      }

      acc.categoryQuantities[item.category] = (acc.categoryQuantities[item.category] ?? 0) + item.quantity;
      acc.lookupById[item.id] = item;

      return acc;
    },
    {
      subtotal: 0,
      taxableSubtotal: 0,
      totalTax: 0,
      totalUnits: 0,
      categoryQuantities: {},
      lookupById: {}
    }
  );
}

const summary = calculateCartSummary(cartItems);
console.log("Cart Aggregate Summary Report:");
console.dir(summary, { depth: null });
