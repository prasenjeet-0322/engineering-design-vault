/**
 * KPI 09 — Part 05: Function Composition (compose, pipe & Pipelines)
 * Demonstrates:
 * 1. Gotcha: Multi-Argument Function Failure Inside pipe() Without Unary Currying
 * 2. Prediction 1: compose() Right-to-Left vs pipe() Left-to-Right Execution Order
 * 3. Prediction 2: tap() Interceptor for Debugging and Side Effects
 * 4. Prediction 3: pipeAsync() for Sequential Asynchronous Transformations
 * 5. Practical Architecture: Enterprise Product Search & Filter Pipeline
 */

"use strict";

console.log("=== 1. GOTCHA: MULTI-ARGUMENT FAILURE IN PIPE ===");
const pipe = (...fns) => (val) => fns.reduce((res, fn) => fn(res), val);
const compose = (...fns) => (val) => fns.reduceRight((res, fn) => fn(res), val);

// Multi-argument function
const multiply = (a, b) => a * b;
const addTen = (x) => x + 10;

// Broken: pipe only passes one argument to multiply
const brokenPipeline = pipe(multiply, addTen);
console.log("Broken calculate(5, 4) produces:", brokenPipeline(5, 4)); // NaN

// Fixed: Curried Unary Factory
const multiplyBy = (factor) => (x) => x * factor;
const fixedPipeline = pipe(multiplyBy(4), addTen);
console.log("Fixed calculate(5) produces:", fixedPipeline(5)); // (5 * 4) + 10 = 30

console.log("\n=== 2. PREDICTION 1: COMPOSE VS PIPE ORDER ===");
const addTwo = (x) => x + 2;
const triple = (x) => x * 3;

const composeResult = compose(addTwo, triple)(4); // (4 * 3) + 2 = 14
const pipeResult = pipe(addTwo, triple)(4);       // (4 + 2) * 3 = 18

console.log("compose(addTwo, triple)(4):", composeResult); // 14
console.log("pipe(addTwo, triple)(4):", pipeResult);       // 18

console.log("\n=== 3. PREDICTION 2: TAP COMBINATOR ===");
let tapCallCount = 0;
const tap = (effect) => (val) => {
  effect(val);
  return val;
};

const loggedPipeline = pipe(
  (s) => s.trim().toUpperCase(),
  tap((val) => {
    tapCallCount++;
    console.log("[Tap Spy] Intermediate string:", val);
  }),
  (s) => `USER_${s}`
);

const processed = loggedPipeline("   prasenjeet   ");
console.log("Final Output:", processed);
console.log("Tap Call Count:", tapCallCount);

console.log("\n=== 4. PREDICTION 3: ASYNCHRONOUS PIPELINES (PIPEASYNC) ===");
const pipeAsync = (...fns) => async (initial) => {
  let res = initial;
  for (const fn of fns) {
    res = await fn(res);
  }
  return res;
};

const fetchScoreAsync = async (id) => {
  return id * 100;
};

const addBonusAsync = async (score) => {
  return score + 50;
};

const formatOutput = (score) => `SCORE_RECORD: $${score.toLocaleString()}`;

async function runAsyncPipeline() {
  const evaluateUser = pipeAsync(fetchScoreAsync, addBonusAsync, formatOutput);
  const result = await evaluateUser(5);
  console.log("Async Pipeline Output:", result); // SCORE_RECORD: $550
}

console.log("\n=== 5. PRACTICAL ARCHITECTURE: PRODUCT SEARCH PIPELINE ===");
const rawCatalog = [
  { id: "1", title: "  Ultra-Wide Monitor ", price: 499, category: "TECH", inStock: true },
  { id: "2", title: "Ergonomic Desk Chair", price: 250, category: "OFFICE", inStock: true },
  { id: "3", title: "Mechanical Keyboard", price: 120, category: "TECH", inStock: false },
  { id: "4", title: "Noise Cancelling Headphones", price: 300, category: "TECH", inStock: true }
];

// Unary Pipeline Stage Factories
const filterInStock = (items) => items.filter((i) => i.inStock);
const filterCategory = (cat) => (items) => cat === "ALL" ? items : items.filter((i) => i.category === cat);
const filterQuery = (q) => (items) => {
  const clean = q.trim().toLowerCase();
  return clean ? items.filter((i) => i.title.toLowerCase().includes(clean)) : items;
};
const sortByPrice = (items) => items.toSorted((a, b) => a.price - b.price);
const projectToViewModel = (items) =>
  items.map((i) => ({
    id: i.id,
    title: i.title.trim(),
    price: `$${i.price.toFixed(2)}`,
    category: `[${i.category}]`
  }));

function searchProducts(catalog, category, query) {
  const searchPipeline = pipe(
    filterInStock,
    filterCategory(category),
    filterQuery(query),
    sortByPrice,
    projectToViewModel
  );
  return searchPipeline(catalog);
}

console.log("Filtered Products (Category: TECH, InStock: true):");
console.table(searchProducts(rawCatalog, "TECH", ""));

runAsyncPipeline().catch(console.error);
