/**
 * KPI 09 — Part 08: Method Chaining & Functional Data Pipelines
 * Demonstrates:
 * 1. Gotcha: Global Sort -> Slice vs Local Slice -> Sort Invariant
 * 2. Gotcha: Property Stripping Before Filter Bug & Fix
 * 3. Prediction 1: Type & Shape Flow Tracking (Raw -> Filtered -> Sorted -> Paginated -> ViewModel)
 * 4. Prediction 2: Invariant Normalization Extracted Outside Loop
 * 5. Practical Architecture: Enterprise Multi-Filter E-Commerce Catalog Pipeline
 */

"use strict";

console.log("=== 1. GOTCHA: GLOBAL SORT -> SLICE VS LOCAL SLICE -> SORT ===");

const rawScores = [10, 50, 20, 40, 30];

// A. Global Top-2 (Correct)
const globalTop2 = rawScores.toSorted((a, b) => b - a).slice(0, 2);
console.log("Global Top-2 (toSorted -> slice):", globalTop2); // [ 50, 40 ]

// B. Local Slice Sort (Buggy - missing 40!)
const localTop2 = rawScores.slice(0, 2).toSorted((a, b) => b - a);
console.log("Local Slice-2 (slice -> toSorted):", localTop2); // [ 50, 10 ]

console.log("\n=== 2. GOTCHA: PROPERTY STRIPPING PRE-FILTER FIX ===");

const rawUsers = [
  { id: 1, name: "Alice", active: true },
  { id: 2, name: "Bob", active: false }
];

// ❌ Buggy: .map() strips `active` before .filter() runs!
const buggyResult = rawUsers
  .map((u) => ({ displayName: u.name.toUpperCase() }))
  .filter((u) => u.active); // u.active is undefined!
console.log("Buggy Result Count (All items lost!):", buggyResult.length); // 0

// ✅ Senior Standard: Filter raw domain data first, then map to ViewModel
const safeResult = rawUsers
  .filter((u) => u.active)
  .map((u) => ({ displayName: u.name.toUpperCase() }));
console.log("Safe Result (Preserved active Alice):", safeResult); // [ { displayName: 'ALICE' } ]

console.log("\n=== 3. PREDICTION 1: TYPE & SHAPE FLOW TRACKING ===");

const orders = [
  { id: "O1", amount: 150, status: "PAID", customer: "Alice" },
  { id: "O2", amount: 50, status: "PENDING", customer: "Bob" },
  { id: "O3", amount: 300, status: "PAID", customer: "Charlie" },
  { id: "O4", amount: 200, status: "PAID", customer: "David" }
];

// Pipeline: Order[] -> Order[] -> Order[] -> Order[] -> OrderViewModel[]
const topPaidOrders = orders
  .filter((o) => o.status === "PAID")              // Order[] (3 items)
  .toSorted((a, b) => b.amount - a.amount)         // Order[] (Sorted desc)
  .slice(0, 2)                                     // Order[] (Top 2)
  .map((o) => ({                                   // OrderViewModel[]
    orderId: o.id,
    customerName: o.customer,
    formattedTotal: `$${o.amount.toFixed(2)}`
  }));

console.log("Top 2 Paid Order ViewModels:");
console.dir(topPaidOrders, { depth: null });

console.log("\n=== 4. PREDICTION 2: INVARIANT NORMALIZATION EXTRACTION ===");

const searchDataset = ["React Handbook", "Vue 3 Mastery", "Angular Architecture", "React Query Patterns"];
const rawSearchQuery = "   REACT   ";

// ✅ Compute invariant once outside the loop:
const normalizedQuery = rawSearchQuery.trim().toLowerCase();
const searchMatches = searchDataset.filter((title) =>
  title.toLowerCase().includes(normalizedQuery)
);
console.log("Query matches for '   REACT   ':", searchMatches);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: E-COMMERCE CATALOG PIPELINE ===");

const catalogProducts = [
  { id: "P1", sku: "KB-01", name: "Mechanical Keyboard RGB", category: "electronics", basePrice: 129.99, inStock: true, rating: 4.8 },
  { id: "P2", sku: "MS-02", name: "Wireless Ergonomic Mouse", category: "electronics", basePrice: 69.99, inStock: false, rating: 4.5 },
  { id: "P3", sku: "CH-03", name: "Executive Mesh Office Chair", category: "furniture", basePrice: 299.00, inStock: true, rating: 4.9 },
  { id: "P4", sku: "DS-04", name: "Motorized Standing Desk", category: "furniture", basePrice: 499.00, inStock: true, rating: 4.7 },
  { id: "P5", sku: "LP-05", name: "Ultra-Thin Gaming Laptop", category: "electronics", basePrice: 1299.00, inStock: true, rating: 4.9 }
];

function selectCatalogPage(products, options) {
  const query = options.searchQuery ? options.searchQuery.trim().toLowerCase() : "";

  // 1. Filter raw domain entities
  const filtered = products.filter((p) => {
    const matchesQuery = !query || p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    const matchesCategory = !options.category || options.category === "ALL" || p.category === options.category;
    const matchesStock = !options.inStockOnly || p.inStock;
    return matchesQuery && matchesCategory && matchesStock;
  });

  const totalMatches = filtered.length;
  const pageSize = options.pageSize || 2;
  const page = options.page || 1;
  const totalPages = Math.ceil(totalMatches / pageSize) || 1;
  const start = (page - 1) * pageSize;

  // 2. Global Sort -> 3. Paginate Slice -> 4. Map to ViewModel
  const items = filtered
    .toSorted((a, b) => {
      if (options.sortBy === "price_asc") return a.basePrice - b.basePrice;
      if (options.sortBy === "price_desc") return b.basePrice - a.basePrice;
      return b.rating - a.rating; // Default rating desc
    })
    .slice(start, start + pageSize)
    .map((p) => ({
      id: p.id,
      title: p.name,
      category: p.category.toUpperCase(),
      priceLabel: `$${p.basePrice.toFixed(2)}`,
      ratingStars: `⭐ ${p.rating.toFixed(1)}`,
      inStock: p.inStock
    }));

  return { items, page, totalPages, totalMatches };
}

const page1Results = selectCatalogPage(catalogProducts, {
  searchQuery: "",
  category: "electronics",
  inStockOnly: true,
  sortBy: "rating_desc",
  page: 1,
  pageSize: 2
});

console.log("Catalog Page 1 Results (Electronics, In Stock, Highest Rated):");
console.dir(page1Results, { depth: null });
