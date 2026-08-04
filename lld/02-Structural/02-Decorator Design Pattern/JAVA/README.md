# 🌟 Decorator — Java Implementation Guide

## 📁 Folder Structure

```
JAVA/
├── Main.java                          ← Integration Demo (Run this)
├── component/                         ← The base components
│   ├── FoodItem.java                  ← Base interface
│   ├── Burger.java
│   └── Pizza.java
└── decorator/                         ← The wrappers
    ├── FoodDecorator.java             ← Abstract Base Decorator
    ├── ExtraCheese.java
    └── ExtraToppings.java
```

---

## ▶️ How to Run

Navigate to the `JAVA/` directory and compile/run the application:

```bash
cd "02-Structural/03-Decorator Design Pattern/JAVA/"
javac component/*.java decorator/*.java Main.java
java Main
```

**Expected output:**
```
==================================================
   Decorator Pattern: Dynamic Object Wrapping     
==================================================

--- Order 1: Basic Pizza ---
Description : Base Pizza
Price       : Rs. 200.0

--- Order 2: Fully Loaded Pizza ---
Description : Base Pizza + Extra Cheese + Extra Cheese + Extra Veg Toppings
Price       : Rs. 285.0

--- Order 3: Cheese Burger ---
Description : Classic Burger + Extra Cheese
Price       : Rs. 120.0
```

---

## 📖 Full Documentation
See the top-level [`README.md`](../README.md) for conceptual explanations, FAANG interview Q&A, and real-world system design usage.
