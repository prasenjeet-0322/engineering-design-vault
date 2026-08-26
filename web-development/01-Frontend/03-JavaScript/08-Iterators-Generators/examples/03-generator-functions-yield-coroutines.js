/**
 * KPI 08 — Part 03: Generator Functions, yield & Two-Way Communication
 * Demonstrates:
 * 1. Gotcha: First .next(arg) Value Ignored vs Subsequent Input Injection
 * 2. Prediction 1: Interleaved Suspension and Resumption Execution Order
 * 3. Prediction 2: Two-Way Arithmetic Coroutine Data Pipeline
 * 4. Prediction 3: Spread Operator Discarding Generator return Value
 * 5. Prediction 4: Infinite Sequence Generator with Safe take(n) Bounding
 * 6. Practical Architecture: Multi-Step Interactive Form Wizard State Machine
 */

"use strict";

console.log("=== 1. GOTCHA: FIRST NEXT(ARG) VALUE IS IGNORED ===");
function* inputReceiver() {
  const initial = yield "PROMPT_1";
  console.log("[Inside Generator] Value received after first yield:", initial);
  yield `RECEIVED_${initial}`;
}

const genGotcha = inputReceiver();
// Passing argument to first next() is ignored because no yield expression is suspended yet
console.log("First .next('IGNORED'):", genGotcha.next("IGNORED")); // { value: "PROMPT_1", done: false }
// Passing argument to second next() successfully resolves the suspended yield
console.log("Second .next('SUNNY'):", genGotcha.next("SUNNY")); // { value: "RECEIVED_SUNNY", done: false }

console.log("\n=== 2. PREDICTION 1: SUSPENSION & RESUMPTION LOGGING ===");
function* loggingSequence() {
  console.log("LOG_A: Before 1st yield");
  yield 100;
  console.log("LOG_B: Before 2nd yield");
  yield 200;
  console.log("LOG_C: At completion");
}

console.log("STEP 1: Allocating generator object...");
const loggerGen = loggingSequence();
console.log("STEP 2: Calling first .next()...");
console.log("Result 1:", loggerGen.next().value);
console.log("STEP 3: Calling second .next()...");
console.log("Result 2:", loggerGen.next().value);
console.log("STEP 4: Calling final .next()...");
console.log("Result 3 (Complete):", loggerGen.next());

console.log("\n=== 3. PREDICTION 2: TWO-WAY ARITHMETIC COROUTINE ===");
function* calculatorPipeline() {
  const a = yield "Enter first operand:";
  const b = yield "Enter second operand:";
  return a * b;
}

const calc = calculatorPipeline();
console.log(calc.next().value); // "Enter first operand:"
console.log(calc.next(15).value); // "Enter second operand:"
console.log(calc.next(4)); // { value: 60, done: true }

console.log("\n=== 4. PREDICTION 3: SPREAD DISCARDING RETURN VALUE ===");
function* taskQueue() {
  yield "INITIALIZE_DATABASE";
  yield "START_HTTP_SERVER";
  return "SERVER_READY_FOR_TRAFFIC"; // Completion value
}

const collectedTasks = [...taskQueue()];
console.log("Collected tasks via spread:", collectedTasks); // ["INITIALIZE_DATABASE", "START_HTTP_SERVER"]
console.log("Collected tasks length:", collectedTasks.length); // 2

console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-STEP WIZARD SAGA ===");

function* createOnboardingSaga() {
  const user = {};
  user.name = yield "Please enter your username:";
  user.role = yield `Hello ${user.name}! What is your role (ENGINEER | ARCHITECT)?`;
  user.tier = yield `Final step for ${user.name}: Select tier (BASIC | PRO):`;
  return user;
}

const wizard = createOnboardingSaga();

// Simulate step-by-step user input submission
console.log("[Wizard Prompt]:", wizard.next().value);
console.log("[Wizard Prompt]:", wizard.next("Sunny").value);
console.log("[Wizard Prompt]:", wizard.next("ARCHITECT").value);
const finalResult = wizard.next("PRO");

console.log("[Wizard Final Result (done: true)]:", finalResult);
