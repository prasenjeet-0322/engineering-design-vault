/**
 * KPI 09 — Part 01: Array Mental Model, Iteration, Mutation & forEach()
 * Demonstrates:
 * 1. Gotcha: Asynchronous forEach Trap vs Sequential for...of & Promise.all
 * 2. Prediction 1: Shallow Copy Reference Mutation Trap
 * 3. Prediction 2: forEach() Return Contract (undefined)
 * 4. Prediction 3: Sparse Array Hole Skipping
 * 5. Prediction 4: Encapsulated Local Mutation Purity
 * 6. Practical Architecture: Immutable Collection State Manager
 */

"use strict";

console.log("=== 1. GOTCHA: ASYNCHRONOUS forEach TRAP ===");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runAsyncComparison() {
  const users = [{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }];

  console.log("--- A. Broken async forEach (Does not wait!) ---");
  const startForEach = Date.now();
  users.forEach(async (user) => {
    await sleep(20);
    // Runs in microtask queue independently
  });
  console.log(`forEach completed synchronously in: ${Date.now() - startForEach}ms (Items still pending!)`);

  console.log("--- B. Correct Sequential for...of ---");
  const startForOf = Date.now();
  for (const user of users) {
    await sleep(20);
  }
  console.log(`for...of completed sequentially in: ${Date.now() - startForOf}ms`);

  console.log("--- C. Correct Concurrent Promise.all ---");
  const startPromiseAll = Date.now();
  await Promise.all(users.map(async () => {
    await sleep(20);
  }));
  console.log(`Promise.all completed concurrently in: ${Date.now() - startPromiseAll}ms`);
}

runAsyncComparison().then(() => {
  console.log("\n=== 2. PREDICTION 1: SHALLOW COPY REFERENCE MUTATION ===");
  const original = [{ sku: "A1", details: { count: 10 } }];
  const copy = [...original];

  copy[0].details.count = 25; // Mutates shared reference!

  console.log("Original details.count (Mutated!):", original[0].details.count); // 25
  console.log("Arrays equal?:", original === copy); // false
  console.log("Objects equal?:", original[0] === copy[0]); // true

  console.log("\n=== 3. PREDICTION 2: forEach RETURN VALUE ===");
  const numbers = [10, 20, 30];
  const forEachResult = numbers.forEach(n => n * 2);
  console.log("Result of forEach:", forEachResult); // undefined

  console.log("\n=== 4. PREDICTION 3: SPARSE ARRAY HOLE SKIPPING ===");
  const sparse = [1, , 3]; // Hole at index 1
  let forEachVisits = 0;
  let forOfVisits = 0;

  sparse.forEach(() => forEachVisits++);
  for (const _ of sparse) forOfVisits++;

  console.log("forEach Visits (Skips holes):", forEachVisits); // 2
  console.log("for...of Visits (Reads hole as undefined):", forOfVisits); // 3

  console.log("\n=== 5. PREDICTION 4: ENCAPSULATED LOCAL MUTATION ===");
  function buildIndex(records) {
    const index = {}; // Private encapsulated object
    for (let i = 0; i < records.length; i++) {
      index[records[i].id] = records[i].value;
    }
    return index;
  }

  const rawData = [{ id: "u1", value: "Admin" }, { id: "u2", value: "Editor" }];
  const builtIndex = buildIndex(rawData);

  console.log("Built Index:", builtIndex);
  console.log("Original records untouched?:", rawData[0].value === "Admin"); // true

  console.log("\n=== 6. PRACTICAL ARCHITECTURE: IMMUTABLE COLLECTION MANAGER ===");
  const initialTodos = [
    { id: "T1", title: "Review PR", completed: false },
    { id: "T2", title: "Deploy Microservice", completed: false }
  ];

  // Pure state updater preserving structural sharing
  function toggleTodo(todos, targetId) {
    return todos.map(todo =>
      todo.id === targetId
        ? { ...todo, completed: !todo.completed }
        : todo // Structural sharing
    );
  }

  const updatedTodos = toggleTodo(initialTodos, "T1");

  console.log("Initial Todo 1 completed?:", initialTodos[0].completed); // false
  console.log("Updated Todo 1 completed?:", updatedTodos[0].completed); // true
  console.log("Untouched Todo 2 reference preserved?:", initialTodos[1] === updatedTodos[1]); // true
});
