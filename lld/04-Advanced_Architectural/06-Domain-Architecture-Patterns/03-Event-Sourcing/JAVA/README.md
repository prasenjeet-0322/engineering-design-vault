# 🕒 Event Sourcing — Java Implementation

Ensure you are in the `JAVA` folder.

```bash
cd "04-Advanced_Architectural/06-Domain-Architecture-Patterns/03-Event-Sourcing/JAVA/"
javac event/*.java aggregate/*.java Main.java
java Main
```

**Expected Console Output (Notice the state rebuilding from history):**
```
==================================================
   Architecture: Event Sourcing Design Pattern    
==================================================

--- Scenario 1: Generating Events ---
Current State: BankAccount{id='ACT-101', owner='Alice', balance=650.0}
Events saved to SQL/NoSQL Event Store: 4

--- Scenario 2: Rebuilding State from History ---
Restored State: BankAccount{id='ACT-101', owner='Alice', balance=650.0}

✅ State restored successfully by replaying all 4 immutable events.
```
