/**
 * KPI 08 — Part 04: yield*, Generator Delegation, return(), throw() & Cleanup
 * Demonstrates:
 * 1. Gotcha: Capturing yield* Sub-Generator Return Value Without Leaking to Spread
 * 2. Prediction 1: Recursive Tree Traversal Using yield*
 * 3. Prediction 2: gen.return() Forcing finally Block Cleanup
 * 4. Prediction 3: gen.throw() Error Injection and Internal Recovery
 * 5. Prediction 4: Error Propagation Across yield* Delegation Chains
 * 6. Practical Architecture: Hierarchical File System Tree Walker with Cleanup
 */

"use strict";

console.log("=== 1. GOTCHA: CAPTURING YIELD* RETURN VALUES ===");
function* subTask() {
  yield "STEP_1";
  yield "STEP_2";
  return "SUBTASK_COMPLETION_PAYLOAD";
}

function* mainOrchestrator() {
  const result = yield* subTask();
  console.log("[Parent] Captured subtask return value:", result);
  yield `FINAL_RESULT_${result}`;
}

const collected = [...mainOrchestrator()];
console.log("Streamed iteration items in array:", collected);
// Notice SUBTASK_COMPLETION_PAYLOAD itself is NOT in array, only yielded elements!

console.log("\n=== 2. PREDICTION 1: RECURSIVE TREE TRAVERSAL WITH YIELD* ===");
const nestedTree = {
  name: "Root",
  children: [
    {
      name: "Src",
      children: [{ name: "index.js", children: [] }, { name: "App.js", children: [] }]
    },
    { name: "package.json", children: [] }
  ]
};

function* walkTree(node) {
  yield node.name;
  for (const child of node.children) {
    yield* walkTree(child);
  }
}

console.log("Flattened tree traversal:", [...walkTree(nestedTree)]);

console.log("\n=== 3. PREDICTION 2: GEN.RETURN() FORCING FINALLY CLEANUP ===");
function* resourceWorkflow() {
  try {
    yield "ACQUIRE_LOCK";
    yield "PROCESS_DATA";
  } finally {
    console.log("[ResourceWorkflow] Finally block executed: Lock released cleanly.");
  }
}

const resGen = resourceWorkflow();
console.log("Step 1:", resGen.next().value); // ACQUIRE_LOCK
console.log("Calling .return('ABORT_SIGNAL')...");
console.log("Return result:", resGen.return("ABORT_SIGNAL")); // { value: "ABORT_SIGNAL", done: true }

console.log("\n=== 4. PREDICTION 3: GEN.THROW() ERROR RECOVERY ===");
function* resilientService() {
  try {
    yield "FETCHING_DATA";
  } catch (err) {
    yield `RECOVERED_FROM_ERROR: ${err.message}`;
  }
  yield "SERVE_FALLBACK_CACHE";
}

const svc = resilientService();
console.log("Step 1:", svc.next().value); // FETCHING_DATA
console.log("Step 2 (Injecting Error):", svc.throw(new Error("GATEWAY_TIMEOUT")).value); // RECOVERED_FROM_ERROR
console.log("Step 3:", svc.next().value); // SERVE_FALLBACK_CACHE

console.log("\n=== 5. PREDICTION 4: ERROR PROPAGATION ACROSS YIELD* ===");
function* faultySub() {
  yield "SUB_START";
  throw new Error("DATABASE_CONNECTION_REFUSED");
}

function* parentGuardian() {
  try {
    yield* faultySub();
  } catch (err) {
    yield `PARENT_INTERCEPTED: ${err.message}`;
  }
}

console.log("Parent guardian results:", [...parentGuardian()]);

console.log("\n=== 6. PRACTICAL ARCHITECTURE: FILE SYSTEM WALKER SAGA ===");

function* exploreDirectory(dirNode) {
  let fileCount = 0;
  try {
    if (dirNode.type === "file") {
      yield `[FILE]: ${dirNode.name}`;
      fileCount++;
    } else {
      yield `[DIR]: ${dirNode.name}`;
      for (const child of dirNode.children || []) {
        fileCount += yield* exploreDirectory(child);
      }
    }
    return fileCount;
  } finally {
    console.log(`[FileSystemWalker] Completed node: ${dirNode.name}`);
  }
}

const demoFS = {
  name: "project-root",
  type: "directory",
  children: [
    { name: "README.md", type: "file" },
    {
      name: "src",
      type: "directory",
      children: [
        { name: "index.ts", type: "file" },
        { name: "utils.ts", type: "file" }
      ]
    }
  ]
};

const walker = exploreDirectory(demoFS);
let step = walker.next();
while (!step.done) {
  console.log(step.value);
  step = walker.next();
}
console.log("Total files counted (Return value):", step.value);
