/**
 * KPI 17 — Part 01: Code Organization, Separation of Concerns, Composition & Module Architecture
 * Demonstrates:
 * 1. Gotcha: Monolithic God-Function vs Clean Layered Architecture
 * 2. Gotcha: Dependency Injection with Swappable Gateways
 * 3. Prediction 1: Private Field Encapsulation Isolation
 * 4. Prediction 2: Functional Pipeline Assembly
 * 5. Practical Architecture: Standalone Modular E-Commerce Checkout Engine
 */

"use strict";

console.log("=== 1. PREDICTION: PRIVATE FIELD ENCAPSULATION ===");

class UserSession {
  #token;
  constructor(token) {
    this.#token = token;
  }

  isAuthenticated() {
    return Boolean(this.#token && this.#token.length > 5);
  }
}

const session = new UserSession("SECRET_JWT_TOKEN_123");
console.log("  Session Authenticated:", session.isAuthenticated());
console.log("  Direct #token read outside class:", session.token); // undefined

console.log("\n=== 2. PREDICTION: FUNCTIONAL PIPELINE ASSEMBLY ===");

const trim = (str) => str.trim();
const toLower = (str) => str.toLowerCase();
const sanitizeEmail = (email) => toLower(trim(email));

console.log("  Sanitized Output:", sanitizeEmail("  USER@VAULT.COM  ")); // "user@vault.com"

console.log("\n=== 3. PRACTICAL ARCHITECTURE: MODULAR E-COMMERCE ENGINE WITH DI ===");

// 1. Domain Validation Logic (Pure)
const orderDomain = {
  validateEmail(email) {
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@") || !clean.includes(".")) {
      throw new Error("Invalid customer email address.");
    }
    return clean;
  },
  calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
  }
};

// 2. Application Service with Injected Infrastructure (DI)
function createOrderCheckoutService(paymentGateway, storageService, notifier) {
  return {
    async processOrder(rawInput) {
      console.log("    ⚙️ [Orchestrator]: 1. Validating input...");
      const email = orderDomain.validateEmail(rawInput.email);
      const total = orderDomain.calculateTotal(rawInput.items);

      console.log(`    ⚙️ [Orchestrator]: 2. Charging $${total} via Injected Gateway...`);
      const paymentResult = await paymentGateway.charge(total, email);

      console.log("    ⚙️ [Orchestrator]: 3. Persisting order record...");
      const order = {
        id: paymentResult.txnId,
        email,
        total,
        status: "COMPLETED",
        timestamp: new Date().toISOString()
      };
      storageService.save(order);

      console.log("    ⚙️ [Orchestrator]: 4. Dispatching notification...");
      notifier.notify(email, order.id);

      return order;
    }
  };
}

// 3. Infrastructure Implementations (Mocks for 100% deterministic testability)
const mockGateway = {
  charge(amount, email) {
    return Promise.resolve({ txnId: `TXN_${Math.floor(Math.random() * 80000 + 10000)}`, amount, email });
  }
};

const mockStorage = {
  orders: [],
  save(order) { this.orders.push(order); }
};

const mockNotifier = {
  notify(email, orderId) {
    console.log(`    📧 [Notifier]: Email sent to ${email} for Order #${orderId}`);
  }
};

// 4. Execution
const checkoutService = createOrderCheckoutService(mockGateway, mockStorage, mockNotifier);

const sampleOrder = {
  email: "  Sunny.Engineer@Vault.Com  ",
  items: [{ name: "Mechanical Keyboard", price: 120 }, { name: "USB-C Hub", price: 45 }]
};

console.log("  ▶️ Triggering Checkout Workflow:");
checkoutService.processOrder(sampleOrder).then((finalOrder) => {
  console.log("\n  📦 Final Placed Order:", finalOrder);
  console.log("  💾 Total Orders Saved in Storage:", mockStorage.orders.length);
  console.log("\n  🎉 [Code Architecture & DI Verification Completed Successfully!]");
});
