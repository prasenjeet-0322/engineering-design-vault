/**
 * KPI 11 — Part 05: Async State, Race Conditions & Reliable Frontend Workflows
 * Demonstrates:
 * 1. Gotcha: Tagged Union State Machine vs Multiple Booleans
 * 2. Gotcha: Monotonic Sequence ID Invalidation (Out-of-Order Race Condition Fix)
 * 3. Prediction 1: Async Time Gap Shared Variable Mutation & Local Snapshots
 * 4. Prediction 2: Optimistic Mutation Pipeline with Rollback Cache
 * 5. Practical Architecture: Standalone Concurrency Manager with AbortController
 */

"use strict";

console.log("=== 1. TAGGED UNION ASYNC STATE MACHINE ===");

class AsyncStateMachine {
  constructor() {
    this.state = { status: "IDLE", data: null, error: null };
  }

  transition(action, payload = null) {
    const prevStatus = this.state.status;
    switch (action) {
      case "START":
        this.state = { status: "LOADING", data: null, error: null };
        break;
      case "RESOLVE":
        this.state = { status: "SUCCESS", data: payload, error: null };
        break;
      case "REJECT":
        this.state = { status: "ERROR", data: null, error: payload };
        break;
      case "RESET":
        this.state = { status: "IDLE", data: null, error: null };
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }
    console.log(`  [State Transition]: ${prevStatus} -> ${this.state.status}`);
  }
}

const fsm = new AsyncStateMachine();
fsm.transition("START");
fsm.transition("RESOLVE", { items: [1, 2, 3] });
console.log("Current Valid State:", fsm.state);

console.log("\n=== 2. SEQUENCE ID INGESTION & OUT-OF-ORDER RACE FIX ===");

class SafeSearchCoordinator {
  constructor() {
    this.latestSequenceId = 0;
    this.activeResult = "";
  }

  async search(query, delayMs) {
    const currentSeq = ++this.latestSequenceId;

    return new Promise((resolve) => {
      setTimeout(() => {
        if (currentSeq === this.latestSequenceId) {
          this.activeResult = query;
          console.log(`  ✅ [APPLIED]: Query "${query}" (Seq #${currentSeq})`);
        } else {
          console.log(`  ❌ [DISCARDED STALE]: Query "${query}" (Seq #${currentSeq}, Latest is #${this.latestSequenceId})`);
        }
        resolve();
      }, delayMs);
    });
  }
}

const coordinator = new SafeSearchCoordinator();
// Request 1: "re" (slow, takes 60ms)
// Request 2: "react" (fast, takes 20ms)
coordinator.search("re", 60);
setTimeout(() => coordinator.search("react", 20), 10);

console.log("\n=== 3. ASYNC TIME GAPS & LOCAL SNAPSHOTTING ===");

let currentTenantId = "Tenant-Alpha";

async function processTenantInvoice() {
  // 🟢 Snapshot before time gap
  const targetTenant = currentTenantId;

  // Simulate async I/O time gap
  await new Promise((r) => setTimeout(r, 40));

  console.log(`  [Invoice Processed]: For "${targetTenant}" (Safe Snapshot) vs Current Global "${currentTenantId}"`);
}

processTenantInvoice();
currentTenantId = "Tenant-Beta"; // Mutated during time gap

console.log("\n=== 4. OPTIMISTIC UI MUTATION & ROLLBACK ===");

class OptimisticStore {
  constructor() {
    this.likes = 10;
  }

  async toggleLike(shouldFail) {
    const snapshot = this.likes;
    this.likes += 1; // Optimistic update
    console.log(`  [Optimistic Update]: Likes count = ${this.likes}`);

    await new Promise((r) => setTimeout(r, 30));

    if (shouldFail) {
      console.log("  ⚠️ Server error during mutation! Rolling back...");
      this.likes = snapshot; // Rollback
      console.log(`  [Rollback Complete]: Likes restored to = ${this.likes}`);
    } else {
      console.log("  ✅ Server confirmed mutation!");
    }
  }
}

const store = new OptimisticStore();
setTimeout(() => {
  store.toggleLike(true);
}, 80);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: CONCURRENCY CONTROLLER WITH ABORT ===");

class ManagedAsyncOperation {
  constructor() {
    this.abortController = null;
    this.sequenceId = 0;
  }

  async execute(asyncWorkFn) {
    if (this.abortController) {
      this.abortController.abort();
      console.log("  🛑 Aborted previous in-flight operation.");
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const seq = ++this.sequenceId;

    try {
      const result = await asyncWorkFn(signal);
      if (seq === this.sequenceId) {
        console.log(`  🎉 [Operation #${seq} Succeeded]:`, result);
        return result;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log(`  ℹ️ [Operation #${seq} Ignored Abort]: Expected cancellation.`);
      } else {
        console.error(`  💥 [Operation #${seq} Failed]:`, err.message);
      }
    }
  }
}

const operationManager = new ManagedAsyncOperation();

setTimeout(() => {
  console.log("\nTesting ManagedAsyncOperation with Rapid Queries:");

  // Query 1: Aborted by Query 2
  operationManager.execute(async (signal) => {
    return new Promise((res, rej) => {
      const timer = setTimeout(() => res("Data for Query 1"), 50);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        rej(new DOMException("Aborted", "AbortError"));
      });
    });
  });

  // Query 2: Executes to completion
  setTimeout(() => {
    operationManager.execute(async () => {
      return "Data for Query 2";
    });
  }, 10);
}, 150);
