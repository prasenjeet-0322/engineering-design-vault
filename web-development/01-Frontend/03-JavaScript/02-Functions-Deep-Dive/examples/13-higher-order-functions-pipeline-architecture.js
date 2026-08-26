/**
 * KPI 02 — Part 13: Higher-Order Functions, Callbacks & Pipeline Architecture
 * Demonstrates:
 * 1. Gotcha: Detached Method Callback Context Loss & Receiver Fix
 * 2. Prediction 1: Synchronous Callback Flow
 * 3. Prediction 2: Wrapper Function Instance Identity Mismatch
 * 4. Prediction 4: Pipeline Early Termination on Error
 * 5. Prediction 5: Middleware Onion Execution Flow (await next())
 * 6. Practical Architecture: Composable Async Middleware Engine
 */

console.log("=== 1. GOTCHA: DETACHED METHOD RECEIVER FIX ===");
const user = {
  name: "Sunny",
  greet() {
    return `Hello, ${this?.name || "Anonymous (Receiver Lost!)"}`;
  }
};

function execute(callback) {
  return callback();
}

console.log("Direct detached call:", execute(user.greet)); // Receiver lost!
console.log("Arrow wrapper fix:", execute(() => user.greet())); // Fixed via arrow closure
console.log("Explicit bind fix:", execute(user.greet.bind(user))); // Fixed via bind()

console.log("\n=== 2. PREDICTION 1: SYNCHRONOUS CALLBACK FLOW ===");
function syncRunner(callback) {
  console.log("A");
  callback();
  console.log("C");
}
syncRunner(() => console.log("B")); // A -> B -> C

console.log("\n=== 3. PREDICTION 2: WRAPPER FUNCTION IDENTITY ===");
function withLogging(fn) {
  return (...args) => {
    console.log("[Log] before");
    return fn(...args);
  };
}
const add = (a, b) => a + b;
const wrappedA = withLogging(add);
const wrappedB = withLogging(add);
console.log("wrappedA === wrappedB:", wrappedA === wrappedB); // false
console.log("wrappedA(1, 2):", wrappedA(1, 2));

console.log("\n=== 4. PREDICTION 4: PIPELINE EARLY TERMINATION ON ERROR ===");
const validatePositive = (x) => {
  if (x < 0) throw new Error("Negative value rejected");
  return x;
};
const double = (x) => x * 2;
const pipe = (initial, ...fns) => fns.reduce((val, fn) => fn(val), initial);

try {
  pipe(-5, validatePositive, double);
} catch (err) {
  console.log("Pipeline stopped successfully on error:", err.message);
}

console.log("\n=== 5. PREDICTION 5 & PRACTICAL ARCHITECTURE: ONION MIDDLEWARE ENGINE ===");

async function telemetryMiddleware(ctx, next) {
  const start = performance.now();
  console.log(`[Telemetry] Pre-processing: ${ctx.method} ${ctx.url}`);
  try {
    const res = await next();
    console.log(`[Telemetry] Post-processing completed in ${(performance.now() - start).toFixed(2)}ms`);
    return res;
  } catch (err) {
    console.error(`[Telemetry] Failed after ${(performance.now() - start).toFixed(2)}ms`);
    throw err;
  }
}

async function authMiddleware(ctx, next) {
  console.log("[Auth] Validating session headers...");
  ctx.headers["Authorization"] = "Bearer token-xyz-999";
  const res = await next();
  console.log("[Auth] Response processed");
  return res;
}

function createOnionRunner(middlewares, coreHandler) {
  return function execute(ctx) {
    let index = -1;
    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error("next() called multiple times"));
      index = i;
      const fn = middlewares[i];
      if (i === middlewares.length) {
        return coreHandler(ctx);
      }
      return fn(ctx, () => dispatch(i + 1));
    }
    return dispatch(0);
  };
}

const coreHandler = async (ctx) => {
  console.log(`  -> [Core Handler Executed] Processing request for: ${ctx.url}`);
  return { status: 200, data: { success: true, payload: "Enterprise User Data" } };
};

const appPipeline = createOnionRunner([telemetryMiddleware, authMiddleware], coreHandler);

appPipeline({ method: "GET", url: "/api/dashboard", headers: {} }).then(res => {
  console.log("Final Pipeline Response:", res);
});
