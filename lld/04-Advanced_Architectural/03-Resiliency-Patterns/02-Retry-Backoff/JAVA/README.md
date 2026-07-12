# ⏳ Retry Backoff Pattern — Java Implementation

Ensure you are in the `JAVA` folder.

```bash
cd "04-Advanced_Architectural/03-Resiliency-Patterns/02-Retry-Backoff/JAVA/"
javac service/*.java retry/*.java Main.java
java Main
```

**Expected Console Output (Notice the increasing delays):**
```
==================================================
   Resiliency: Retry & Exponential Backoff        
==================================================

--- Scenario 1: Executing Query across Network Jitter ---
   [DB] Attempting Query (Try #1)...
     -> ❌ Failed. Reason: SQL Exception: Transient Network Jitter Blocked the Request.
     ⏳ Waiting 500ms before retrying...

   [DB] Attempting Query (Try #2)...
     -> ❌ Failed. Reason: SQL Exception: Transient Network Jitter Blocked the Request.
     ⏳ Waiting 1000ms before retrying...

   [DB] Attempting Query (Try #3)...

✅ Final Result: 200 OK: User Profile Loaded via SQL.
```
