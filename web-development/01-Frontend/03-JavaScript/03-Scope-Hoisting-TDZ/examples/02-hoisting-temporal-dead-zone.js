/**
 * KPI 03 — Part 02: Hoisting, var, let, const & the Temporal Dead Zone (TDZ)
 * Demonstrates:
 * 1. Gotcha & Prediction 2: let Hoisting & TDZ ReferenceError
 * 2. Prediction 1: var Hoisting with Initial undefined
 * 3. Prediction 3: Shadowing inside the TDZ
 * 4. Prediction 4: Function Declaration vs var Expression (TypeError) vs const Expression (ReferenceError)
 * 5. Prediction 5: let Declaration Without Initializer
 * 6. Practical Architecture: Immutable Session State Manager
 */

console.log("=== 1. GOTCHA & PREDICTION 2: LET HOISTING & TDZ ===");
try {
  // @ts-ignore
  console.log(user);
  let user = "Sunny";
} catch (err) {
  console.log("TDZ Caught:", err.name, `(${err.message})`);
}

console.log("\n=== 2. PREDICTION 1: VAR HOISTING ===");
console.log("Accessing 'score' before assignment:", score); // undefined
var score = 100;
console.log("Accessing 'score' after assignment:", score);  // 100

console.log("\n=== 3. PREDICTION 3: SHADOWING INSIDE TDZ ===");
const outerValue = "outer";

function testShadowingTDZ() {
  try {
    // Attempting to access outerValue will fail because local 'const outerValue' shadows it in TDZ
    // @ts-ignore
    console.log(outerValue);
    const outerValue = "inner";
  } catch (err) {
    console.log("Shadowing TDZ Caught:", err.name, `(${err.message})`);
  }
}
testShadowingTDZ();

console.log("\n=== 4. PREDICTION 4: FUNCTION DECLARATION VS EXPRESSION HOISTING ===");

// A. Function Declaration (Fully Hoisted)
console.log("Invoking hoisted function declaration:", hoistedFunction());

function hoistedFunction() {
  return "Declaration invoked successfully!";
}

// B. var Function Expression (Hoisted as undefined -> TypeError)
try {
  // @ts-ignore
  varExpression();
} catch (err) {
  console.log("var expression call caught:", err.name, `(${err.message})`);
}

var varExpression = function() {
  return "Var expression body";
};

// C. const Function Expression (Uninitialized in TDZ -> ReferenceError)
try {
  // @ts-ignore
  constExpression();
} catch (err) {
  console.log("const expression call caught:", err.name, `(${err.message})`);
}

const constExpression = function() {
  return "Const expression body";
};

console.log("\n=== 5. PREDICTION 5: LET WITHOUT INITIAL VALUE ===");
let initializedLater;
console.log("let initializedLater before assignment:", initializedLater); // undefined
initializedLater = 250;
console.log("let initializedLater after assignment:", initializedLater);  // 250

console.log("\n=== 6. PRACTICAL ARCHITECTURE: IMMUTABLE SESSION STATE MANAGER ===");

function createFrozenSession(session) {
  return Object.freeze({ ...session });
}

class UserSessionManager {
  constructor(initialSession) {
    this.currentSession = createFrozenSession(initialSession);
  }

  getSession() {
    return this.currentSession;
  }

  updateEmail(newEmail) {
    // Guarantee fresh referential equality for React.memo / Object.is() checks
    this.currentSession = createFrozenSession({
      ...this.currentSession,
      email: newEmail,
      lastActiveTimestamp: Date.now()
    });
    console.log(`[Session] Email updated to: ${newEmail}`);
    return this.currentSession;
  }
}

const manager = new UserSessionManager({
  userId: "usr_9812",
  email: "sunny@enterprise.io",
  role: "admin",
  lastActiveTimestamp: Date.now()
});

const session1 = manager.getSession();
const session2 = manager.updateEmail("architect@enterprise.io");

console.log("session1 !== session2 (Referential Change):", session1 !== session2); // true
console.log("session1 email:", session1.email); // "sunny@enterprise.io"
console.log("session2 email:", session2.email); // "architect@enterprise.io"
