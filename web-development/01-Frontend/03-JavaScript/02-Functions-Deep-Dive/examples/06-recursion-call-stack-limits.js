/**
 * KPI 02 — Part 6: Recursion, Call Stack & Function Execution Limits
 * Demonstrates:
 * 1. Prediction 1: Stack Growth vs Unwinding
 * 2. Prediction 2: Explicit LIFO Stack Traversal
 * 3. Prediction 3: Recursive Accumulator Tree Sum
 * 4. Prediction 4: Recursive Closures
 * 5. Cycle Protection with Set Data Structures
 * 6. Practical Architecture: Tree Flattener with Cycle & Depth Guards
 */

console.log("=== 1. PREDICTION 1: STACK GROWTH VS UNWINDING ===");
function testUnwinding(n) {
  console.log("Enter:", n);
  if (n === 0) return;
  testUnwinding(n - 1);
  console.log("Exit:", n);
}
testUnwinding(2);

console.log("\n=== 2. PREDICTION 2: EXPLICIT LIFO STACK TRAVERSAL ===");
const treeNode = {
  id: "A",
  children: [
    { id: "B", children: [] },
    { id: "C", children: [] }
  ]
};

const stack = [treeNode];
const visitedIds = [];
while (stack.length > 0) {
  const node = stack.pop();
  visitedIds.push(node.id);
  stack.push(...node.children);
}
console.log("LIFO Stack Pop Order:", visitedIds); // ['A', 'C', 'B']

console.log("\n=== 3. PREDICTION 3: RECURSIVE ACCUMULATOR TREE SUM ===");
function sumTree(node) {
  if (!node.children.length) return node.value;
  return node.value + node.children.reduce((tot, child) => tot + sumTree(child), 0);
}

const numericTree = {
  value: 1,
  children: [
    { value: 2, children: [] },
    {
      value: 3,
      children: [{ value: 4, children: [] }]
    }
  ]
};
console.log("Total Tree Sum:", sumTree(numericTree)); // 10

console.log("\n=== 4. PREDICTION 4: RECURSIVE CLOSURES ===");
function createFunctionHierarchy(n) {
  if (n === 0) return [];
  const current = n;
  return [() => current, ...createFunctionHierarchy(n - 1)];
}
const funcs = createFunctionHierarchy(3);
console.log("Recursive closure results:", funcs.map(fn => fn())); // [3, 2, 1]

console.log("\n=== 5. CYCLE PROTECTION WITH SET ===");
const nodeA = { id: "Node-A", children: [] };
const nodeB = { id: "Node-B", children: [] };
nodeA.children.push(nodeB);
nodeB.children.push(nodeA); // Circular reference!

function traverseSafe(node, visited = new Set()) {
  if (!node || visited.has(node)) {
    console.log(`⚡ Cycle detected at ${node?.id}! Halting branch recursion.`);
    return;
  }
  visited.add(node);
  console.log("Safely visited:", node.id);
  node.children.forEach(child => traverseSafe(child, visited));
}

traverseSafe(nodeA);

console.log("\n=== 6. PRACTICAL ARCHITECTURE: TREE FLATTENER PIPELINE ===");

function flattenTreeForVirtualization(root, expandedSet, maxDepth = 4) {
  const flattened = [];
  const stack = [{ node: root, depth: 0 }];
  const visited = new Set();

  while (stack.length > 0) {
    const { node, depth } = stack.pop();

    if (!node || visited.has(node) || depth > maxDepth) continue;
    visited.add(node);

    flattened.push({
      id: node.id,
      depth,
      hasChildren: Boolean(node.children?.length),
      isExpanded: expandedSet.has(node.id)
    });

    // If expanded, push children in reverse to maintain top-to-bottom order
    if (expandedSet.has(node.id) && node.children?.length) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({ node: node.children[i], depth: depth + 1 });
      }
    }
  }

  return flattened;
}

const deepMenu = {
  id: "electronics",
  children: [
    {
      id: "laptops",
      children: [
        { id: "gaming-laptops", children: [] },
        { id: "ultrabooks", children: [] }
      ]
    },
    { id: "smartphones", children: [] }
  ]
};

const expandedNodes = new Set(["electronics", "laptops"]);
const flatRows = flattenTreeForVirtualization(deepMenu, expandedNodes);
console.log("Flattened Visible Rows for UI Virtualizer:", flatRows);
