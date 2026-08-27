/**
 * KPI 08 — Part 01: Iteration Protocols, Symbol.iterator & for...of Internals
 * Demonstrates:
 * 1. Gotcha: Stateful Iterator Exhaustion vs Restartable Iterables
 * 2. Prediction 1: Iterator Yielding undefined with done: false
 * 3. Prediction 2: Unicode Surrogate Pair String Iteration vs Indexing
 * 4. Prediction 3: Map and Set Iteration with Positional Destructuring
 * 5. Prediction 4: Infinite Iterable Generation with Safe take(n) Slicing
 * 6. Practical Architecture: Lazy Paginated Virtual Feed Engine
 */

"use strict";

console.log("=== 1. GOTCHA: STATEFUL EXHAUSTION VS RESTARTABLE ITERABLES ===");
// A. Stateful Single-Pass Iterator
const statefulIterator = {
  current: 1,
  next() {
    return this.current <= 3
      ? { value: this.current++, done: false }
      : { value: undefined, done: true };
  },
  [Symbol.iterator]() { return this; }
};

console.log("First spread:", [...statefulIterator]); // [1, 2, 3]
console.log("Second spread (Exhausted):", [...statefulIterator]); // []

// B. Reusable Iterable (Allocates fresh iterator on every consumption)
const restartableCollection = {
  items: [10, 20, 30],
  [Symbol.iterator]() {
    let index = 0;
    const items = this.items;
    return {
      next() {
        return index < items.length
          ? { value: items[index++], done: false }
          : { value: undefined, done: true };
      }
    };
  }
};

console.log("Restartable 1st spread:", [...restartableCollection]); // [10, 20, 30]
console.log("Restartable 2nd spread:", [...restartableCollection]); // [10, 20, 30]

console.log("\n=== 2. PREDICTION 1: YIELDING UNDEFINED AS A VALID VALUE ===");
const undefinedYieldingIterator = {
  step: 0,
  next() {
    if (this.step === 0) {
      this.step++;
      return { value: undefined, done: false }; // Valid item in sequence!
    }
    return { value: "COMPLETED", done: true };
  },
  [Symbol.iterator]() { return this; }
};

const collected = [...undefinedYieldingIterator];
console.log("Collected array length:", collected.length); // 1
console.log("Collected[0]:", collected[0]); // undefined

console.log("\n=== 3. PREDICTION 2: UNICODE SURROGATE PAIRS ===");
const emojiStr = "🚀 Turbo";
console.log("emojiStr.length (Code Units):", emojiStr.length); // 8
console.log("emojiStr[0] (Broken Surrogate):", JSON.stringify(emojiStr[0]));
console.log("[...emojiStr][0] (Unified Code Point):", [...emojiStr][0]); // "🚀"
console.log("[...emojiStr].length (Real Character Count):", [...emojiStr].length); // 7

console.log("\n=== 4. PREDICTION 3: MAP & SET ITERATION ===");
const registry = new Map([
  ["PORT", 8080],
  ["ENV", "PRODUCTION"]
]);

for (const [key, val] of registry) {
  console.log(`Config Entry -> ${key}: ${val}`);
}

console.log("\n=== 5. PREDICTION 4: INFINITE SEQUENCE WITH TAKE(N) ===");
function* infiniteTimestamps() {
  let count = 0;
  while (true) {
    yield `Event_${++count}_${Date.now()}`;
  }
}

function take(iterable, count) {
  const result = [];
  const iterator = iterable[Symbol.iterator]();
  for (let i = 0; i < count; i++) {
    const step = iterator.next();
    if (step.done) break;
    result.push(step.value);
  }
  return result;
}

console.log("Bounded 3 items from infinite sequence:", take(infiniteTimestamps(), 3));

console.log("\n=== 6. PRACTICAL ARCHITECTURE: LAZY PAGINATED FEED ENGINE ===");

class LazyPaginatedFeed {
  constructor(totalRecords, pageSize = 3) {
    this.totalRecords = totalRecords;
    this.pageSize = pageSize;
  }

  [Symbol.iterator]() {
    let offset = 0;
    const total = this.totalRecords;
    const size = this.pageSize;

    return {
      next() {
        if (offset >= total) {
          return { value: undefined, done: true };
        }
        const limit = Math.min(offset + size, total);
        const batch = [];
        for (let i = offset; i < limit; i++) {
          batch.push({ id: `log_${i + 1}`, message: `Telemetry Trace #${i + 1}` });
        }
        offset = limit;
        return { value: batch, done: false };
      }
    };
  }
}

const feed = new LazyPaginatedFeed(7, 3);
const feedIterator = feed[Symbol.iterator]();

console.log("Page 1 Batch:", feedIterator.next().value);
console.log("Page 2 Batch:", feedIterator.next().value);
console.log("Page 3 Batch:", feedIterator.next().value);
console.log("Page 4 (End):", feedIterator.next().done); // true
