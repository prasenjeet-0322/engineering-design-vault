/**
 * KPI 09 — Part 08: Production Architecture & Senior-Level Functional Decisions
 * Demonstrates:
 * 1. Gotcha: Stored Duplicated State vs Pure Derived State in State Management
 * 2. Prediction 1: Data Normalization Boundary (DTO -> Domain Entity)
 * 3. Prediction 2: Discriminated Union Finite State Machine Transition
 * 4. Prediction 3: Pure Functional Core Zero-Mock Unit Test Verification
 * 5. Practical Architecture: Enterprise Multi-Layer E-Commerce Checkout Engine
 */

"use strict";

console.log("=== 1. GOTCHA: STORED DUPLICATED STATE VS PURE DERIVATION ===");

// Anti-Pattern Store (Prone to desync bugs)
class FlawedCartStore {
  constructor() {
    this.items = [];
    this.total = 0; // Duplicated State!
  }
  addItem(item) {
    this.items.push(item);
    this.total += item.price;
  }
  removeItem(sku) {
    this.items = this.items.filter(i => i.sku !== sku);
    // Developer forgot to update this.total! -> Bug!
  }
}

// Senior Standard Store (Derived State via Pure Function)
class SeniorCartStore {
  constructor() {
    this.items = [];
  }
  addItem(item) {
    this.items = [...this.items, item];
  }
  removeItem(sku) {
    this.items = this.items.filter(i => i.sku !== sku);
  }
  // Single Source of Truth derivation:
  getTotal() {
    return this.items.reduce((sum, i) => sum + i.price, 0);
  }
}

const flawed = new FlawedCartStore();
flawed.addItem({ sku: "A", price: 100 });
flawed.removeItem("A");
console.log("Flawed Store (Items count):", flawed.items.length); // 0
console.log("Flawed Store (Out-of-sync total!):", flawed.total); // 100 (Stale State Bug!)

const senior = new SeniorCartStore();
senior.addItem({ sku: "A", price: 100 });
senior.removeItem("A");
console.log("Senior Store (Items count):", senior.items.length); // 0
console.log("Senior Store (Guaranteed sync total):", senior.getTotal()); // 0 (Correct!)

console.log("\n=== 2. PREDICTION 1: DATA NORMALIZATION BOUNDARY ===");
const rawBackendDto = {
  item_sku: "MON_4K_01",
  display_title: "   4K UHD Gaming Monitor   ",
  cost_cents: 49900,
  in_stock_qty: 12
};

function normalizeProductDto(dto) {
  return {
    sku: dto.item_sku,
    name: dto.display_title.trim(),
    price: dto.cost_cents / 100,
    availableStock: dto.in_stock_qty
  };
}

const domainProduct = normalizeProductDto(rawBackendDto);
console.log("Normalized Domain Product:", domainProduct);

console.log("\n=== 3. PREDICTION 2: FINITE STATE MACHINE TRANSITION ===");
function checkoutStateMachine(state, action) {
  switch (state.status) {
    case "IDLE":
      if (action.type === "START_CHECKOUT") return { status: "PROCESSING", orderId: action.orderId };
      return state;
    case "PROCESSING":
      if (action.type === "PAYMENT_SUCCESS") return { status: "SUCCESS", receipt: action.receipt };
      if (action.type === "PAYMENT_FAILED") return { status: "ERROR", message: action.message };
      return state;
    case "SUCCESS":
    case "ERROR":
      if (action.type === "RESET") return { status: "IDLE" };
      return state;
    default:
      return state;
  }
}

const s0 = { status: "IDLE" };
const s1 = checkoutStateMachine(s0, { type: "START_CHECKOUT", orderId: "ORD_999" });
const s2 = checkoutStateMachine(s1, { type: "PAYMENT_SUCCESS", receipt: "REC_ABC" });
const s3Invalid = checkoutStateMachine(s2, { type: "PAYMENT_FAILED", message: "Network error" }); // Invalid transition!

console.log("State 0 (Initial):", s0.status); // IDLE
console.log("State 1 (Processing):", s1.status); // PROCESSING
console.log("State 2 (Success):", s2.status); // SUCCESS
console.log("State 3 (Ignored Invalid Event):", s3Invalid.status); // SUCCESS (State invariant protected!)

console.log("\n=== 4. PREDICTION 3: ZERO-MOCK UNIT TEST VERIFICATION ===");
function calculateSummary(items, discountPct = 0, taxRate = 0.08) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * (discountPct / 100);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * taxRate;
  const total = taxable + tax;
  const isEligible = items.length > 0 && items.every(i => i.quantity <= i.availableStock);

  return { subtotal, discount, tax, total, isEligible };
}

// 🟢 ZERO-MOCK UNIT TESTS: Pure assertion execution
const mockItems = [
  { sku: "SKU_1", price: 100, quantity: 2, availableStock: 5 }, // $200
  { sku: "SKU_2", price: 50, quantity: 1, availableStock: 1 }   // $50 -> Subtotal: $250
];

const testSummary = calculateSummary(mockItems, 10, 0.08);

console.log("Subtotal matches $250?:", testSummary.subtotal === 250); // true
console.log("Discount matches $25?:", testSummary.discount === 25);   // true
console.log("Tax matches $18?:", testSummary.tax === 18);             // true
console.log("Total matches $243?:", testSummary.total === 243);       // true
console.log("Is Eligible for Checkout?:", testSummary.isEligible);   // true

console.log("\n=== 5. PRACTICAL ARCHITECTURE: END-TO-END CHECKOUT RUN ===");
console.log("Calculated Order Summary Object:");
console.dir(testSummary, { depth: null });
