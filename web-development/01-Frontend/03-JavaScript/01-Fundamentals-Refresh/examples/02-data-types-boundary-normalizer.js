/**
 * KPI 01 — Part 2: Data Types & Type Behavior Code Examples
 * Demonstrates:
 * 1. Type Inspection & Quirks (typeof null, typeof NaN, Array.isArray)
 * 2. Floating-Point Arithmetic Realities
 * 3. Prediction Challenge 2: API Boundary String Concatenation Failure
 * 4. Production-Grade Runtime API Boundary Normalizer
 */

console.log("=== 1. TYPE INSPECTION & QUIRKS ===");
console.log("typeof 'Sunny':    ", typeof "Sunny");      // "string"
console.log("typeof 42:         ", typeof 42);           // "number"
console.log("typeof true:       ", typeof true);         // "boolean"
console.log("typeof undefined:  ", typeof undefined);    // "undefined"
console.log("typeof null:       ", typeof null);         // "object" ⚠️ Historical bug!
console.log("typeof []:         ", typeof []);           // "object" ⚠️
console.log("Array.isArray([]): ", Array.isArray([]));   // true ✅
console.log("typeof NaN:        ", typeof NaN);          // "number" ⚠️
console.log("NaN === NaN:       ", NaN === NaN);         // false
console.log("Number.isNaN(NaN): ", Number.isNaN(NaN));   // true

console.log("\n=== 2. FLOATING POINT ARITHMETIC ===");
const sum = 0.1 + 0.2;
console.log("0.1 + 0.2 = ", sum);
console.log("Is 0.1 + 0.2 strictly equal to 0.3? ", sum === 0.3); // false!

// Financial Safe Integer Minor Unit Pattern:
const priceInPaise = 1050; // ₹10.50
const taxInPaise = 189;    // ₹1.89
const totalInPaise = priceInPaise + taxInPaise;
console.log("Total in Rupees: ₹" + (totalInPaise / 100).toFixed(2)); // ₹12.39 (Precise!)

console.log("\n=== 3. PREDICTION CHALLENGE 2: API BOUNDARY TRAP ===");
const rawApiResponse = {
  price: "100",
  discount: null,
  active: "false"
};

// ❌ Trap: String concatenation instead of numeric addition
const brokenTotal = rawApiResponse.price + 20;
console.log("Broken Total ('100' + 20):", brokenTotal); // "10020"

// ❌ Trap: "false" string is truthy
if (rawApiResponse.active) {
  console.log("⚠️ Product incorrectly evaluated as ACTIVE because Boolean('false') === true!");
}

console.log("\n=== 4. RUNTIME API BOUNDARY NORMALIZER ===");

/**
 * Enterprise API Normalization Layer
 * Converts messy, untrusted API types into clean, guaranteed domain models.
 */
function normalizeProductPayload(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("Malformed API response: expected JSON object");
  }

  return {
    id: String(raw.id ?? "anonymous-sku"),
    // Coerce strings safely, guard against NaN
    price: typeof raw.price === "number" && !Number.isNaN(raw.price)
      ? raw.price
      : Number(raw.price) || 0,
    // Explicitly parse boolean strings vs actual booleans
    isActive: typeof raw.active === "boolean"
      ? raw.active
      : raw.active === "true" || raw.active === 1
  };
}

const safeProduct = normalizeProductPayload(rawApiResponse);
const safeTotal = safeProduct.price + 20;

console.log("Normalized Safe Product:", safeProduct);
console.log("Correct Calculated Total:", safeTotal); // 120 ✅
console.log("Is Product Active?", safeProduct.isActive); // false ✅
