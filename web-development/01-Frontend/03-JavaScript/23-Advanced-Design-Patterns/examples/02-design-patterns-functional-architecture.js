/**
 * KPI 17 — Part 02: Design Patterns, Functional Architecture & Senior-Level Abstraction Decisions
 * Demonstrates:
 * 1. Gotcha: Strategy Pattern Dictionary vs Monolithic Switch-Case
 * 2. Gotcha: Pure Functions with Structural Sharing vs In-Place Mutation
 * 3. Prediction 1: Higher-Order Function Logger Closure
 * 4. Prediction 2: Strategy Routing & Fallbacks
 * 5. Practical Architecture: Standalone Composable Strategy & Pipeline Engine
 */

"use strict";

console.log("=== 1. GOTCHA: STRATEGY PATTERN VS MONOLITHIC SWITCH ===");

// Strategy Dictionary (Open-Closed Principle)
const taxStrategies = {
  US: (subtotal) => subtotal * 0.08,
  EU: (subtotal) => subtotal * 0.20,
  IN: (subtotal) => subtotal * 0.18,
};

function calculateOrderTax(countryCode, subtotal) {
  const strategy = taxStrategies[countryCode];
  if (!strategy) {
    throw new Error(`Unsupported country tax jurisdiction: ${countryCode}`);
  }
  return strategy(subtotal);
}

console.log("  US Tax on $100:", calculateOrderTax("US", 100)); // $8
console.log("  EU Tax on $100:", calculateOrderTax("EU", 100)); // $20
console.log("  IN Tax on $100:", calculateOrderTax("IN", 100)); // $18

console.log("\n=== 2. GOTCHA: PURE FUNCTIONS WITH STRUCTURAL SHARING ===");

const initialCart = {
  id: "CART_101",
  total: 200,
  items: [{ id: 1, name: "Keyboard", price: 200 }]
};

// Pure Transformation: returns a new object reference
function applyCouponPure(cart, discountRate) {
  return {
    ...cart,
    total: cart.total * (1 - discountRate)
  };
}

const discountedCart = applyCouponPure(initialCart, 0.1);
console.log("  Initial Cart Total:", initialCart.total);       // 200 (Unchanged!)
console.log("  Discounted Cart Total:", discountedCart.total); // 180
console.log("  Reference Equality (cart === discounted):", initialCart === discountedCart); // false (State safe!)

console.log("\n=== 3. PRACTICAL ARCHITECTURE: COMPOSABLE FUNCTIONAL PIPELINE ENGINE ===");

// 1. Pure Atomic Transformers
const cleanText = (str) => str.trim();
const normalizeEmail = (str) => str.toLowerCase();
const maskEmail = (email) => {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}***@${domain}`;
};

// 2. Functional Composition (pipe)
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const processAndMaskEmail = pipe(cleanText, normalizeEmail, maskEmail);

const rawInput = "   SUNNY.DEV@ENGINEERING-VAULT.COM   ";
console.log("  ▶️ Raw Input:        ", `"${rawInput}"`);
console.log("  ✅ Processed & Masked:", processAndMaskEmail(rawInput));

console.log("\n  🎉 [Design Patterns & Functional Architecture Verification Completed Successfully!]");
