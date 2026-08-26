/**
 * KPI 04 — Part 11: Recursion, Recursive Call Frames & Stack Overflow
 * Demonstrates:
 * 1. Gotcha: Call Stack Growth vs Unwinding
 * 2. Prediction 1: Call Stack Unwinding Order (start / base / end)
 * 3. Prediction 2: Separate Local Activation State per Invocation
 * 4. Prediction 3: Indirect (Mutual) Recursion Cycles
 * 5. Prediction 4: Trampoline Execution Avoiding Stack Overflow
 * 6. Practical Architecture: Heap-Backed Explicit Stack Traversal with Depth Guards
 */

console.log("=== 1. PREDICTION 1: CALL STACK UNWINDING ORDER ===");
function traceUnwind(n) {
  console.log("start:", n);
  if (n === 0) {
    console.log("base case reached");
    return;
  }
  traceUnwind(n - 1);
  console.log("end:", n);
}
traceUnwind(2);

console.log("\n=== 2. PREDICTION 2: SEPARATE LOCAL BINDINGS PER INVOCATION ===");
function localScopeTest(n) {
  const value = n * 10;
  if (n === 0) {
    console.log("Base frame value:", value);
    return;
  }
  localScopeTest(n - 1);
  console.log("Unwound frame value:", value);
}
localScopeTest(2);

console.log("\n=== 3. PREDICTION 3: INDIRECT (MUTUAL) RECURSION ===");
function alpha(n) {
  console.log("alpha:", n);
  if (n <= 0) return;
  beta(n - 1);
}
function beta(n) {
  console.log("beta:", n);
  if (n <= 0) return;
  alpha(n - 2);
}
alpha(4);

console.log("\n=== 4. PREDICTION 4: TRAMPOLINING FOR DEEP RECURSION ===");
function trampoline(fn) {
  return function(...args) {
    let result = fn(...args);
    while (typeof result === 'function') {
      result = result(); // Execute thunk iteratively on single stack frame
    }
    return result;
  };
}

// Trampolined factorial calculates 10,000 recursive steps without stack overflow
const safeSum = trampoline(function sumStep(n, acc = 0) {
  return n === 0 ? acc : () => sumStep(n - 1, acc + n);
});

console.log("Trampoline sum(100):", safeSum(100)); // 5050
console.log("Trampoline deep sum(5000):", safeSum(5000)); // 12502500

console.log("\n=== 5. PRACTICAL ARCHITECTURE: HEAP-BACKED EXPLICIT STACK ===");

// Nested Tree Structure with 4 levels of depth
const sampleCategoryTree = {
  id: "cat_1",
  name: "Electronics",
  children: [
    {
      id: "cat_2",
      name: "Computers",
      children: [
        {
          id: "cat_3",
          name: "Laptops",
          children: [
            { id: "cat_4", name: "Gaming Laptops" },
            { id: "cat_5", name: "Ultrabooks" }
          ]
        }
      ]
    },
    {
      id: "cat_6",
      name: "Smartphones"
    }
  ]
};

/**
 * Enterprise Safe Tree Flattener using Explicit Heap Stack
 * Protects against Stack Overflow and supports depth constraints
 */
function flattenTreeSafe(root, maxDepth = 20) {
  const result = [];
  const stack = [{ node: root, depth: 0 }];

  while (stack.length > 0) {
    const { node, depth } = stack.pop();

    if (!node || depth > maxDepth) {
      if (depth > maxDepth) console.warn(`[Depth Guard Triggered] Skipped node at depth ${depth}`);
      continue;
    }

    result.push({ id: node.id, name: node.name, depth });

    if (Array.isArray(node.children)) {
      // Push children in reverse so left-to-right order is preserved on pop
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({ node: node.children[i], depth: depth + 1 });
      }
    }
  }

  return result;
}

const flattened = flattenTreeSafe(sampleCategoryTree);
console.log("Flattened Tree Node Count:", flattened.length);
flattened.forEach(item => {
  console.log(`${"  ".repeat(item.depth)}• [${item.id}] ${item.name}`);
});
