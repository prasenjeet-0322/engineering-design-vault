/**
 * KPI 25 — Part 02: `try`, `catch`, `finally` & Synchronous Error Handling
 * Demonstrates:
 * 1. Gotcha: Return Inside finally Suppressing Thrown Exceptions
 * 2. Gotcha: Asynchronous setTimeout Escaping Synchronous try/catch
 * 3. Prediction 1: Precise Execution Flow (try -> throw -> catch -> finally)
 * 4. Prediction 2: Error Chaining with { cause }
 * 5. Practical Architecture: Standalone Resilient Pipeline Runner with Guaranteed Cleanup
 */

"use strict";

console.log("=== 1. GOTCHA: RETURN INSIDE FINALLY SUPPRESSING EXCEPTIONS ===");

function dangerousFinallyFunction() {
  try {
    throw new Error("CRITICAL_SECURITY_BREACH");
  } catch (err) {
    console.log(`  Caught in catch: "${err.message}". Attempting to re-throw...`);
    throw err; // Re-throw
  } finally {
    // 💥 FATAL FLAW: return inside finally obliterates the re-thrown error!
    return "SUPPRESSED_BY_FINALLY";
  }
}

const outcome = dangerousFinallyFunction();
console.log(`  ❌ Outcome: "${outcome}" (Error was completely silenced by finally!)`);

console.log("\n=== 2. GOTCHA: ASYNCHRONOUS CALLBACK ESCAPING SYNCHRONOUS TRY/CATCH ===");

function testAsyncCatchTrap() {
  console.log("  1. Synchronous try block begins.");
  try {
    setTimeout(() => {
      // Note: If an error is thrown here without an internal catch, Node.js triggers 'uncaughtException'
      // To simulate safely:
      console.log("    ⏰ [Timer Callback]: Executing 10ms later in a separate macrotask frame.");
    }, 10);
  } catch (err) {
    console.log("  💥 This catch block will NEVER execute for the timer callback!");
  }
  console.log("  2. Synchronous try block finishes.");
}

testAsyncCatchTrap();

console.log("\n=== 3. PREDICTION: ERROR CHAINING WITH { cause } ===");

function parseAppConfig(rawJson) {
  try {
    return JSON.parse(rawJson);
  } catch (parseErr) {
    // Wrap low-level SyntaxError into high-level Domain Error with cause
    throw new Error("Configuration Initialization Failed: Malformed JSON syntax", { cause: parseErr });
  }
}

try {
  parseAppConfig("{ invalidJson: ");
} catch (domainErr) {
  console.log(`  ✅ Caught Domain Error: "${domainErr.message}"`);
  console.log(`     Root Cause Name: "${domainErr.cause.name}" | Message: "${domainErr.cause.message}"`);
  console.log(`     Root Cause is SyntaxError: ${domainErr.cause instanceof SyntaxError}`);
}

console.log("\n=== 4. PRACTICAL ARCHITECTURE: RESILIENT PIPELINE RUNNER WITH FINALLY ===");

class ResilientPipelineRunner {
  static async runTask(taskName, taskFn, cleanupFn) {
    console.log(`  ▶️ Starting Task Pipeline: "${taskName}"`);
    let isSuccess = false;

    try {
      const result = await taskFn();
      isSuccess = true;
      console.log(`    ✅ Task "${taskName}" completed successfully.`);
      return result;
    } catch (err) {
      console.log(`    ⚠️ Task "${taskName}" encountered an error: "${err.message}"`);
      throw err; // Re-throw to caller after cleanup
    } finally {
      // 🟢 Guaranteed Cleanup Execution
      console.log(`    🧹 [Finally Block]: Executing cleanup hooks for "${taskName}" (Success Status: ${isSuccess})...`);
      cleanupFn(isSuccess);
    }
  }
}

// Execute Task
(async () => {
  let lockHeld = true;

  try {
    await ResilientPipelineRunner.runTask(
      "Financial Ledger Sync",
      async () => {
        // Simulated work that throws
        throw new Error("Ledger API Timeout");
      },
      (success) => {
        lockHeld = false;
        console.log(`      Resource lock released. Final lock state: ${lockHeld}`);
      }
    );
  } catch (e) {
    console.log(`  🛡️ Top-Level Boundary caught propagated error: "${e.message}"`);
  }

  console.log("\n  🎉 [try / catch / finally Synchronous Error Handling Verification Completed Successfully!]");
})();
