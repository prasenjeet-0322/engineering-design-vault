/**
 * KPI 09 — Part 07: flat() & flatMap() — Nested Data & Structural Transformations
 * Demonstrates:
 * 1. Gotcha: flat() on Object Properties Myth vs flatMap()
 * 2. Gotcha: Parent Context Loss During 1-to-Many Unrolling
 * 3. Prediction 1: Default Depth 1 vs Depth 2 in flat()
 * 4. Prediction 2: flatMap() Dimensional Expansion (0, 1, or Multiple Outputs)
 * 5. Prediction 3: Recursive Hierarchical Tree Normalizer
 * 6. Practical Architecture: Enterprise Multi-Project Task Kanban & Global Search Index
 */

"use strict";

console.log("=== 1. GOTCHA: OBJECT PROPERTY FLATTENING MYTH ===");
const userSkillList = [
  { name: "Sunny", skills: ["React", "Next.js"] },
  { name: "Alex", skills: ["Node.js", "PostgreSQL"] }
];

// ❌ Myth: flat() does not unpack inner object arrays!
const buggyFlat = userSkillList.flat();
console.log("flat() on objects length (Unchanged!):", buggyFlat.length); // 2

// ✅ Senior Standard: flatMap() extracts and unwraps inner properties
const flatSkills = userSkillList.flatMap((u) => u.skills);
console.log("flatMap() extracted skills:", flatSkills); // [ 'React', 'Next.js', 'Node.js', 'PostgreSQL' ]

console.log("\n=== 2. GOTCHA: PARENT CONTEXT PRESERVATION ===");
const projects = [
  { id: "PRJ-1", name: "Auth Service", tasks: [{ id: "T1", title: "OAuth" }] },
  { id: "PRJ-2", name: "Billing API", tasks: [{ id: "T2", title: "Stripe" }] }
];

// ❌ Buggy: Lost project context
const lostContextTasks = projects.flatMap((p) => p.tasks);
console.log("Lost context task 0 (Missing projectId):", lostContextTasks[0]); // { id: 'T1', title: 'OAuth' }

// ✅ Senior Standard: Injected parent context during projection
const normalizedTasks = projects.flatMap((p) =>
  p.tasks.map((t) => ({ ...t, projectId: p.id, projectName: p.name }))
);
console.log("Context-aware task 0 (Preserved projectId):", normalizedTasks[0]);

console.log("\n=== 3. PREDICTION 1: DEFAULT DEPTH 1 VS DEPTH 2 IN FLAT() ===");
const deeplyNested = [1, [2, [3, [4]]]];
console.log("flat() (Depth 1):", deeplyNested.flat()); // [ 1, 2, [ 3, [ 4 ] ] ]
console.log("flat(2) (Depth 2):", deeplyNested.flat(2)); // [ 1, 2, 3, [ 4 ] ]
console.log("flat(Infinity):", deeplyNested.flat(Infinity)); // [ 1, 2, 3, 4 ]

console.log("\n=== 4. PREDICTION 2: 1-TO-MANY & 1-TO-0 WITH FLATMAP() ===");
const numbers = [1, 2, 3, 4, 5];
const transformed = numbers.flatMap((n) => {
  if (n % 2 === 0) return [n, n * 10]; // 1-to-many
  if (n === 5) return [5];             // 1-to-1
  return [];                           // 1-to-0 (Pruned)
});
console.log("flatMap 0/1/M Expansion Result:", transformed); // [ 2, 20, 4, 40, 5 ]

console.log("\n=== 5. PREDICTION 3: RECURSIVE TREE WALKER ===");
const categoryTree = [
  {
    id: "CAT-1",
    name: "Electronics",
    children: [
      { id: "CAT-10", name: "Computers", children: [{ id: "CAT-101", name: "Laptops" }] },
      { id: "CAT-20", name: "Audio", children: [] }
    ]
  }
];

function flattenCategoryHierarchy(nodes, parentId = null) {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, parentId },
    ...flattenCategoryHierarchy(node.children ?? [], node.id)
  ]);
}

const flatCategories = flattenCategoryHierarchy(categoryTree);
console.log("Flattened Normalized Categories Table:");
console.dir(flatCategories, { depth: null });

console.log("\n=== 6. PRACTICAL ARCHITECTURE: COMMAND PALETTE SEARCH ENGINE ===");
const navigationSections = [
  {
    section: "Settings",
    items: [
      { label: "Profile Settings", path: "/settings/profile" },
      { label: "Security & 2FA", path: "/settings/security" }
    ]
  },
  {
    section: "Billing",
    items: [
      { label: "Invoices & Receipts", path: "/billing/invoices" },
      { label: "Payment Methods", path: "/billing/cards" }
    ]
  }
];

const globalCommandIndex = navigationSections.flatMap((sec) =>
  sec.items.map((item) => ({
    ...item,
    section: sec.section,
    searchTokens: `${sec.section} ${item.label}`.toLowerCase().split(/\s+/)
  }))
);

function searchCommandPalette(index, query) {
  const q = query.trim().toLowerCase();
  if (!q) return index;
  return index.filter((cmd) => cmd.searchTokens.some((token) => token.includes(q)));
}

console.log("Search query 'security':", searchCommandPalette(globalCommandIndex, "security"));
console.log("Search query 'billing':", searchCommandPalette(globalCommandIndex, "billing").map(c => c.label));
