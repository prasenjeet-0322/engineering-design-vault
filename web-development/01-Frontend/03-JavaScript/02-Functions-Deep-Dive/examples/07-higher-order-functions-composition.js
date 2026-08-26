/**
 * KPI 02 — Part 7: Higher-Order Functions, Callbacks & Composition
 * Demonstrates:
 * 1. Gotcha: Passing Function Reference vs Passing Invocation Result
 * 2. Function Composition (compose) vs Pipeline (pipe)
 * 3. Currying & Partial Application
 * 4. once() Higher-Order Function Decorator
 * 5. Middleware Pipeline Simulation (Onion Model)
 * 6. Practical Architecture: High-Throughput Order Processing Pipeline
 */

console.log("=== 1. GOTCHA: FUNCTION REFERENCE VS INVOCATION ===");
function greet() {
  console.log("Hello from greet!");
  return "GREETED";
}

// Simulating scheduler:
function schedule(fn) {
  if (typeof fn === "function") {
    console.log("Scheduling valid function pointer...");
    fn();
  } else {
    console.log(`❌ Invalid callback passed: typeof is ${typeof fn} (${fn})`);
  }
}

schedule(greet);   // ✅ Passes reference
schedule(greet()); // ❌ Passes evaluated string "GREETED"

console.log("\n=== 2. COMPOSE VS PIPE ===");
const trim = s => s.trim();
const lowercase = s => s.toLowerCase();
const wrapTags = s => `<user>${s}</user>`;

// Compose: right-to-left f(g(h(x)))
const compose = (...fns) => (init) => fns.reduceRight((val, fn) => fn(val), init);
// Pipe: left-to-right h(g(f(x)))
const pipe = (...fns) => (init) => fns.reduce((val, fn) => fn(val), init);

const formatCompose = compose(wrapTags, lowercase, trim);
const formatPipe = pipe(trim, lowercase, wrapTags);

console.log("Compose Output:", formatCompose("  Sunny@Example.COM  ")); // "<user>sunny@example.com</user>"
console.log("Pipe Output:   ", formatPipe("  Alex@Example.COM  "));    // "<user>alex@example.com</user>"

console.log("\n=== 3. CURRYING & PARTIAL APPLICATION ===");
// Currying: transforms f(a, b, c) -> f(a)(b)(c)
const curryDiscount = (rate) => (price) => price * (1 - rate);
const tenPercentOff = curryDiscount(0.10);
console.log("Curried discount applied to ₹1000:", tenPercentOff(1000)); // 900

// Partial Application: pre-filling a subset of parameters
function logWithLevel(level, timestamp, message) {
  console.log(`[${level}] (${timestamp}) ${message}`);
}
const infoLogger = (msg) => logWithLevel("INFO", new Date().toISOString().slice(0, 10), msg);
infoLogger("Application server booted");

console.log("\n=== 4. ONCE() FUNCTION DECORATOR ===");
function once(fn) {
  let executed = false;
  let result;
  return (...args) => {
    if (!executed) {
      executed = true;
      result = fn(...args);
    }
    return result;
  };
}

const initializeDatabase = once(() => {
  console.log("⚡ Database connection established!");
  return { status: "CONNECTED" };
});

console.log("Call 1:", initializeDatabase());
console.log("Call 2:", initializeDatabase()); // Skips execution, returns cached result!

console.log("\n=== 5. MIDDLEWARE ONION PIPELINE ===");
const middlewareA = (next) => async (ctx) => {
  console.log("Middleware A: Pre");
  await next(ctx);
  console.log("Middleware A: Post");
};

const middlewareB = (next) => async (ctx) => {
  console.log("Middleware B: Pre");
  await next(ctx);
  console.log("Middleware B: Post");
};

const coreHandler = async (ctx) => {
  console.log("Core Handler Executed:", ctx.action);
};

// Compose middleware pipeline
const pipeline = [middlewareA, middlewareB].reduceRight(
  (next, mw) => mw(next),
  coreHandler
);

pipeline({ action: "PAYMENT_PROCESS" });

console.log("\n=== 6. PRACTICAL ARCHITECTURE: ORDER TRANSFORMER PIPELINE ===");

const rawOrders = [
  { id: "o-1", total: 500, status: "completed" },
  { id: "o-2", total: 1200, status: "cancelled" },
  { id: "o-3", total: 800, status: "completed" }
];

// Single-pass high-throughput transformer (prevents multiple intermediate array allocations)
function processOrdersSinglePass(orders) {
  let completedCount = 0;
  let totalRevenue = 0;
  const validOrderIds = [];

  for (const order of orders) {
    if (order.status === "completed") {
      completedCount++;
      totalRevenue += order.total;
      validOrderIds.push(order.id);
    }
  }

  return { completedCount, totalRevenue, validOrderIds };
}

console.log("Single-Pass Processed Metrics:", processOrdersSinglePass(rawOrders));
