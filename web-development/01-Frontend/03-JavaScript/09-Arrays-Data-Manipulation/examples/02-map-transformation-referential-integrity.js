/**
 * KPI 09 — Part 02: map() — Transformation, Referential Integrity & Data Mapping
 * Demonstrates:
 * 1. Gotcha: parseInt in map Radix Coercion Bug & Unary Arrow Solutions
 * 2. Prediction 1: Block Body Return Trap (Missing return statement)
 * 3. Prediction 2: Object Literal Parentheses Disambiguation
 * 4. Prediction 3: Structural Sharing Reference Preservation
 * 5. Practical Architecture: Multi-Layer API DTO -> ViewModel Normalization Pipeline
 */

"use strict";

console.log("=== 1. GOTCHA: PARSEINT IN MAP RADIX COERCION ===");
const rawStrings = ["10", "10", "10", "10"];

// ❌ Buggy direct call (parseInt receives index as radix!)
const buggyParsed = rawStrings.map(parseInt);
console.log("Buggy map(parseInt):", buggyParsed); // [ 10, NaN, 2, 3 ]

// ✅ Safe unary arrow function
const safeParsed1 = rawStrings.map((str) => parseInt(str, 10));
console.log("Safe map(str => parseInt(str, 10)):", safeParsed1); // [ 10, 10, 10, 10 ]

// ✅ Safe Number constructor
const safeParsed2 = rawStrings.map(Number);
console.log("Safe map(Number):", safeParsed2); // [ 10, 10, 10, 10 ]

console.log("\n=== 2. PREDICTION 1: BLOCK BODY RETURN TRAP ===");
const users = [{ name: "Sunny" }, { name: "Alex" }];
const brokenNames = users.map((u) => { u.name; }); // Missing return!
const correctNames = users.map((u) => u.name);

console.log("Broken Names (Block body without return):", brokenNames); // [ undefined, undefined ]
console.log("Correct Names (Expression body):", correctNames); // [ 'Sunny', 'Alex' ]

console.log("\n=== 3. PREDICTION 2: OBJECT LITERAL PARENTHESES RULE ===");
const tags = ["frontend", "react"];
const brokenTags = tags.map((tag) => { tag }); // Interpreted as code block
const correctTags = tags.map((tag) => ({ tag })); // Wrapped in parentheses

console.log("Broken Tags:", brokenTags); // [ undefined, undefined ]
console.log("Correct Tags:", correctTags); // [ { tag: 'frontend' }, { tag: 'react' } ]

console.log("\n=== 4. PREDICTION 3: STRUCTURAL SHARING PRESERVATION ===");
const catalog = [
  { id: "P1", title: "Monitor", price: 400 },
  { id: "P2", title: "Keyboard", price: 100 },
  { id: "P3", title: "Mouse", price: 50 }
];

// Update only P2:
const updatedCatalog = catalog.map((item) =>
  item.id === "P2" ? { ...item, price: 120 } : item
);

console.log("Catalog array references identical?:", catalog === updatedCatalog); // false
console.log("Item P1 (Untouched) reference preserved?:", catalog[0] === updatedCatalog[0]); // true (Structural Sharing!)
console.log("Item P2 (Updated) cloned?:", catalog[1] === updatedCatalog[1]); // false (New Object)
console.log("Item P3 (Untouched) reference preserved?:", catalog[2] === updatedCatalog[2]); // true (Structural Sharing!)

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-LAYER DATA PIPELINE ===");

// 1. Raw External DTO from API
const rawApiProducts = [
  { product_id: "PROD_99", title: "  Wireless Noise-Cancelling Headphones  ", price_cents: 29999, is_in_stock: true },
  { product_id: "PROD_100", title: "USB-C Hub Multiport Adapter", price_cents: 4999, is_in_stock: false }
];

// 2. Pure Normalization Transform
function mapDtoToViewModel(dto) {
  return {
    id: dto.product_id,
    name: dto.title.trim(),
    formattedPrice: `$${(dto.price_cents / 100).toFixed(2)}`,
    inStock: dto.is_in_stock,
    badgeText: dto.is_in_stock ? "AVAILABLE" : "OUT OF STOCK"
  };
}

// 3. Application ViewModel Collection
const productViewModels = rawApiProducts.map(mapDtoToViewModel);

console.log("Transformed UI ViewModels:");
console.dir(productViewModels, { depth: null });
