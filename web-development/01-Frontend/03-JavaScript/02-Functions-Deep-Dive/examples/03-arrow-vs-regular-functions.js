/**
 * KPI 02 — Part 3: Arrow Functions vs Regular Functions
 * Demonstrates:
 * 1. Prediction 1 & 2: Expression Body vs Block Body & Object Returns
 * 2. Prediction 4: Lexical `this` vs Dynamic `this`
 * 3. Prediction 5: `arguments` Lexical Resolution
 * 4. Non-Constructible TypeError Verification
 * 5. Prototype Object Absence
 * 6. React List Memoization & Stable Handler Simulation
 */

console.log("=== 1. PREDICTION 1 & 2: BODY SEMANTICS & OBJECT RETURNS ===");
const exprReturn = () => 10;
const blockReturn = () => { 10; };
const objReturnExplicit = () => ({ name: "Sunny" });
const objReturnBlock = () => { name: "Sunny"; };

console.log("Expression body return:     ", exprReturn());        // 10
console.log("Block body return (no return):", blockReturn());      // undefined
console.log("Object literal return (()):   ", objReturnExplicit()); // { name: 'Sunny' }
console.log("Object literal return ({}):   ", objReturnBlock());    // undefined

console.log("\n=== 2. PREDICTION 4: LEXICAL THIS VS DYNAMIC THIS ===");
const user = {
  name: "Sunny",
  regularMethod() {
    return `Regular Method this.name: ${this.name}`;
  },
  arrowMethod: () => {
    // @ts-ignore
    return `Arrow Method this.name: ${this ? this.name : undefined}`;
  }
};

console.log(user.regularMethod()); // "Regular Method this.name: Sunny"
console.log(user.arrowMethod());   // "Arrow Method this.name: undefined"

console.log("\n=== 3. PREDICTION 5: ARGUMENTS LEXICAL RESOLUTION ===");
function outerFunction(a, b) {
  const innerArrow = () => `Inner Arrow reading outer arguments[0]: ${arguments[0]}`;
  return innerArrow();
}
console.log(outerFunction(10, 20)); // "...: 10"

console.log("\n=== 4. NON-CONSTRUCTIBLE TYPEERROR VERIFICATION ===");
const ArrowConstructor = () => {};
try {
  // @ts-ignore
  new ArrowConstructor();
} catch (err) {
  console.log("Caught expected constructor error:", err.message); // TypeError: ... is not a constructor
}

console.log("\n=== 5. PROTOTYPE PROPERTY COMPARISON ===");
function RegularFn() {}
const ArrowFn = () => {};

console.log("RegularFn.prototype exists:", RegularFn.prototype !== undefined); // true
console.log("ArrowFn.prototype exists:  ", ArrowFn.prototype !== undefined);   // false (0 prototype overhead!)

console.log("\n=== 6. REACT LIST MEMOIZATION SIMULATION ===");

class MemoizedRowSimulator {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.prevOnDelete = null;
    this.renders = 0;
  }

  render(onDelete) {
    if (this.prevOnDelete && Object.is(this.prevOnDelete, onDelete)) {
      console.log(`⚡ [Row ${this.name}] onDelete unchanged -> BAILOUT (Skipped re-render)!`);
      return;
    }
    this.prevOnDelete = onDelete;
    this.renders++;
    console.log(`🚀 [Row ${this.name}] Re-rendered! (Total renders: ${this.renders})`);
  }
}

const row1 = new MemoizedRowSimulator("1", "Sunny");

console.log("--- Rerendering parent with unstable inline arrow function ---");
for (let i = 1; i <= 2; i++) {
  row1.render((id) => console.log("Delete:", id)); // Unstable pointer
}

console.log("\n--- Rerendering parent with stable useCallback reference ---");
const stableDelete = (id) => console.log("Delete:", id);
for (let i = 1; i <= 2; i++) {
  row1.render(stableDelete); // Stable pointer
}
