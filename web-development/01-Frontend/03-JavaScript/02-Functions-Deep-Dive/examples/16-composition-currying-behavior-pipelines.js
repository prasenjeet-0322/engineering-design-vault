/**
 * KPI 02 — Part 16: Function Composition, Partial Application & Currying
 * Demonstrates:
 * 1. Gotcha: bind() Partial Application vs True Currying
 * 2. Prediction 1: Composition Right-to-Left Evaluation Order
 * 3. Prediction 2: Curried State Retention
 * 4. Prediction 3: Independent Multiplier Configurations
 * 5. Prediction 4: Two-Stage Partial Application Execution
 * 6. Prediction 6: Immutable Pipeline Sorting with toSorted
 * 7. Practical Architecture: Composable E-Commerce Product Filter & Sort Pipeline
 */

console.log("=== 1. GOTCHA: BIND() PARTIAL APPLICATION VS TRUE CURRYING ===");
function add(a, b) {
  return a + b;
}

// A. bind() Partial Application
const addFiveBind = add.bind(null, 5);
console.log("add.bind(null, 5)(10):", addFiveBind(10)); // 15

// B. True Currying
const curriedAdd = (a) => (b) => a + b;
console.log("curriedAdd(5)(10):", curriedAdd(5)(10)); // 15

console.log("\n=== 2. PREDICTION 1: COMPOSE RIGHT-TO-LEFT ORDER ===");
const addTwo = (x) => x + 2;
const multiplyByThree = (x) => x * 3;
const compose = (...fns) => (initial) => fns.reduceRight((val, fn) => fn(val), initial);

const transform = compose(addTwo, multiplyByThree);
console.log("compose(addTwo, multiplyByThree)(4):", transform(4)); // (4 * 3) + 2 = 14

console.log("\n=== 3. PREDICTION 2: CURRIED STATE RETENTION ===");
const createAdder = (a) => (b) => a + b;
const addTen = createAdder(10);
console.log("addTen(5):", addTen(5));   // 15
console.log("addTen(20):", addTen(20)); // 30

console.log("\n=== 4. PREDICTION 3: INDEPENDENT CONFIGURATIONS ===");
const createMultiplier = (m) => (v) => m * v;
const double = createMultiplier(2);
const triple = createMultiplier(3);
console.log("double(5):", double(5)); // 10
console.log("triple(5):", triple(5)); // 15

console.log("\n=== 5. PREDICTION 4: TWO-STAGE PARTIAL APPLICATION ===");
function createGreeting(prefix) {
  return function greet(name) {
    return `${prefix}, ${name}`;
  };
}
const hello = createGreeting("Hello");
console.log("hello('Sunny'):", hello("Sunny")); // "Hello, Sunny"

console.log("\n=== 6. PREDICTION 6: IMMUTABLE SORTING ===");
const items = [{ name: "B", score: 20 }, { name: "A", score: 10 }];
const sortedItems = items.toSorted((a, b) => a.score - b.score);
console.log("Original items untouched:", items[0].name === "B"); // true
console.log("Sorted items:", sortedItems.map(i => i.name));      // ['A', 'B']

console.log("\n=== 7. PRACTICAL ARCHITECTURE: E-COMMERCE PRODUCT PIPELINE ===");

const products = [
  { id: "p1", name: "Wireless Headphones", category: "Audio", price: 150, inStock: true },
  { id: "p2", name: "Mechanical Keyboard", category: "Accessories", price: 120, inStock: false },
  { id: "p3", name: "Gaming Mouse", category: "Accessories", price: 60, inStock: true },
  { id: "p4", name: "Studio Monitor Speakers", category: "Audio", price: 300, inStock: true }
];

// Composable Transformers:
const filterCategory = (cat) => (list) => cat ? list.filter(p => p.category === cat) : list;
const filterInStock = (onlyInStock) => (list) => onlyInStock ? list.filter(p => p.inStock) : list;
const sortPriceAsc = () => (list) => list.toSorted((a, b) => a.price - b.price);

const filterAndSortPipeline = (list, { category, inStockOnly }) => {
  return [
    filterCategory(category),
    filterInStock(inStockOnly),
    sortPriceAsc()
  ].reduce((acc, fn) => fn(acc), list);
};

const audioInStock = filterAndSortPipeline(products, { category: "Audio", inStockOnly: true });
console.log("Filtered & Sorted In-Stock Audio Products:", audioInStock);
