/**
 * KPI 01 — Part 7: Operators, Control Flow & Short-Circuiting
 * Demonstrates:
 * 1. Prediction 1: || vs ?? Truthiness vs Nullishness
 * 2. Prediction 2: && Operand Return Values & Short-Circuiting
 * 3. Prediction 3: Optional Chaining Boundary Protections
 * 4. Prediction 5: Increment Evaluation Order
 * 5. Logical Assignment Operators (??=, ||=, &&=)
 * 6. Practical Architecture: Defensive Product Normalizer Pipeline
 */

console.log("=== 1. PREDICTION 1: || VS ?? ===");
console.log("0 || 100: ", 0 || 100); // 100 (0 is falsy)
console.log("0 ?? 100: ", 0 ?? 100); // 0 (0 is not null/undefined!)

console.log("\n=== 2. PREDICTION 2: && OPERAND RETURN VALUES ===");
console.log('"hello" && 0 && "world":', "hello" && 0 && "world"); // 0
console.log('"hello" && "world":     ', "hello" && "world"); // "world"

console.log("\n=== 3. PREDICTION 3: OPTIONAL CHAINING BOUNDARY ===");
const user = { profile: null };

console.log("user?.profile?.name: ", user?.profile?.name); // undefined ✅

try {
  // @ts-ignore
  console.log("user?.profile.name:  ", user?.profile.name);
} catch (err) {
  console.log("user?.profile.name threw:", err.message); // TypeError: Cannot read properties of null
}

console.log("\n=== 4. PREDICTION 5: INCREMENT EVALUATION ORDER ===");
let count = 1;
const result = count++ + ++count;
console.log("count: ", count);  // 3
console.log("result:", result); // 4 (1 + 3)

console.log("\n=== 5. LOGICAL ASSIGNMENT OPERATORS ===");
const config = { theme: null, port: 0, title: "" };

config.theme ??= "dark"; // theme was null -> assigned "dark"
config.port ??= 3000;    // port was 0 -> preserved 0!
config.title ||= "App";  // title was "" (falsy) -> assigned "App"

console.log("Updated config:", config); // { theme: 'dark', port: 0, title: 'App' }

console.log("\n=== 6. PRACTICAL ARCHITECTURE: DEFENSIVE PRODUCT PIPELINE ===");

const rawProducts = [
  { name: "Free Tier Starter", price: 0, stock: 50 },
  { name: "Pro Plan", price: 2999, stock: 0 },
  { name: null, price: null, stock: null }
];

function normalizeProductCard(raw) {
  const displayName = raw?.name?.trim() || "Unnamed Product";
  const price = raw?.price ?? 0;
  const isAvailable = (raw?.stock ?? 0) > 0;

  return {
    displayName,
    priceFormatted: price === 0 ? "FREE" : `₹${price}`,
    isAvailable,
    buttonText: isAvailable ? "Add to Cart" : "Out of Stock"
  };
}

rawProducts.forEach((p, i) => {
  console.log(`Product ${i + 1}:`, normalizeProductCard(p));
});
