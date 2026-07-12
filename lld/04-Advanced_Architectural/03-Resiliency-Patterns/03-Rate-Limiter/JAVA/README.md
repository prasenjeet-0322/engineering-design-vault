# ⏱️ Rate Limiter Pattern — Java Implementation

Ensure you are in the `JAVA` folder.

```bash
cd "04-Advanced_Architectural/03-Resiliency-Patterns/03-Rate-Limiter/JAVA/"
javac limiter/*.java service/*.java Main.java
java Main
```

**Expected Console Output (Notice the strict mathematical enforcement resulting in HTTP 429s):**
```
==================================================
   Resiliency: Rate Limiter (Token Bucket)        
==================================================

--- Scenario 1: A burst of 4 quick requests ---
   [Limiter] ✅ Allowed. Remaining tokens: 2
Result: 200 OK: Secure Data Delivered.
   [Limiter] ✅ Allowed. Remaining tokens: 1
Result: 200 OK: Secure Data Delivered.
   [Limiter] ✅ Allowed. Remaining tokens: 0
Result: 200 OK: Secure Data Delivered.
   [Limiter] 🛑 HTTP 429 Too Many Requests! Remaining: 0
Result: 429 ERROR: Too Many Requests.

--- Scenario 2: Waiting 2 seconds for a refill ---
⏳ Sleeping for 2000ms...
   [Limiter] ✅ Allowed. Remaining tokens: 1
Result: 200 OK: Secure Data Delivered.
   [Limiter] ✅ Allowed. Remaining tokens: 0
Result: 200 OK: Secure Data Delivered.
   [Limiter] 🛑 HTTP 429 Too Many Requests! Remaining: 0
Result: 429 ERROR: Too Many Requests.
```
