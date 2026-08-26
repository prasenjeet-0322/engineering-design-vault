/**
 * KPI 01 — Part 4: Type Coercion, Conversion & JavaScript's Implicit Operations
 * Demonstrates:
 * 1. Multi-Step Coercion Pipeline (Prediction 1)
 * 2. Truthiness & Fallback Bug (Prediction 2)
 * 3. || vs ?? Evaluation Matrix (Prediction 3)
 * 4. Symbol.toPrimitive Custom Protocol Hook
 * 5. Practical Architecture: Boundary Normalizer for Raw Product API
 */

console.log("=== 1. PREDICTION 1: MULTI-STEP COERCION PIPELINE ===");
console.log('10 + "5" + 2: ', 10 + "5" + 2); // "1052"
console.log('10 + 5 + "2": ', 10 + 5 + "2"); // "152"
console.log('"10" - 5 + 2: ', "10" - 5 + 2); // 7
console.log('"10" + 5 - 2: ', "10" + 5 - 2); // 103

console.log("\n=== 2. PREDICTION 2: TRUTHINESS & FALLBACK TRAP ===");
const rawResponse = {
  count: 0,
  isActive: "false",
  name: ""
};

if (rawResponse.count) console.log("Has count"); // ❌ 0 is falsy, does not run!
if (rawResponse.isActive) console.log("⚠️ Product evaluated as Active because Boolean('false') === true!");
const displayName = rawResponse.name || "Anonymous";
console.log("Display Name (empty string fallback):", displayName); // "Anonymous"

console.log("\n=== 3. PREDICTION 3: || VS ?? COMPARISON ===");
const testValues = [0, "", false, null, undefined, NaN];
console.log("Value\t\t|| 'OR'\t\t?? 'NULLISH'");
console.log("--------------------------------------------");
for (const val of testValues) {
  const orResult = val || "OR";
  const nullishResult = val ?? "NULLISH";
  console.log(`${String(val).padEnd(12)}\t${String(orResult).padEnd(12)}\t${String(nullishResult)}`);
}

console.log("\n=== 4. SYMBOL.TOPRIMITIVE PROTOCOL HOOK ===");
const cartItem = {
  name: "Mechanical Keyboard",
  price: 4999,
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.price;
    if (hint === "string") return `${this.name} (₹${this.price})`;
    return this.price; // default hint
  }
};

console.log("Unary Plus (+cartItem):       ", +cartItem); // 4999 (number hint)
console.log("Template Literal (`${cartItem}`):", `${cartItem}`); // "Mechanical Keyboard (₹4999)" (string hint)
console.log("Binary Plus (cartItem + 500): ", cartItem + 500); // 5499 (default hint)

console.log("\n=== 5. PRACTICAL ARCHITECTURE: BOUNDARY NORMALIZATION LAYER ===");

const rawUnsafeProduct = {
  id: "101",
  name: "Wireless Mouse",
  price: "1499",
  stock: "0",
  isAvailable: "false",
  discount: "",
  category: null
};

/**
 * Normalizes and validates raw external payloads.
 * Strictly separates missing values, zeroes, and boolean strings.
 */
function normalizeProductEntity(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("Invalid product payload: expected object");
  }

  // Helper for safe integer parsing with NaN guard
  const parseSafeNumber = (val, fallback = 0) => {
    if (val === "" || val === null || val === undefined) return fallback;
    const parsed = Number(val);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  // Helper for boolean parsing (handles "false" string)
  const parseSafeBoolean = (val, fallback = false) => {
    if (typeof val === "boolean") return val;
    if (val === "true" || val === 1 || val === "1") return true;
    if (val === "false" || val === 0 || val === "0") return false;
    return fallback;
  };

  return {
    id: String(raw.id ?? "anonymous-sku"),
    name: typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : "Unnamed Product",
    price: parseSafeNumber(raw.price, 0),
    stock: parseSafeNumber(raw.stock, 0), // "0" -> 0 (In stock: 0 items)
    isAvailable: parseSafeBoolean(raw.isAvailable, false), // "false" -> false!
    discount: raw.discount === "" ? null : parseSafeNumber(raw.discount, null), // "" -> null (missing, not 0%)
    category: raw.category === null ? null : String(raw.category)
  };
}

const safeDomainProduct = normalizeProductEntity(rawUnsafeProduct);
console.log("Raw Unsafe Product Input:    ", rawUnsafeProduct);
console.log("Clean Normalized Domain Model:", safeDomainProduct);
console.log("Calculated Total (price + 50):", safeDomainProduct.price + 50); // 1549 ✅
console.log("Is Available (boolean):       ", safeDomainProduct.isAvailable); // false ✅
