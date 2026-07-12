# 🔄 Saga Orchestrator — Java Implementation

Ensure you are in the `JAVA` folder.

```bash
cd "04-Advanced_Architectural/06-Domain-Architecture-Patterns/04-Saga-Orchestrator/JAVA/"
javac service/*.java orchestrator/*.java Main.java
java Main
```

**Expected Console Output (Notice the successful path vs the rollback path):**
```
==================================================
   Architecture: Saga Orchestrator Pattern        
==================================================

--- Scenario 1: Happy Path ---
[Saga] --- Starting Distributed Transaction: ORD-001 ---
   [Payment] Deducting $999.0 for order ORD-001
   [Inventory] Reserving Smartphone for order ORD-001
   [Shipping] Dispatching package for order ORD-001
[Saga] ✅ Full Order Complete!
[Saga] --- End of Saga Workflow ---

--- Scenario 2: Inventory Failure (Rollback Payment) ---
[Saga] --- Starting Distributed Transaction: ORD-002 ---
   [Payment] Deducting $49.0 for order ORD-002
   [Inventory] ❌ Error: OUT_OF_STOCK is unavailable!
[Saga] 🚨 Inventory Failed! Initiating Rollback...
   🔄 [Payment] REFUNDING $49.0 for order ORD-002
[Saga] --- End of Saga Workflow ---
```
