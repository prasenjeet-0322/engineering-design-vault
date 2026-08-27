/**
 * KPI 03 — Part 13: Lexical Scope, Scope Chain & Identifier Resolution
 * Demonstrates:
 * 1. Gotcha & Prediction 1: Static Lexical Scope vs Dynamic Caller Scope
 * 2. Prediction 2: Basic Nested Scope Shadowing
 * 3. Prediction 3: TDZ Shadowing Blocking Outer Scope Fallback
 * 4. Prediction 4: Nested Closures Scope Chain Traversal
 * 5. Prediction 6: Identifier Resolution (ReferenceError) vs Property Resolution (undefined)
 * 6. Practical Architecture: Multi-Layer Telemetry Context Resolver
 */

console.log("=== 1. GOTCHA & PREDICTION 1: LEXICAL SCOPE VS CALLER SCOPE ===");
const globalValue = "global_lexical_binding";

function printScopeValue() {
  // Statically bound to Global Scope
  return globalValue;
}

function executeScopeCaller() {
  const globalValue = "caller_local_binding";
  return printScopeValue();
}

console.log("printScopeValue() output via caller:", executeScopeCaller()); // "global_lexical_binding"

console.log("\n=== 2. PREDICTION 2: BASIC NESTED SCOPE SHADOWING ===");
const baseVal = 10;
function outerWrapper() {
  const baseVal = 20;
  function innerReader() {
    return baseVal;
  }
  return innerReader();
}
console.log("outerWrapper() output:", outerWrapper()); // 20

console.log("\n=== 3. PREDICTION 3: TDZ SHADOWING BLOCKING FALLBACK ===");
const outerTarget = "outer_target_data";
function testTDZShadowing() {
  try {
    {
      // @ts-ignore
      const readVal = innerTarget; // Throws ReferenceError (TDZ)
      const innerTarget = "inner_target_data";
    }
  } catch (err) {
    return `Caught TDZ Error: ${err.message}`;
  }
  return "success";
}
console.log("testTDZShadowing() result:", testTDZShadowing());

console.log("\n=== 4. PREDICTION 4: NESTED CLOSURE TRAVERSAL ===");
const rootConst = "root_global";
function createNestedReader() {
  const rootConst = "parent_outer";
  return function childReader() {
    return rootConst;
  };
}
const childFn = createNestedReader();
console.log("childFn() evaluation:", childFn()); // "parent_outer"

console.log("\n=== 5. PREDICTION 6: IDENTIFIER VS PROPERTY RESOLUTION ===");
const sampleObj = { title: "Architecture Guide" };
console.log("Property lookup (existing):", sampleObj.title);     // "Architecture Guide"
console.log("Property lookup (missing):", sampleObj.version);   // undefined

let identifierFailed = false;
try {
  // @ts-ignore
  const val = nonExistentIdentifier;
} catch (err) {
  identifierFailed = true;
  console.log("Identifier lookup (missing) caught:", err.message); // ReferenceError
}

console.log("\n=== 6. PRACTICAL ARCHITECTURE: TELEMETRY CONTEXT RESOLVER ===");

class TelemetryContextResolver {
  constructor(globalMetadata) {
    this.globalMetadata = globalMetadata;
  }

  createFeatureScope(featureName, featureMetadata = {}) {
    // Feature Lexical Scope (Parent)
    const featureScope = {
      ...this.globalMetadata,
      ...featureMetadata,
      feature: featureName
    };

    return {
      createActionDispatcher: (actionName) => {
        // Action Dispatcher Scope (Child)
        return (actionPayload = {}) => {
          const resolvedTelemetry = {
            action: actionName,
            feature: featureScope.feature,
            appEnv: featureScope.env,
            version: featureScope.version,
            payload: actionPayload,
            timestamp: Date.now()
          };
          console.log(`[Telemetry Dispatched] [${resolvedTelemetry.feature}:${resolvedTelemetry.action}]`, resolvedTelemetry.payload);
          return resolvedTelemetry;
        };
      }
    };
  }
}

const telemetryEngine = new TelemetryContextResolver({ env: "production", version: "v2.4.0" });
const checkoutScope = telemetryEngine.createFeatureScope("Checkout_Funnel", { tier: "premium" });
const submitOrderDispatcher = checkoutScope.createActionDispatcher("SUBMIT_ORDER");

submitOrderDispatcher({ orderId: "ORD_9941", total: 499.00 });
