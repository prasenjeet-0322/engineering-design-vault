/**
 * KPI 08 — Part 05: Async Iterators, Async Generators & Streaming
 * Demonstrates:
 * 1. Gotcha: Sequential Step-by-Step Async Generation vs Batching
 * 2. Prediction 1: Delayed Async Iterator Consumption with for await...of
 * 3. Prediction 2: for await...of Consuming Synchronous Iterables
 * 4. Prediction 3: Async Generator finally Teardown During Loop break
 * 5. Prediction 4: Composable Multi-Stage Async Transform Pipeline
 * 6. Practical Architecture: Mock AI Token Streaming Pipeline with Abort Signal
 */

"use strict";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("=== 1. GOTCHA: SEQUENTIAL ASYNC ITERATION ===");
async function* fetchPagesSequential() {
  for (let i = 1; i <= 3; i++) {
    await delay(50); // Simulate network latency
    yield `Page_${i}_Data`;
  }
}

async function runSequential() {
  const start = Date.now();
  const pages = [];
  for await (const page of fetchPagesSequential()) {
    pages.push(page);
  }
  console.log("Fetched pages sequentially:", pages);
  console.log(`Total time elapsed: ~${Date.now() - start}ms`);
}

console.log("\n=== 2. PREDICTION 1 & 2: SYNC ITERABLE CONSUMPTION IN FOR AWAIT ===");
async function testSyncConsumption() {
  const syncNumbers = [10, 20, 30];
  const doubled = [];
  for await (const n of syncNumbers) {
    doubled.push(n * 2);
  }
  console.log("Doubled synchronous numbers in for await:", doubled);
}

console.log("\n=== 3. PREDICTION 3: ASYNC TEARDOWN ON BREAK ===");
async function* telemetryChannel() {
  try {
    yield "METRIC_1: CPU 12%";
    yield "METRIC_2: CPU 84%";
    yield "METRIC_3: CPU 95%";
  } finally {
    await delay(20);
    console.log("[TelemetryChannel] Async socket teardown completed cleanly in finally.");
  }
}

async function testTeardown() {
  for await (const metric of telemetryChannel()) {
    console.log("Read:", metric);
    if (metric.includes("84%")) {
      console.log("Threshold exceeded! Breaking early...");
      break;
    }
  }
}

console.log("\n=== 4. PREDICTION 4: COMPOSABLE ASYNC PIPELINE ===");
async function* rawNumberStream() {
  yield 1; yield 2; yield 3;
}

async function* multiplyStream(source, factor) {
  for await (const num of source) {
    yield num * factor;
  }
}

async function* formatStream(source) {
  for await (const num of source) {
    yield `VAL_${num}`;
  }
}

async function testPipeline() {
  const stream = formatStream(multiplyStream(rawNumberStream(), 5));
  const output = [];
  for await (const item of stream) {
    output.push(item);
  }
  console.log("Composable pipeline result:", output);
}

console.log("\n=== 5. PRACTICAL ARCHITECTURE: AI TOKEN STREAMING PIPELINE ===");

async function* mockAiTokenStream(prompt, abortSignal) {
  const tokens = ["Generative", " AI", " architecture", " using", " async", " generators."];

  try {
    for (const token of tokens) {
      if (abortSignal?.aborted) {
        console.log("[AIStream] Abort signal received!");
        break;
      }
      await delay(30);
      yield token;
    }
  } finally {
    console.log("[AIStream] Reader released and network resources closed.");
  }
}

async function runAiChatDemo() {
  const prompt = "Explain JavaScript async generators";
  console.log(`[User]: ${prompt}`);
  process.stdout.write("[AI Response]: ");

  for await (const token of mockAiTokenStream(prompt)) {
    process.stdout.write(token);
  }
  console.log("\n[Stream Complete]");
}

async function main() {
  await runSequential();
  await testSyncConsumption();
  await testTeardown();
  await testPipeline();
  await runAiChatDemo();
}

main().catch(console.error);
