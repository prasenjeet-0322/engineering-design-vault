# 💳 02 — Payment System (Strategy + Factory)

This case study demonstrates how a **Behavioral Pattern (Strategy)** and a **Creational Pattern (Simple Factory)** work together to build a decoupled, extensible payment system.

---

## 🧩 Patterns Combined

1. **Strategy Pattern:** Decouples the core processing logic (`PaymentProcessor`) from the specific payment mechanisms (Credit Card, PayPal, Crypto). This allows new payment methods to be added without modifying the core processor.
2. **Simple Factory:** Encapsulates the instantiation logic for the payment strategies. Instead of the processor hardcoding which strategy to create, it queries the `PaymentStrategyFactory`.

---

## 📂 Implementation Code
* [Java Implementation](./JAVA/PaymentDemo.java)
* [C++ Implementation](./C++/payment.cpp)
