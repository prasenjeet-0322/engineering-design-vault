/**
 * KPI 13 — Part 04: Async Iteration, for await...of, Async Generators & Streaming Data
 * Demonstrates:
 * 1. Gotcha: Direct `await generatorFn()` Trap vs `for await...of`
 * 2. Gotcha: Early Loop `break` and Guaranteed `try...finally` Cleanup
 * 3. Prediction 1: Lazy Evaluation & Progressive Yield Emission
 * 4. Prediction 2: Streaming Binary Chunks with TextDecoder
 * 5. Practical Architecture: Standalone Paginated REST API Async Generator
 */

"use strict";

console.log("=== 1. GOTCHA: DIRECT AWAIT ON ASYNC GENERATOR VS FOR AWAIT...OF ===");

async function* sampleGenerator() {
  yield "User A";
  yield "User B";
}

// ❌ Bug: Awaiting the generator directly returns the AsyncGenerator instance!
async function testBuggyAwait() {
  const result = await sampleGenerator();
  console.log("  ❌ [Direct Await Output]:", result.toString(), "(Not an Array!)");
}

// ✅ Fix: Progressive consumption with `for await...of`
async function testProperForAwait() {
  console.log("  🟢 [Proper for await...of Consumption]:");
  for await (const user of sampleGenerator()) {
    console.log("    - Yielded:", user);
  }
}

testBuggyAwait().then(() => testProperForAwait());

console.log("\n=== 2. GOTCHA: EARLY BREAK & GUARANTEED FINALLY CLEANUP ===");

async function* databaseStreamSimulator() {
  console.log("  🔌 [DB Connection Opened]");
  try {
    yield "Row 1";
    yield "Row 2";
    yield "Row 3";
    yield "Row 4";
  } finally {
    console.log("  🧹 [DB Connection CLOSED]: Cleanup executed on break/completion!");
  }
}

async function testEarlyBreak() {
  console.log("  ▶️ Starting loop with early break at Row 2:");
  for await (const row of databaseStreamSimulator()) {
    console.log("    Received:", row);
    if (row === "Row 2") {
      console.log("    🛑 Breaking out of loop early!");
      break; // Triggers iterator.return() -> executes finally block!
    }
  }
}

setTimeout(async () => {
  await testEarlyBreak();

  console.log("\n=== 3. PRACTICAL ARCHITECTURE: PAGINATED REST API ASYNC GENERATOR ===");

  async function* fetchAllPaginatedUsers(pageSize) {
    let page = 1;
    let hasMore = true;

    try {
      while (hasMore) {
        console.log(`    🌐 [Network Request]: Fetching Page ${page}...`);
        await new Promise((r) => setTimeout(r, 20)); // Network delay

        const mockResponse = {
          users: [`User-${(page - 1) * pageSize + 1}`, `User-${(page - 1) * pageSize + 2}`],
          hasNextPage: page < 3
        };

        for (const user of mockResponse.users) {
          yield user; // Yield entities one-by-one
        }

        hasMore = mockResponse.hasNextPage;
        page++;
      }
    } finally {
      console.log("    ✨ [Pagination Generator Stream Exhausted & Closed]");
    }
  }

  console.log("  ▶️ Consuming all users through single clean loop:");
  const collectedUsers = [];
  for await (const user of fetchAllPaginatedUsers(2)) {
    collectedUsers.push(user);
  }
  console.log("  🎉 [All Paginated Records Collected]:", collectedUsers);
}, 50);
