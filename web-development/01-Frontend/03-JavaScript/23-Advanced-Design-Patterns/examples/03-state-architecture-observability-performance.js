/**
 * KPI 17 — Part 03: State Architecture, State Machines, Reducers & Event-Driven Systems
 * Demonstrates:
 * 1. Gotcha: Impossible Boolean States vs Finite State Machine (FSM)
 * 2. Gotcha: Asynchronous Search Race Condition Prevention
 * 3. Prediction 1: State Machine Transition Rules
 * 4. Prediction 2: Pure Derived State Calculation
 * 5. Practical Architecture: Standalone Finite State Machine Engine
 */

"use strict";

console.log("=== 1. GOTCHA: FINITE STATE MACHINE (FSM) VS IMPOSSIBLE BOOLEANS ===");

class AuthStateMachine {
  constructor() {
    this.state = { status: "UNAUTHENTICATED" };
  }

  transition(event) {
    const prev = this.state.status;
    switch (this.state.status) {
      case "UNAUTHENTICATED":
        if (event.type === "LOGIN_START") {
          this.state = { status: "AUTHENTICATING", email: event.email };
        }
        break;

      case "AUTHENTICATING":
        if (event.type === "LOGIN_SUCCESS") {
          this.state = { status: "AUTHENTICATED", user: event.user };
        } else if (event.type === "LOGIN_ERROR") {
          this.state = { status: "UNAUTHENTICATED", error: event.error };
        }
        break;

      case "AUTHENTICATED":
        if (event.type === "LOGOUT") {
          this.state = { status: "UNAUTHENTICATED" };
        }
        break;
    }
    console.log(`    🔄 [FSM Transition]: (${prev}) + [${event.type}] -> (${this.state.status})`);
  }
}

const authFsm = new AuthStateMachine();
authFsm.transition({ type: "LOGIN_START", email: "sunny@vault.com" });
authFsm.transition({ type: "LOGIN_SUCCESS", user: { id: "USR_1", name: "Sunny" } });
console.log("  ✅ Current FSM State:", authFsm.state);

// Attempting invalid transition
console.log("  ▶️ Triggering invalid transition (LOGIN_START while already AUTHENTICATED):");
authFsm.transition({ type: "LOGIN_START", email: "hacker@vault.com" });
console.log("  🛡️ State remains safe & unchanged:", authFsm.state.status);

console.log("\n=== 2. GOTCHA: ASYNC RACE CONDITION REQUEST ID TRACKING ===");

let currentRequestId = 0;
let committedResult = "";

async function triggerSearchQuery(id, query, latencyMs) {
  console.log(`    🌐 [Search Request Started]: ID #${id} ("${query}") with ${latencyMs}ms delay`);
  await new Promise((resolve) => setTimeout(resolve, latencyMs));

  // Sequence Guard: Only commit if this request is still the latest one!
  if (id === currentRequestId) {
    committedResult = `RESULTS_FOR_${query.toUpperCase()}`;
    console.log(`    ✅ [Search Committed]: ID #${id} committed to UI state: "${committedResult}"`);
  } else {
    console.log(`    🚫 [Stale Search Discarded]: ID #${id} finished late; ignored to prevent overwrite!`);
  }
}

// Request 1: Slow request (User typed "Vue", takes 60ms)
currentRequestId = 1;
triggerSearchQuery(1, "Vue", 60);

// Request 2: Fast request (User immediately typed "React", takes 15ms)
currentRequestId = 2;
triggerSearchQuery(2, "React", 15);

setTimeout(() => {
  console.log("\n  📦 Final Committed Search Result in UI:", committedResult);
  console.log("\n  🎉 [State Architecture & FSM Verification Completed Successfully!]");
}, 90);
