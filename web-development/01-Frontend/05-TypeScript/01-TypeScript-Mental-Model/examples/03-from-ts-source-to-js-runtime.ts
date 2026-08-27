/**
 * KPI 1 — Part 3: From TypeScript Source to JavaScript Runtime
 * 
 * Executable Code Demonstrations:
 * 1. Gotcha 1: The Transpiler Illusion (Type Stripping vs Semantic Verification)
 * 2. Type-Only Imports vs Runtime Imports
 * 3. 'const enum' Single-File Transpilation Hazards vs 'as const' Objects
 * 4. Declaration File (.d.ts) and Declaration Map Simulation
 * 5. V8 Hidden Class & Monomorphic Shape Optimization in Runtime JS
 */

console.log("=== 1. GOTCHA 1: THE TRANSPILER ILLUSION (TYPE ERASURE IN ACTION) ===");

// In TypeScript source:
function calculateDiscountPrice(price: number, discountPct: number): number {
  return price - (price * discountPct);
}

// In single-file transpilers (SWC / esbuild / Babel), annotations are stripped mechanically:
// const emittedJs = "function calculateDiscountPrice(price, discountPct) { return price - (price * discountPct); }";

// If a string bypasses type-checking in CI:
const untypedInput: any = "100";
const discountInput: any = 0.2;

// Runtime evaluation in V8:
const result = calculateDiscountPrice(untypedInput, discountInput);
console.log("Evaluated result with string input:", result); // 80 (coerced, but financial risk!)


console.log("\n=== 2. TYPE-ONLY IMPORTS VS RUNTIME IMPORTS ===");

// 1. Compile-time only contract (Erased in JS output)
export interface TransactionPayload {
  transactionId: string;
  amountCents: number;
}

// 2. Runtime class construct (Emitted in JS output)
export class PaymentProcessor {
  process(payload: TransactionPayload) {
    console.log(`[PaymentGateway] Charging ${payload.amountCents} cents for transaction ${payload.transactionId}`);
  }
}

const processor = new PaymentProcessor();
processor.process({ transactionId: "tx_99812", amountCents: 4999 });


console.log("\n=== 3. CONST ENUMS VS AS CONST OBJECT UNIONS ===");

// Standard const enum (can break in isolatedModules across package boundaries):
// const enum ExecutionMode { Fast = "FAST", Strict = "STRICT" }

// Modern Production Standard: 'as const' object map
const ExecutionMode = {
  Fast: "FAST",
  Strict: "STRICT"
} as const;

type ExecutionModeType = typeof ExecutionMode[keyof typeof ExecutionMode];

function setExecutionMode(mode: ExecutionModeType) {
  console.log(`Execution mode configured to: [${mode}]`);
}

setExecutionMode(ExecutionMode.Strict);


console.log("\n=== 4. V8 HIDDEN CLASS (MONOMORPHIC SHAPE) OPTIMIZATION ===");

// When objects share the exact same key initialization order, V8 creates identical Hidden Classes (Maps):
function createRecord(id: string, name: string) {
  return { id, name };
}

const r1 = createRecord("rec_1", "Analytics");
const r2 = createRecord("rec_2", "Billing");

console.log("Record 1:", r1);
console.log("Record 2:", r2);
