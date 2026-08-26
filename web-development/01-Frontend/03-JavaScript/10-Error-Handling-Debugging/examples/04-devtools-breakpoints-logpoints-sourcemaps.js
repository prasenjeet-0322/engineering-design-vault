/**
 * KPI 10 — Part 04: Browser DevTools & Systematic Debugging
 * Demonstrates:
 * 1. Gotcha: State Invariant Violations vs Silent Logic Failures
 * 2. Advanced Console Diagnostics: console.table, console.group, console.trace, console.time
 * 3. Prediction 1: Call Stack Origin Tracing with console.trace()
 * 4. Prediction 2: Invariant Assertion Guards with Structured Diagnostics
 * 5. Practical Architecture: Enterprise Diagnostics & State Invariant Telemetry Engine
 */

"use strict";

console.log("=== 1. ADVANCED CONSOLE DIAGNOSTICS: TABLE & GROUPING ===");

const userCatalog = [
  { id: "U-1", name: "Sunny Yadav", role: "admin", active: true },
  { id: "U-2", name: "Alex Rivers", role: "developer", active: false },
  { id: "U-3", name: "Sarah Chen", role: "auditor", active: true }
];

console.log("Tabular Formatting for Collections (console.table):");
console.table(userCatalog, ["id", "name", "role", "active"]);

console.log("\nCollapsible Grouped Logging (console.group):");
console.group("Transaction Audit: Order #9812");
console.log("Customer ID: U-1");
console.log("Subtotal: $129.99");
console.log("Status: PAID");
console.groupEnd();

console.log("\n=== 2. CALL STACK ORIGIN TRACING (CONSOLE.TRACE) ===");

function executeLowLevelQuery() {
  console.log("Inspecting call stack at query execution point:");
  console.trace("Query Execution Origin");
}

function serviceLayerAction() {
  executeLowLevelQuery();
}

function userInterfaceDispatch() {
  serviceLayerAction();
}

userInterfaceDispatch();

console.log("\n=== 3. INVARIANT ASSERTION ENGINE & SYSTEMATIC DIAGNOSTICS ===");

function assertInvariant(condition, message, context = {}) {
  if (!condition) {
    console.error(`🚨 [INVARIANT VIOLATION]: ${message}`);
    console.error("Context Data Dump:", context);
    return false;
  }
  return true;
}

const cartState = {
  items: [
    { id: "P1", price: 50, qty: 2 },
    { id: "P2", price: -10, qty: 1 } // Corrupt item!
  ]
};

// Check business invariants: Every item price must be > 0
const isCartValid = cartState.items.every((item) =>
  assertInvariant(item.price > 0, "Item price must be positive non-zero number", item)
);

console.log("Is Cart Structurally Valid?:", isCartValid); // false

console.log("\n=== 4. EXECUTION PERFORMANCE TIMING (CONSOLE.TIME) ===");

console.time("Array Transformation Benchmark");
const transformed = Array.from({ length: 10000 }, (_, i) => i)
  .filter((n) => n % 2 === 0)
  .map((n) => n * 2);
console.timeEnd("Array Transformation Benchmark");
console.log("Transformed items count:", transformed.length);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: ENTERPRISE STATE TELEMETRY ENGINE ===");

class StateTelemetryEngine {
  constructor() {
    this.history = [];
  }

  trackTransition(action, prevState, nextState) {
    const timestamp = new Date().toISOString();
    const event = { action, timestamp, prevState, nextState };
    this.history.push(event);

    console.groupCollapsed(`[State Transition]: ${action} @ ${timestamp}`);
    console.log("Previous State:", prevState);
    console.log("Next State:", nextState);
    console.groupEnd();
  }

  dumpAuditLog() {
    console.log("=== Complete Audit History ===");
    console.table(
      this.history.map((h) => ({
        Action: h.action,
        Timestamp: h.timestamp,
        HasSession: !!h.nextState.user
      }))
    );
  }
}

const telemetry = new StateTelemetryEngine();
let appState = { user: null, authenticated: false };

// Action 1: Login
const stateAfterLogin = { user: { id: "U-1", name: "Sunny" }, authenticated: true };
telemetry.trackTransition("USER_LOGGED_IN", appState, stateAfterLogin);
appState = stateAfterLogin;

// Action 2: Logout
const stateAfterLogout = { user: null, authenticated: false };
telemetry.trackTransition("USER_LOGGED_OUT", appState, stateAfterLogout);
appState = stateAfterLogout;

telemetry.dumpAuditLog();
