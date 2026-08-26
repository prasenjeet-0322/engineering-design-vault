/**
 * KPI 02 — Part 12: Function Currying, Partial Application & Factories
 * Demonstrates:
 * 1. Gotcha: Function Factory Reference Identity Mismatch
 * 2. Prediction 1: Factory Identity vs Primitive Equality
 * 3. Prediction 2: Independent Factory Scope Instances
 * 4. Prediction 4: Partial Application Object Mutation Trap
 * 5. Currying vs Partial Application vs Service Object
 * 6. Practical Architecture: Multi-Tenant API Client SDK with Dependency Injection
 */

console.log("=== 1. GOTCHA: FACTORY REFERENCE IDENTITY MISMATCH ===");
const multiply = (a) => (b) => a * b;

const double = multiply(2);
const anotherDouble = multiply(2);

console.log("Reference equality (double === anotherDouble):", double === anotherDouble); // false ❌
console.log("Output equality (double(5) === anotherDouble(5)):", double(5) === anotherDouble(5)); // true ✅

console.log("\n=== 2. PREDICTION 2: INDEPENDENT FACTORY SCOPES ===");
function createCounter() {
  let count = 0;
  return () => ++count;
}

const cA = createCounter();
const cB = createCounter();

console.log("cA calls:", cA(), cA()); // 1, 2
console.log("cB calls:", cB());       // 1
console.log("cA calls:", cA());       // 3

console.log("\n=== 3. PREDICTION 4: PARTIAL APPLICATION MUTATION TRAP ===");
function createReader(config) {
  return () => config.value;
}

const config = { value: 1 };
const read = createReader(config);
config.value = 10; // Mutates heap object directly
console.log("read() reads mutated reference:", read()); // 10

console.log("\n=== 4. CURRYING VS PARTIAL APPLICATION VS SERVICE OBJECT ===");

// A. Curried API: f(a)(b)(c)
const curriedDiscount = (rate) => (tax) => (price) => (price * (1 - rate)) * (1 + tax);
console.log("Curried Calculation:", curriedDiscount(0.10)(0.18)(1000));

// B. Partial Application: f(a, b, c) -> f(b, c)
function computePrice(rate, tax, price) {
  return (price * (1 - rate)) * (1 + tax);
}
const standardPromoPrice = (price) => computePrice(0.10, 0.18, price);
console.log("Partial Application Calculation:", standardPromoPrice(1000));

// C. Service Object: Clean multi-method interface
function createPricingService({ defaultRate, defaultTax }) {
  return {
    calculate: (price) => (price * (1 - defaultRate)) * (1 + defaultTax),
    getTaxBreakdown: (price) => ({
      base: price * (1 - defaultRate),
      tax: (price * (1 - defaultRate)) * defaultTax
    })
  };
}
const pricing = createPricingService({ defaultRate: 0.10, defaultTax: 0.18 });
console.log("Service Object Calculation:", pricing.calculate(1000));

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-TENANT API CLIENT ===");

function createApiClient({ baseUrl, tenantId, getToken }) {
  // Destructure primitives to prevent holding external config references
  const base = baseUrl;
  const tenant = tenantId;

  return {
    async request(endpoint, options = {}) {
      const token = getToken();
      const headers = {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenant,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      console.log(`[API Request -> ${base}${endpoint}] Headers:`, headers);
      return { status: 200, data: { success: true, endpoint } };
    }
  };
}

// Client setup
let userToken = "jwt-token-alpha";
const client = createApiClient({
  baseUrl: "https://api.enterprise.io/v1",
  tenantId: "tenant_42",
  getToken: () => userToken
});

client.request("/users/profile").then(res => {
  console.log("API Response:", res);
});
