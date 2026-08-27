/**
 * KPI 02 — Part 11: Recursion, Call Stack Limits & Architecture
 * Demonstrates:
 * 1. Gotcha: Stack Overflow with Logical Base Case
 * 2. Prediction 1: Stack Growth vs Unwinding Log Order
 * 3. Prediction 2: Cycle Detection in Object Graphs with Set
 * 4. Prediction 3: Recursive Closures & Shared Lexical State
 * 5. Prediction 4: DFS Traversal Order
 * 6. Practical Architecture: Iterative Tree Flattener with Expansion & Depth Guards
 */

console.log("=== 1. PREDICTION 1: STACK GROWTH VS UNWINDING ===");
function countUpDown(n) {
  if (n === 0) {
    console.log("done");
    return;
  }
  console.log("before", n);
  countUpDown(n - 1);
  console.log("after", n);
}
countUpDown(3);

console.log("\n=== 2. PREDICTION 2: CYCLE DETECTION WITH SET ===");
const nodeA = { id: "A" };
const nodeB = { id: "B" };
nodeA.next = nodeB;
nodeB.next = nodeA; // Circular Graph!

function walkSafe(node, visited = new Set()) {
  if (!node || visited.has(node)) {
    console.log(`⚡ Circular loop detected at Node '${node?.id}'! Halting traversal.`);
    return;
  }
  visited.add(node);
  console.log("Visited Node:", node.id);
  if (node.next) {
    walkSafe(node.next, visited);
  }
}
walkSafe(nodeA);

console.log("\n=== 3. PREDICTION 3: RECURSIVE CLOSURE SHARED STATE ===");
function createRecursiveCounter() {
  let count = 0; // Shared Lexical Context
  function increment(n) {
    if (n === 0) return count;
    count++;
    return increment(n - 1);
  }
  return increment;
}

const counter = createRecursiveCounter();
console.log("counter(3):", counter(3)); // 3
console.log("counter(2):", counter(2)); // 5

console.log("\n=== 4. PREDICTION 4: DFS TRAVERSAL ORDER ===");
const tree = {
  value: "A",
  children: [
    {
      value: "B",
      children: [{ value: "D", children: [] }]
    },
    { value: "C", children: [] }
  ]
};

const visitedDFS = [];
function visitDFS(node) {
  visitedDFS.push(node.value);
  for (const child of node.children) {
    visitDFS(child);
  }
}
visitDFS(tree);
console.log("DFS Visit Order:", visitedDFS); // ['A', 'B', 'D', 'C']

console.log("\n=== 5. PRACTICAL ARCHITECTURE: ITERATIVE TREE FLATTENER ===");

function flattenTreeForVirtualization(root, expandedSet, maxDepth = 10) {
  const visibleRows = [];
  const stack = [{ node: root, depth: 0 }];
  const visited = new Set();

  while (stack.length > 0) {
    const { node, depth } = stack.pop();
    if (!node || visited.has(node.id) || depth > maxDepth) continue;
    visited.add(node.id);

    const hasChildren = Boolean(node.children?.length);
    const isExpanded = expandedSet.has(node.id);

    visibleRows.push({
      id: node.id,
      name: node.name,
      depth,
      hasChildren,
      isExpanded
    });

    if (isExpanded && hasChildren) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({ node: node.children[i], depth: depth + 1 });
      }
    }
  }

  return visibleRows;
}

const fileSystem = {
  id: "root",
  name: "src",
  children: [
    {
      id: "components",
      name: "components",
      children: [
        { id: "button", name: "Button.tsx", children: [] },
        { id: "modal", name: "Modal.tsx", children: [] }
      ]
    },
    { id: "app", name: "App.tsx", children: [] }
  ]
};

const expandedFolders = new Set(["root", "components"]);
const flattenedList = flattenTreeForVirtualization(fileSystem, expandedFolders);
console.log("Flattened Visible Rows for UI Virtualizer:", flattenedList);
