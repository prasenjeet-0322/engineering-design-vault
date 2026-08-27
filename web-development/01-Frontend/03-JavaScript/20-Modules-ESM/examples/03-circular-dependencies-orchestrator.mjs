/**
 * KPI 14 (ESM) — Part 03: Circular Dependencies, Module Resolution & Stable Boundaries
 * Demonstrates:
 * 1. Gotcha: TDZ / Undefined Evaluation Trap in Circular Dependencies
 * 2. Gotcha: Decoupling Cycles via Layer Extraction (TokenProvider Leaf Module)
 * 3. Prediction 1: Downward Dependency Flow (HTTP Client -> Custom Domain Errors)
 * 4. Prediction 2: Multi-Feature Workflow Orchestration (CheckoutCoordinator)
 * 5. Practical Architecture: Standalone Enterprise Workflow Orchestrator
 */

import { getAuthToken, setAuthToken } from "./03-token-provider.mjs";

console.log("=== 1. GOTCHA: DECOUPLING CIRCULAR DEPENDENCY VIA LAYER EXTRACTION ===");

// 1. HTTP Client depends downward on TokenProvider (Zero knowledge of AuthService!)
async function secureHttpClient(endpoint) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("401 Unauthorized: Session Token Missing");
  }
  return { status: 200, data: `Payload for ${endpoint} (Auth Token Length: ${token.length})` };
}

// 2. AuthService depends downward on TokenProvider (Zero knowledge of UI or HTTP internals!)
const AuthService = {
  login: (newToken) => setAuthToken(newToken),
  logout: () => setAuthToken(null)
};

console.log("  ▶️ 1. Executing secure request with active token:");
secureHttpClient("/api/orders").then((res) => console.log("    Response:", res));

setTimeout(() => {
  console.log("\n  ▶️ 2. Invalidating token via AuthService (Simulate Logout):");
  AuthService.logout();

  secureHttpClient("/api/orders").catch((err) => {
    console.log("    🛡️ [Decoupled Error Caught Correctly]:", err.message);
  });
}, 20);

setTimeout(() => {
  console.log("\n=== 2. WORKFLOW ORCHESTRATOR: DECOUPLING CART & PAYMENT ===");

  // Independent Feature A: Cart
  class CartFeature {
    constructor() { this.items = [{ id: "SKU-1", price: 49.99 }, { id: "SKU-2", price: 19.99 }]; }
    calculateTotal() { return this.items.reduce((acc, i) => acc + i.price, 0); }
    clearCart() { this.items = []; console.log("    🛒 Cart cleared."); }
  }

  // Independent Feature B: Payment
  class PaymentFeature {
    processCharge(amount) {
      console.log(`    💳 Charging $${amount.toFixed(2)} via Payment Gateway...`);
      return { transactionId: `TXN-${Math.floor(Math.random() * 100000)}`, status: "PAID" };
    }
  }

  // 3. High-Level Orchestrator (Coordinates workflow without Cart & Payment importing each other!)
  class CheckoutCoordinator {
    constructor(cart, payment) {
      this.cart = cart;
      this.payment = payment;
    }

    executeCheckout() {
      console.log("  ▶️ 3. CheckoutCoordinator executing complete transaction:");
      const total = this.cart.calculateTotal();
      const receipt = this.payment.processCharge(total);
      this.cart.clearCart();
      return receipt;
    }
  }

  const cart = new CartFeature();
  const payment = new PaymentFeature();
  const coordinator = new CheckoutCoordinator(cart, payment);

  const receipt = coordinator.executeCheckout();
  console.log("  🎉 [Transaction Completed Successfully]:", receipt);
}, 50);
