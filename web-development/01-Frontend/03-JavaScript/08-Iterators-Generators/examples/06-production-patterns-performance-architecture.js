/**
 * KPI 08 — Part 06: Production Patterns, Performance & Architecture
 * Demonstrates:
 * 1. Gotcha: Eager Full Materialization vs Streaming Processing
 * 2. Prediction 1: Lazy Pipeline Halting Upstream Evaluation on Target Count
 * 3. Prediction 2: High-Throughput Token Batching for UI Responsiveness
 * 4. Prediction 3: Controlled Concurrency Pool Worker
 * 5. Practical Architecture: End-to-End Lazy Filter/Map/Take Pipeline Engine
 */

"use strict";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("=== 1. PREDICTION 1: LAZY PIPELINE UPSTREAM HALT ===");
let upstreamEvaluations = 0;

function* infiniteStream() {
  while (true) {
    upstreamEvaluations++;
    yield upstreamEvaluations;
  }
}

function* filterEvens(iterable) {
  for (const n of iterable) {
    if (n % 2 === 0) yield n;
  }
}

function* take(iterable, count) {
  let collected = 0;
  for (const item of iterable) {
    yield item;
    if (++collected >= count) break;
  }
}

const pipeline = take(filterEvens(infiniteStream()), 3);
console.log("Collected 3 evens:", [...pipeline]); // [2, 4, 6]
console.log("Total upstream evaluations (6 needed to find 3 evens):", upstreamEvaluations); // 6

console.log("\n=== 2. PREDICTION 2: CONTROLLED CONCURRENCY POOL ===");
async function* runConcurrentPool(tasks, maxConcurrency = 2) {
  const executing = new Set();
  const results = [];

  for (const task of tasks) {
    const p = Promise.resolve().then(task);
    executing.add(p);
    p.then(() => executing.delete(p));

    if (executing.size >= maxConcurrency) {
      await Promise.race(executing);
    }
    results.push(p);
  }

  for (const p of results) {
    yield await p;
  }
}

const sampleTasks = [
  async () => { await delay(20); return "TASK_1_DONE"; },
  async () => { await delay(30); return "TASK_2_DONE"; },
  async () => { await delay(10); return "TASK_3_DONE"; }
];

async function testPool() {
  const completed = [];
  for await (const res of runConcurrentPool(sampleTasks, 2)) {
    completed.push(res);
  }
  console.log("Concurrent pool completed tasks:", completed);
}

console.log("\n=== 3. PRACTICAL ARCHITECTURE: TELEMETRY BATCHING PIPELINE ===");

async function* rawTelemetrySource() {
  const metrics = [
    { id: 1, val: 45 }, { id: 2, val: 92 }, { id: 3, val: 88 },
    { id: 4, val: 30 }, { id: 5, val: 99 }, { id: 6, val: 85 }
  ];
  for (const m of metrics) {
    await delay(10);
    yield m;
  }
}

async function* batchTelemetryPipeline(source, threshold, batchSize = 2) {
  let batch = [];
  try {
    for await (const item of source) {
      if (item.val >= threshold) {
        batch.push(item);
      }
      if (batch.length >= batchSize) {
        yield batch;
        batch = [];
      }
    }
    if (batch.length > 0) {
      yield batch;
    }
  } finally {
    console.log("[Pipeline] Ingestion completed and resources released.");
  }
}

async function testBatching() {
  console.log("Streaming batched anomaly metrics (Threshold >= 85, BatchSize = 2):");
  for await (const batch of batchTelemetryPipeline(rawTelemetrySource(), 85, 2)) {
    console.log("Flushed Batch to UI:", batch.map(b => `#${b.id} (${b.val}%)`));
  }
}

async function main() {
  await testPool();
  await testBatching();
}

main().catch(console.error);
