/**
 * KPI 1 — Part 2: The TypeScript Type System
 * 
 * Executable Code Demonstrations:
 * 1. Gotcha 1: Excess Property Checking (Fresh Literal vs Non-Fresh Reference)
 * 2. Gotcha 2: Semantic Collision Hazard vs Type Branding Solution
 * 3. Non-Destructive Widening: Static View vs Runtime Memory / JSON Serialization
 * 4. Structural Function Subtyping (Parameter Discarding in Callbacks)
 * 5. Type Assertion (`as`) vs Runtime Conversion (`Number()`)
 */

console.log("=== 1. GOTCHA 1: EXCESS PROPERTY CHECKING (EPC) ===");

type ButtonConfig = {
  label: string;
  disabled?: boolean;
};

function renderButton(config: ButtonConfig) {
  console.log(`Rendering button [${config.label}] - Disabled: ${config.disabled ?? false}`);
}

// 1. Non-fresh reference: Structural subtyping permits extra properties:
const rawConfig = {
  label: "Submit Payment",
  disabled: true,
  analyticsTag: "btn_checkout_01" // Extra property
};

renderButton(rawConfig); // ✅ Compiles & executes cleanly!

// 2. Note: Passing `{ label: "Submit", analyticsTag: "btn_01" }` directly inline as a fresh literal
// would trigger TS2353 at compile time to protect against misspelled properties.


console.log("\n=== 2. GOTCHA 2: PRIMITIVE OBSESSION VS TYPE BRANDING ===");

// Simulating Type Branding (Nominal Type Simulation)
declare const __brand: unique symbol;
type Brand<K, T> = K & { readonly [__brand]: T };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

function createUserId(id: string): UserId {
  if (!id.startsWith("usr_")) throw new Error("Invalid UserId format");
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  if (!id.startsWith("ord_")) throw new Error("Invalid OrderId format");
  return id as OrderId;
}

function cancelOrder(orderId: OrderId, requestedBy: UserId) {
  console.log(`✅ Order [${orderId}] successfully cancelled by user [${requestedBy}]`);
}

const validUser = createUserId("usr_8829");
const validOrder = createOrderId("ord_4041");

// Correct invocation:
cancelOrder(validOrder, validUser);

// Note: Attempting `cancelOrder(validUser, validOrder)` triggers TS2345:
// "Argument of type 'UserId' is not assignable to parameter of type 'OrderId'."


console.log("\n=== 3. NON-DESTRUCTIVE WIDENING: STATIC VIEW VS RUNTIME OBJECT ===");

type PublicUserProfile = {
  id: string;
  username: string;
};

function getPublicProfile(profile: PublicUserProfile): PublicUserProfile {
  return profile;
}

// Rich object with sensitive runtime fields:
const databaseRecord = {
  id: "usr_9001",
  username: "cyber_ninja",
  passwordHash: "sha256_secret_hash_value",
  internalCreditScore: 780
};

const publicView = getPublicProfile(databaseRecord);

console.log("Static TypeScript view accesses only id & username:", publicView.id, publicView.username);

// ⚠️ Runtime reality: passwordHash was NOT stripped by TypeScript!
console.log("JSON.stringify output contains sensitive keys:", JSON.stringify(publicView));


console.log("\n=== 4. STRUCTURAL FUNCTION SUBTYPING (PARAMETER DISCARDING) ===");

type DataTransformer = (value: number, index: number, all: number[]) => string;

function applyTransformation(items: number[], transformer: DataTransformer): string[] {
  return items.map((val, idx, arr) => transformer(val, idx, arr));
}

// A transformer that only takes 1 argument (discards index and all):
const squareToString = (n: number) => `Val: ${n * n}`;

const results = applyTransformation([1, 2, 3], squareToString);
console.log("Transformed Results:", results); // ["Val: 1", "Val: 4", "Val: 9"]


console.log("\n=== 5. TYPE ASSERTION VS RUNTIME CONVERSION ===");

const rawStringNumber = "100";

// Static assertion only:
const assertedVal = rawStringNumber as unknown as number;
console.log("typeof assertedVal at runtime:", typeof assertedVal); // "string"
console.log("assertedVal + 50 (Coercion trap):", (assertedVal as any) + 50); // "10050"

// Real runtime conversion:
const convertedVal = Number(rawStringNumber);
console.log("typeof convertedVal at runtime:", typeof convertedVal); // "number"
console.log("convertedVal + 50 (Math calculation):", convertedVal + 50); // 150
