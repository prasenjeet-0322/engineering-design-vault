# 🏗️ Domain-Driven Design — Java Implementation

Ensure you are in the `JAVA` folder.

```bash
cd "04-Advanced_Architectural/06-Domain-Architecture-Patterns/01-Domain-Driven-Design/JAVA/"
javac domain/valueobject/*.java domain/entity/*.java domain/aggregate/*.java Main.java
java Main
```

**Expected Console Output:**
```
==================================================
   Architecture: Domain-Driven Design (DDD) Demo  
==================================================

--- Scenario: Placing a New Order ---
Order ID: [UUID]
Status: NEW
Total: 2157.99 USD

Items:
 - MacBook Pro (x1) - 1999.99 USD
 - Magic Mouse (x2) - 158.0 USD

--- Finalizing Order ---
Order finalized!
✅ Business Rule Caught: Cannot add items to COMPLETED order
```
