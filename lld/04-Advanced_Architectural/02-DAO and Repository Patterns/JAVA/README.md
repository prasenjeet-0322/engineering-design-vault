# 💾 DAO vs Repository — Java Implementation

Ensure you are in the `JAVA` folder.

```bash
cd "04-Advanced_Architectural/02-DAO and Repository Patterns/JAVA/"
javac model/*.java dao/*.java repository/*.java Main.java
java Main
```

**Expected Console Output:**
```
==================================================
   Data Access: DAO vs Repository Demo            
==================================================

--- Scenario 1: Adding Users via Repository ---
   [DAO] Persisted User: Alice
   [DAO] Persisted User: Bob

--- Scenario 2: Fetching Users ---
Fetched: User{id=1, name='Alice', email='alice@example.com'}
Fetched: User{id=2, name='Bob', email='bob@example.com'}
```
