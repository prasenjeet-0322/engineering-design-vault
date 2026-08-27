/**
 * KPI 09 — Part 07: Advanced Functional Concepts (Memoization, Recursion & Monads)
 * Demonstrates:
 * 1. Gotcha: LRU Bounded Cache vs Unbounded Memoization Memory Leak
 * 2. Prediction 1: Lazy Thunk Deferral vs Immediate Eager Execution
 * 3. Prediction 2: Recursive Hierarchical Tree Calculation & DFS
 * 4. Prediction 3: Monadic Result Chaining with Short-Circuit Failure
 * 5. Prediction 4: Trampoline Safe Tail Recursion
 * 6. Practical Architecture: Enterprise Recursive Tree & Monadic Ingestion Pipeline
 */

"use strict";

console.log("=== 1. GOTCHA: LRU BOUNDED CACHE VS UNBOUNDED LEAK ===");
function createLruMemoize(fn, capacity = 2) {
  const cache = new Map();
  return function(arg) {
    if (cache.has(arg)) {
      const val = cache.get(arg);
      cache.delete(arg);
      cache.set(arg, val); // Refresh recency
      return val;
    }
    const res = fn(arg);
    if (cache.size >= capacity) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey); // Evict LRU key
    }
    cache.set(arg, res);
    return res;
  };
}

let heavyComputations = 0;
const memoHeavy = createLruMemoize((x) => {
  heavyComputations++;
  return x * 100;
}, 2);

memoHeavy(10); // Compute (Cache: [10])
memoHeavy(20); // Compute (Cache: [10, 20])
memoHeavy(10); // Cache Hit (Cache: [20, 10])
memoHeavy(30); // Evicts 20! (Cache: [10, 30])
memoHeavy(20); // Recomputed!

console.log("Total heavy computations run (4 expected):", heavyComputations); // 4

console.log("\n=== 2. PREDICTION 1: LAZY THUNK DEFERRAL ===");
let eagerWorkDone = false;
let lazyWorkDone = false;

// Eager
const eagerVal = (() => { eagerWorkDone = true; return 42; })();
console.log("Eager work executed immediately?:", eagerWorkDone); // true

// Lazy Thunk
const lazyThunk = () => { lazyWorkDone = true; return 42; };
console.log("Lazy work executed at definition?:", lazyWorkDone); // false
console.log("Invoking lazy thunk now:", lazyThunk());
console.log("Lazy work executed after invocation?:", lazyWorkDone); // true

console.log("\n=== 3. PREDICTION 2: RECURSIVE TREE CALCULATION ===");
const fileTree = {
  name: "root",
  sizeKb: 5,
  children: [
    {
      name: "src",
      sizeKb: 15,
      children: [
        { name: "App.tsx", sizeKb: 25 },
        { name: "Index.css", sizeKb: 10 }
      ]
    },
    { name: "package.json", sizeKb: 2 }
  ]
};

function calculateTotalTreeSize(node) {
  const childSize = (node.children || []).reduce(
    (sum, child) => sum + calculateTotalTreeSize(child),
    0
  );
  return node.sizeKb + childSize;
}

console.log("Total Recursive Tree Size:", calculateTotalTreeSize(fileTree), "KB"); // 57 KB

console.log("\n=== 4. PREDICTION 3: MONADIC RESULT CHAINING ===");
const chain = (fn) => (result) => result.ok ? fn(result.value) : result;

const parsePositiveNumber = (str) => {
  const num = Number(str);
  if (Number.isNaN(num)) return { ok: false, error: "ERR_NOT_A_NUMBER" };
  if (num <= 0) return { ok: false, error: "ERR_MUST_BE_POSITIVE" };
  return { ok: true, value: num };
};

const applyDiscount = (price) =>
  price > 100
    ? { ok: true, value: price * 0.9 }
    : { ok: false, error: "ERR_PRICE_BELOW_DISCOUNT_THRESHOLD" };

const processDiscountPipeline = (input) =>
  chain(applyDiscount)(parsePositiveNumber(input));

console.log("Input '200':", processDiscountPipeline("200")); // { ok: true, value: 180 }
console.log("Input '50':", processDiscountPipeline("50"));   // { ok: false, error: 'ERR_PRICE_BELOW_DISCOUNT_THRESHOLD' }
console.log("Input 'abc':", processDiscountPipeline("abc")); // { ok: false, error: 'ERR_NOT_A_NUMBER' }

console.log("\n=== 5. PREDICTION 4: TRAMPOLINING DEEP RECURSION ===");
const trampoline = (fn) => (...args) => {
  let res = fn(...args);
  while (typeof res === "function") {
    res = res();
  }
  return res;
};

const recursiveSum = (n, acc = 0) =>
  n <= 0 ? acc : () => recursiveSum(n - 1, acc + n);

const safeSum = trampoline(recursiveSum);
console.log("Safe Trampolined Sum of 1000:", safeSum(1000)); // 500500
