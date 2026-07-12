# 🛡️ Circuit Breaker Pattern — Java Implementation

Ensure you are in the `JAVA` folder.

```bash
cd "04-Advanced_Architectural/03-Resiliency-Patterns/01-Circuit-Breaker/JAVA/"
javac state/*.java service/*.java breaker/*.java Main.java
java Main
```

**Expected Console Output (Notice how Attempts 6 and 7 fail INSTANTLY without the 2-second timeout delay):**
```
==================================================
   Resiliency: Circuit Breaker Demo               
==================================================

--- Scenario 1: Healthy System ---
Attempt 1: HTTP 200: Payment Processed Successfully!
Attempt 2: HTTP 200: Payment Processed Successfully!

--- Scenario 2: Stripe API Goes Down (Timeouts) ---
   [System] Failure recorded. Count: 1
Attempt 3: 🔴 Request Failed: HTTP 500: Payment Gateway Timeout!
   [System] Failure recorded. Count: 2
Attempt 4: 🔴 Request Failed: HTTP 500: Payment Gateway Timeout!
   [System] Failure recorded. Count: 3
   [System] Threshold reached! Tripping Circuit to OPEN state!
Attempt 5: 🔴 Request Failed: HTTP 500: Payment Gateway Timeout!

--- Scenario 3: Circuit Tripped (Fast Failure) ---
Attempt 6: 🛑 Circuit is OPEN: Fast-failing the request. Please try again later.
Attempt 7: 🛑 Circuit is OPEN: Fast-failing the request. Please try again later.

--- Scenario 4: Recovery Process ---
Waiting 6 seconds for Circuit Cooldown timer...
   [System] Timeout completed. Transitioning to HALF-OPEN state.
   [System] Recovery test succeeded. Transitioning back to CLOSED state.
Attempt 8: HTTP 200: Payment Processed Successfully!

--- Scenario 5: Fully Restored ---
Attempt 9: HTTP 200: Payment Processed Successfully!
```
