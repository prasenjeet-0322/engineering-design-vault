/**
 * KPI 07 — Part 05: V8 Hidden Classes (Shapes), Inline Caches & Deoptimization
 * Demonstrates:
 * 1. Monomorphic vs Polymorphic Property Access
 * 2. Shape Divergence Through Key Insertion Order
 * 3. Pre-allocating Object Fields for Stable Shapes
 * 4. Micro-Benchmark: Monomorphic vs Megamorphic Property Access
 */

"use strict";

console.log("=== 1. PREDICTION 1: SHAPE DIVERGENCE VIA KEY ORDER ===");
function createPointA(x, y) {
  return { x, y };
}

function createPointB(x, y) {
  return { y, x }; // Same keys, different insertion order -> Different Hidden Class!
}

const p1 = createPointA(10, 20);
const p2 = createPointB(10, 20);

console.log("p1 layout keys:", Object.keys(p1)); // ['x', 'y']
console.log("p2 layout keys:", Object.keys(p2)); // ['y', 'x']

console.log("\n=== 2. MONOMORPHIC VS MEGAMORPHIC BENCHMARK ===");
const ITERATIONS = 1000000;

// Setup Monomorphic Dataset (All instances have identical Map)
const monomorphicData = [];
for (let i = 0; i < ITERATIONS; i++) {
  monomorphicData.push({ id: i, val: i * 2, status: "ACTIVE" });
}

// Setup Megamorphic Dataset (5+ distinct shapes)
const megamorphicData = [];
for (let i = 0; i < ITERATIONS; i++) {
  const mod = i % 5;
  if (mod === 0) megamorphicData.push({ id: i, val: i * 2, a: 1 });
  else if (mod === 1) megamorphicData.push({ b: 2, id: i, val: i * 2 });
  else if (mod === 2) megamorphicData.push({ c: 3, val: i * 2, id: i });
  else if (mod === 3) megamorphicData.push({ id: i, d: 4, val: i * 2 });
  else megamorphicData.push({ val: i * 2, id: i, e: 5 });
}

function computeSum(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i].val;
  }
  return sum;
}

// 1. Warm-up JIT
computeSum(monomorphicData.slice(0, 1000));

const startMono = performance.now();
const sumMono = computeSum(monomorphicData);
const endMono = performance.now();
console.log(`[Monomorphic IC] Sum: ${sumMono}, Time: ${(endMono - startMono).toFixed(2)}ms`);

const startMega = performance.now();
const sumMega = computeSum(megamorphicData);
const endMega = performance.now();
console.log(`[Megamorphic IC] Sum: ${sumMega}, Time: ${(endMega - startMega).toFixed(2)}ms`);
