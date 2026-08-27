/**
 * KPI 09 — Part 04: Declarative Data Transformation (map, filter, reduce & Pipelines)
 * Demonstrates:
 * 1. Gotcha 1: O(N^2) Spread in reduce vs O(N) Controlled Local Mutation
 * 2. Gotcha 2: Vacuous Truth in [].every()
 * 3. Prediction 1: Pipeline Stage Ordering Optimization
 * 4. Prediction 2: flatMap vs map Array Normalization
 * 5. Prediction 3: reduce Without Initial Value Coercion Trap
 * 6. Practical Architecture: Enterprise Financial Transaction Aggregator
 */

"use strict";

console.log("=== 1. GOTCHA: O(N^2) SPREAD IN REDUCE VS O(N) MUTATION ===");
const items = Array.from({ length: 5000 }, (_, i) => ({
  id: `ID_${i}`,
  category: i % 2 === 0 ? "TECH" : "SALES",
  score: i
}));

// A. Slow O(N^2) Spread in Reducer
const startSpread = performance.now();
const spreadGroup = items.reduce((acc, item) => ({
  ...acc,
  [item.category]: (acc[item.category] || 0) + item.score
}), {});
const spreadDuration = performance.now() - startSpread;

// B. Fast O(N) Controlled Local Mutation
const startMut = performance.now();
const mutGroup = items.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + item.score;
  return acc;
}, {});
const mutDuration = performance.now() - startMut;

console.log("Spread total score (TECH):", spreadGroup.TECH);
console.log("Mutation total score (TECH):", mutGroup.TECH);
console.log(`Spread Time (O(N^2)): ${spreadDuration.toFixed(2)}ms`);
console.log(`Mutation Time (O(N)): ${mutDuration.toFixed(2)}ms`);
console.log(`Speedup factor: ${(spreadDuration / mutDuration).toFixed(1)}x faster!`);

console.log("\n=== 2. GOTCHA: VACUOUS TRUTH IN [].every() ===");
const emptyArray = [];
console.log("Is [].every(false) true?:", emptyArray.every(() => false)); // true (Vacuous Truth!)
console.log("Is [].some(true) false?:", emptyArray.some(() => true)); // false

console.log("\n=== 3. PREDICTION 1: PIPELINE ORDERING ===");
const numbers = [1, 2, 3, 4, 5, 6];
let mapOperations = 0;

// Filter first, then map
const optimized = numbers
  .filter(n => n > 3)
  .map(n => {
    mapOperations++;
    return n * 2;
  });

console.log("Optimized Pipeline Result:", optimized); // [8, 10, 12]
console.log("Total map operations executed (3 instead of 6):", mapOperations); // 3

console.log("\n=== 4. PREDICTION 2: FLATMAP NORMALIZATION ===");
const userTags = [
  { user: "Sunny", tags: ["react", "typescript"] },
  { user: "Alex", tags: ["node", "graphql"] }
];

const allTags = userTags.flatMap(u => u.tags);
console.log("FlatMapped Tags:", allTags); // ["react", "typescript", "node", "graphql"]

console.log("\n=== 5. PRACTICAL ARCHITECTURE: FINANCIAL AGGREGATOR ===");
const transactions = [
  { id: "T1", category: "CLOUD", amount: 1200, status: "SETTLED" },
  { id: "T2", category: "MARKETING", amount: 450, status: "SETTLED" },
  { id: "T3", category: "CLOUD", amount: 300, status: "PENDING" },
  { id: "T4", category: "OFFICE", amount: 40, status: "SETTLED" },
  { id: "T5", category: "SALARY", amount: 8000, status: "SETTLED" }
];

function aggregateCategorySpends(data, minSpend) {
  return Object.entries(
    data
      .filter(t => t.status === "SETTLED" && t.amount >= minSpend)
      .reduce((acc, t) => {
        const entry = (acc[t.category] ??= { total: 0, count: 0 });
        entry.total += t.amount;
        entry.count += 1;
        return acc;
      }, {})
  )
    .map(([category, stats]) => ({
      category,
      totalSpent: stats.total,
      settledTransactions: stats.count
    }))
    .toSorted((a, b) => b.totalSpent - a.totalSpent);
}

const summary = aggregateCategorySpends(transactions, 100);
console.log("Financial Category Summary (Min Spend >= $100):");
console.table(summary);
