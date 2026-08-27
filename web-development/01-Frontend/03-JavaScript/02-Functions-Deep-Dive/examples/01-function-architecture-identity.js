/**
 * KPI 02 — Part 1: Function Architecture, Declarations, Expressions & Identity
 * Demonstrates:
 * 1. Prediction 1 & 5: Function Identity & Shared Identifiers
 * 2. Prediction 2: Declaration vs Expression Hoisting Mechanics
 * 3. Prediction 3 & 4: Function Recreation in Loops / Render Simulations
 * 4. Practical Architecture: React.memo & useCallback Identity Bailout Simulation
 */

console.log("=== 1. PREDICTION 1 & 5: FUNCTION IDENTITY ===");
const fnA = function () {};
const fnB = function () {};
const fnShared = fnA;

console.log("fnA === fnB (Separate Heap instances):", fnA === fnB); // false
console.log("fnA === fnShared (Identical pointer):  ", fnA === fnShared); // true

console.log("\n=== 2. PREDICTION 2: DECLARATION VS EXPRESSION HOISTING ===");
console.log("typeof declaredFn before line of code:", typeof declaredFn); // "function"
console.log("typeof expressedVar before line of code:", typeof expressedVar); // "undefined"

try {
  // @ts-ignore
  console.log(typeof expressedConst);
} catch (err) {
  console.log("expressedConst in TDZ:", err.message); // ReferenceError
}

function declaredFn() { return "Declared"; }
var expressedVar = function () { return "Expressed Var"; };
const expressedConst = function () { return "Expressed Const"; };

console.log("\n=== 3. PREDICTION 3: FACTORY RECREATION PER INVOCATION ===");
function createHandler() {
  return () => console.log("Handler Invocation");
}

const first = createHandler();
const second = createHandler();
console.log("first === second (Separate factory allocations):", first === second); // false

console.log("\n=== 4. REACT.MEMO & USECALLBACK IDENTITY SIMULATION ===");

/**
 * Simulates React.memo shallow prop comparison for callback props
 */
class ReactComponentSimulator {
  constructor(name) {
    this.name = name;
    this.prevProps = null;
    this.renderCount = 0;
  }

  render(props) {
    if (this.prevProps && Object.is(this.prevProps.onClick, props.onClick)) {
      console.log(`⚡ [${this.name}] Prop 'onClick' unchanged -> BAILOUT (Skipped Render)!`);
      return;
    }

    this.prevProps = props;
    this.renderCount++;
    console.log(`🚀 [${this.name}] Render executed! (Total renders: ${this.renderCount})`);
  }
}

const childButton = new ReactComponentSimulator("SaveButton (React.memo)");

console.log("--- Test A: Parent Component Re-renders with Unstable Inline Function ---");
for (let render = 1; render <= 3; render++) {
  // Simulating parent re-rendering with inline arrow function:
  const inlineHandler = (id) => console.log("Save:", id);
  childButton.render({ onClick: inlineHandler });
}

console.log("\n--- Test B: Parent Component Re-renders with Stable useCallback Reference ---");
const stableUseCallbackHandler = (id) => console.log("Save:", id); // Simulating cached pointer
for (let render = 1; render <= 3; render++) {
  childButton.render({ onClick: stableUseCallbackHandler });
}
