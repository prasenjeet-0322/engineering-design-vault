/**
 * KPI 09 — Part 01: Functional Programming Foundations & Pure Functions
 * Demonstrates:
 * 1. Gotcha: In-Place Mutation Trap (.sort) vs Pure Array Projections (.toSorted)
 * 2. Prediction 1: Object Argument In-Place Mutation Modifying Caller References
 * 3. Prediction 2: Dependency Injection for Controlled Determinism (Time & Clock)
 * 4. Prediction 3: Referential Transparency Substitution
 * 5. Practical Architecture: Functional Core, Imperative Shell Checkout Engine
 */

"use strict";

console.log("=== 1. GOTCHA: IN-PLACE MUTATION TRAP VS PURE PROJECTION ===");
const originalRoster = [
  { name: "Zack", rating: 90 },
  { name: "Alice", rating: 95 }
];

// Impure: mutates original array in-place
function impureSort(arr) {
  return arr.sort((a, b) => a.name.localeCompare(b.name));
}

// Pure: creates a new array reference without altering original
function pureSort(arr) {
  return [...arr].sort((a, b) => a.name.localeCompare(b.name));
}

const copyForTest = [...originalRoster];
const sortedPure = pureSort(copyForTest);
console.log("Original untouched first item:", copyForTest[0].name); // Zack
console.log("Purely sorted first item:", sortedPure[0].name); // Alice
console.log("Array reference unchanged?:", copyForTest === sortedPure); // false

console.log("\n=== 2. PREDICTION 1: ARGUMENT MUTATION ===");
function impureApplyBonus(employee, bonus) {
  employee.salary += bonus; // Mutates caller's object
  return employee;
}

function pureApplyBonus(employee, bonus) {
  return { ...employee, salary: employee.salary + bonus }; // Returns new object
}

const emp = { id: 101, name: "Prasenjeet", salary: 120000 };
const updatedEmp = pureApplyBonus(emp, 30000);

console.log("Original Employee Salary:", emp.salary); // 120000
console.log("Updated Employee Salary:", updatedEmp.salary); // 150000
console.log("Different object references?:", emp !== updatedEmp); // true

console.log("\n=== 3. PREDICTION 2: DEPENDENCY INJECTION FOR DETERMINISTIC TIME ===");
function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// 100% Deterministic & Unit-Testable with zero mocks!
console.log("Morning check (09:00):", getGreeting(9));
console.log("Afternoon check (14:00):", getGreeting(14));
console.log("Evening check (20:00):", getGreeting(20));

console.log("\n=== 4. PREDICTION 3: REFERENTIAL TRANSPARENCY ===");
function calculateTax(price, rate) {
  return price * rate;
}

// Since calculateTax(100, 0.1) is pure and equals 10, replacing it with 10 has 0 side effects
const expr1 = calculateTax(100, 0.1) + calculateTax(100, 0.1);
const expr2 = 10 + 10;
console.log("Referentially transparent evaluation match:", expr1 === expr2); // true

console.log("\n=== 5. PRACTICAL ARCHITECTURE: FUNCTIONAL CORE, IMPERATIVE SHELL ===");

// 🟢 PURE FUNCTIONAL CORE
function calculateCheckout(items, discountPct = 0, taxRate = 0.08) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmount = subtotal * (discountPct / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal
  };
}

// 🔴 IMPERATIVE SHELL
async function executeOrderWorkflow() {
  const cart = [
    { id: "A1", name: "4K Monitor", price: 400, qty: 1 },
    { id: "B2", name: "USB-C Cable", price: 20, qty: 2 }
  ];

  // Pure computation
  const summary = calculateCheckout(cart, 10, 0.08);

  console.log("[Imperative Shell] Computed Order Summary:", summary);
  console.log(`[Imperative Shell] Grand Total for payment: $${summary.grandTotal.toFixed(2)}`);
}

executeOrderWorkflow();
