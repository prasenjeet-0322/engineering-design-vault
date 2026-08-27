/**
 * KPI 23 — Part 03: Strategy Pattern & Dynamic Algorithms
 * Demonstrates:
 * 1. Gotcha: Inconsistent Return Shape vs Uniform Strategy Contract
 * 2. Gotcha: Dynamic Strategy Registry with Fallback Protection
 * 3. Prediction 1: Higher-Order Configurable Discount Strategies
 * 4. Prediction 2: Multi-Criteria Dynamic Sorting Strategies
 * 5. Practical Architecture: Standalone Multi-Payment & Checkout Strategy Engine
 */

"use strict";

console.log("=== 1. GOTCHA: UNIFORM STRATEGY CONTRACT NORMALIZATION ===");

// 🟢 Enforcing Uniform Contract: (val) => { valid: boolean, error?: string }
const formValidators = {
  required: (val) => ({
    valid: Boolean(val && val.trim().length > 0),
    error: val && val.trim().length > 0 ? undefined : "This field is required"
  }),

  email: (val) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    return {
      valid: isEmail,
      error: isEmail ? undefined : "Please enter a valid email address"
    };
  },

  minLength: (min) => (val) => ({
    valid: val ? val.length >= min : false,
    error: val && val.length >= min ? undefined : `Must be at least ${min} characters`
  })
};

function validateField(validatorFn, value) {
  const result = validatorFn(value);
  console.log(`  Validation [Val: "${value}"]: Valid=${result.valid} | Error=${result.error ?? "None"}`);
  return result;
}

validateField(formValidators.required, "Sunny");
validateField(formValidators.email, "invalid-email");
validateField(formValidators.minLength(8), "secret123");

console.log("\n=== 2. GOTCHA: DYNAMIC STRATEGY REGISTRY & FALLBACK ===");

class StrategyRegistry {
  #strategies = new Map();
  #defaultKey = null;

  register(key, strategyFn, isDefault = false) {
    this.#strategies.set(key, strategyFn);
    if (isDefault) this.#defaultKey = key;
  }

  execute(key, ...args) {
    const strategy = this.#strategies.get(key) ?? this.#strategies.get(this.#defaultKey);
    if (!strategy) throw new Error(`No strategy found for key: ${key}`);
    return strategy(...args);
  }
}

const formatterRegistry = new StrategyRegistry();
formatterRegistry.register("json", (data) => JSON.stringify(data), true); // Default
formatterRegistry.register("csv", (data) => data.join(","));

console.log("  CSV Strategy Output:", formatterRegistry.execute("csv", ["A", "B", "C"]));
console.log("  Unknown Strategy Fallback (JSON):", formatterRegistry.execute("xml", { name: "Sunny" }));

console.log("\n=== 3. PREDICTIONS: HIGHER-ORDER DISCOUNTS & SORTING STRATEGIES ===");

const discountStrategies = {
  percentage: (percent) => (amount) => amount * (1 - percent / 100),
  fixed: (deduction) => (amount) => Math.max(0, amount - deduction)
};

const blackFridaySale = discountStrategies.percentage(25);
const loyaltyVoucher = discountStrategies.fixed(50);

console.log("  Original: $200 | 25% Off Strategy:", blackFridaySale(200)); // 150
console.log("  Original: $200 | $50 Voucher Strategy:", loyaltyVoucher(200)); // 150

// Dynamic Table Sorters
const products = [
  { name: "Pro Laptop", price: 1200, rating: 4.8 },
  { name: "Budget Tablet", price: 300, rating: 4.2 },
  { name: "Wireless Mouse", price: 50, rating: 4.9 }
];

const sorters = {
  priceAsc: (a, b) => a.price - b.price,
  ratingDesc: (a, b) => b.rating - a.rating
};

console.log("  Sorted by Price Ascending:", [...products].sort(sorters.priceAsc).map((p) => `${p.name} ($${p.price})`));
console.log("  Sorted by Rating Descending:", [...products].sort(sorters.ratingDesc).map((p) => `${p.name} (★${p.rating})`));

console.log("\n=== 4. PRACTICAL ARCHITECTURE: STANDALONE CHECKOUT STRATEGY ENGINE ===");

const paymentStrategies = {
  async STRIPE(order) {
    console.log(`    💳 [Stripe Gateway]: Charging $${order.total} to Credit Card`);
    return { success: true, txId: `stripe_ch_${Date.now()}` };
  },

  async PAYPAL(order) {
    console.log(`    🅿️ [PayPal Gateway]: Redirecting to PayPal Express for $${order.total}`);
    return { success: true, txId: `pp_token_${Date.now()}` };
  },

  async CRYPTO(order) {
    console.log(`    ⛓️ [Web3 Gateway]: Generating Smart Contract Invoice for $${order.total}`);
    return { success: true, txId: `0xETH_${Date.now()}` };
  }
};

async function processCheckout(method, order) {
  const strategy = paymentStrategies[method];
  if (!strategy) throw new Error(`Unsupported payment method: ${method}`);

  console.log(`  ▶️ Starting checkout for Order #${order.id} via [${method}] Strategy:`);
  const result = await strategy(order);
  console.log("  ✅ Checkout Result:", result);
  return result;
}

async function runDemo() {
  const order = { id: "ORD-1092", total: 499.00 };
  await processCheckout("STRIPE", order);
  await processCheckout("CRYPTO", order);
  console.log("\n  🎉 [Strategy Pattern & Dynamic Algorithms Verification Completed Successfully!]");
}

runDemo();
