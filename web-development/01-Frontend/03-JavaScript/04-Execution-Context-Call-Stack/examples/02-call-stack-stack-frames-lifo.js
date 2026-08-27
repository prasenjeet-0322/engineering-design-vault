/**
 * KPI 04 — Part 02: Call Stack & Stack Frames — How JavaScript Tracks Synchronous Execution
 * Demonstrates:
 * 1. Gotcha: Call Stack LIFO vs Static Lexical Scope Chain
 * 2. Prediction 1: Nested Function Call Stack Push/Pop Order
 * 3. Prediction 2 & 4: Exception Throwing & Stack Unwinding
 * 4. Prediction 3: Recursive Execution & Base Case Unwinding
 * 5. Prediction 5: Synchronous Call Stack Blocking vs Task Queues
 * 6. Practical Architecture: Enterprise Iterative Tree Flattener (Zero Stack Overflow)
 */

console.log("=== 1. GOTCHA: CALL STACK VS LEXICAL SCOPE ===");
const globalVal = "global_lexical";

function printLexicalVal() {
  return globalVal; // Resolves statically via [[Environment]]
}

function callerFrame() {
  const globalVal = "caller_frame_val";
  return printLexicalVal();
}

console.log("printLexicalVal() output:", callerFrame()); // "global_lexical"

console.log("\n=== 2. PREDICTION 1: NESTED CALL STACK PUSH/POP ORDER ===");
const callTrace = [];
function stepA() {
  callTrace.push("A:start");
  stepB();
  callTrace.push("A:end");
}
function stepB() {
  callTrace.push("B:start");
  stepC();
  callTrace.push("B:end");
}
function stepC() {
  callTrace.push("C:exec");
}
stepA();
console.log("Call Trace:", callTrace); // ["A:start", "B:start", "C:exec", "B:end", "A:end"]

console.log("\n=== 3. PREDICTION 2 & 4: ERROR THROWING & STACK UNWINDING ===");
const unwindTrace = [];
function errorOrigin() {
  unwindTrace.push("origin:start");
  throw new Error("Deliberate Stack Unwind Trigger");
  unwindTrace.push("origin:end"); // Never reached
}
function intermediateCaller() {
  unwindTrace.push("intermediate:start");
  errorOrigin();
  unwindTrace.push("intermediate:end"); // Never reached
}
try {
  intermediateCaller();
} catch (err) {
  unwindTrace.push(`caught: ${err.message}`);
}
console.log("Unwind Trace:", unwindTrace);

console.log("\n=== 4. PREDICTION 3: RECURSIVE BASE CASES & UNWINDING ===");
const recursionLog = [];
function recursiveCount(n) {
  if (n === 0) {
    recursionLog.push("Base Case Reached (n=0)");
    return;
  }
  recursionLog.push(`Push Frame n=${n}`);
  recursiveCount(n - 1);
  recursionLog.push(`Unwinding Frame n=${n}`);
}
recursiveCount(3);
console.log("Recursion Log:\n" + recursionLog.join(" -> "));

console.log("\n=== 5. PRACTICAL ARCHITECTURE: ITERATIVE TREE FLATTENER ===");

// Nested hierarchical structure with potential deep nesting
const organizationTree = {
  id: "dept_01",
  name: "Engineering",
  children: [
    {
      id: "dept_02",
      name: "Frontend Core",
      children: [
        { id: "dept_04", name: "UI Frameworks", children: [] },
        { id: "dept_05", name: "Build Infrastructure", children: [] }
      ]
    },
    {
      id: "dept_03",
      name: "Backend Infrastructure",
      children: [
        { id: "dept_06", name: "Database Systems", children: [] }
      ]
    }
  ]
};

// Safe iterative tree flattener using an application-level heap array stack
function flattenTreeIterative(root) {
  if (!root) return [];
  const results = [];
  const stack = [{ node: root, depth: 0 }];

  while (stack.length > 0) {
    const current = stack.pop();
    results.push({ id: current.node.id, name: current.node.name, depth: current.depth });

    if (current.node.children && current.node.children.length > 0) {
      for (let i = current.node.children.length - 1; i >= 0; i--) {
        stack.push({ node: current.node.children[i], depth: current.depth + 1 });
      }
    }
  }
  return results;
}

const flattened = flattenTreeIterative(organizationTree);
console.log("Iteratively Flattened Tree Nodes Count:", flattened.length);
flattened.forEach(item => {
  console.log(`${"  ".repeat(item.depth)}• ${item.name} (${item.id})`);
});
