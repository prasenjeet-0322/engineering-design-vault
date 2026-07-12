# ⚡ CQRS — Java Implementation

Ensure you are in the `JAVA` folder.

```bash
cd "04-Advanced_Architectural/06-Domain-Architecture-Patterns/02-CQRS/JAVA/"
javac command/*.java handler/*.java query/*.java Main.java
java Main
```

**Expected Console Output (Notice the separation between Write and Read operations):**
```
==================================================
   Architecture: CQRS Design Pattern Demo         
==================================================

--- Scenario: Command Execution ---
   [Write Model] Executing Command: [UUID]
   ✅ [Write Model] Updated LAPTOP-01 to 10

--- Scenario: Query Execution ---
   [Read Model] Fetching current stock for: LAPTOP-01
Current Stock from Read Model: 10

--- Scenario: Invalid Command ---
   [Write Model] Executing Command: [UUID]
   ❌ Error: Stock cannot be negative for LAPTOP-01
```
