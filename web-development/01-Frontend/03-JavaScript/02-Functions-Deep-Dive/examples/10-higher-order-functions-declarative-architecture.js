/**
 * KPI 02 — Part 10: Higher-Order Functions, Callbacks & Declarative Architecture
 * Demonstrates:
 * 1. Gotcha: Curried Multiplier Factory & Closure Specialization
 * 2. Prediction 1: pipe() Left-to-Right Evaluation Order
 * 3. Prediction 2: Function Wrapping Telemetry Execution
 * 4. Prediction 3: Function Object Identity (createHandler())
 * 5. Prediction 4: compose() Right-to-Left Evaluation Order
 * 6. Practical Architecture: Composable API Client Pipeline (Timing + Retry + Abort)
 */

console.log("=== 1. GOTCHA: CURRIED FACTORY & CLOSURE SPECIALIZATION ===");
const multiply = (factor) => (value) => value * factor;
const double = multiply(2);
const triple = multiply(3);

console.log("double(5):", double(5)); // 10
console.log("triple(5):", triple(5)); // 15

console.log("\n=== 2. PREDICTION 1: PIPE (LEFT-TO-RIGHT) ===");
const pipe = (...fns) => (initial) => fns.reduce((val, fn) => fn(val), initial);

const addTwo = (x) => x + 2;
const doubleVal = (x) => x * 2;
const pipeline = pipe(addTwo, doubleVal);

console.log("pipe(addTwo, doubleVal)(5):", pipeline(5)); // (5 + 2) * 2 = 14

console.log("\n=== 3. PREDICTION 2: WRAPPER TELEMETRY EXECUTION ===");
function withLogging(fn) {
  return (...args) => {
    console.log("[Log] Before function execution");
    const result = fn(...args);
    console.log("[Log] After function execution");
    return result;
  };
}

const loggedDouble = withLogging((x) => x * 2);
console.log("loggedDouble(5) Result:", loggedDouble(5));

console.log("\n=== 4. PREDICTION 3: FUNCTION OBJECT IDENTITY ===");
function createHandler() {
  return () => console.log("hello");
}

const h1 = createHandler();
const h2 = createHandler();
console.log("Distinct function factory instances:", h1 === h2); // false

console.log("\n=== 5. PREDICTION 4: COMPOSE (RIGHT-TO-LEFT) ===");
const compose = (...fns) => (initial) => fns.reduceRight((val, fn) => fn(val), initial);

const addOne = (x) => x + 1;
const composePipeline = compose(addOne, doubleVal);
console.log("compose(addOne, doubleVal)(5):", composePipeline(5)); // (5 * 2) + 1 = 11

console.log("\n=== 6. PRACTICAL ARCHITECTURE: COMPOSABLE API MIDDLEWARE ===");

// 1. Timing Middleware
const withTimingMiddleware = (next) => async (ctx) => {
  const start = performance.now();
  try {
    const res = await next(ctx);
    console.log(`[API Timing: ${ctx.url}] Finished in ${(performance.now() - start).toFixed(2)}ms`);
    return res;
  } catch (err) {
    console.error(`[API Error: ${ctx.url}] Failed in ${(performance.now() - start).toFixed(2)}ms`);
    throw err;
  }
};

// 2. Retry Middleware
const withRetryMiddleware = (maxRetries = 2) => (next) => async (ctx) => {
  let attempt = 0;
  while (true) {
    try {
      return await next(ctx);
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || ctx.method === "POST") throw err;
      console.log(`[API Retry] Attempt ${attempt} failed. Retrying in 20ms...`);
      await new Promise(r => setTimeout(r, 20));
    }
  }
};

// 3. Core Mock Dispatcher
let failureCount = 0;
const mockFetchHandler = async (ctx) => {
  if (ctx.url.includes("unreliable") && failureCount < 1) {
    failureCount++;
    throw new Error("503 Service Unavailable");
  }
  return { status: 200, data: { user: "Sunny", query: ctx.url } };
};

// Compose Pipeline
function createApiClient(middlewares) {
  const dispatch = middlewares.reduceRight((next, mw) => mw(next), mockFetchHandler);
  return {
    get: (url) => dispatch({ url, method: "GET" })
  };
}

const client = createApiClient([withTimingMiddleware, withRetryMiddleware(2)]);

client.get("/api/unreliable-endpoint").then((res) => {
  console.log("Client request resolved successfully:", res);
});
